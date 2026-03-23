import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Курсы валют (обновляйте вручную с http://myfin.by/)
// Последнее обновление: 2026-03-23
const EXCHANGE_RATES = {
  USD_TO_BYN: 3.20,
  EUR_TO_BYN: 3.50,
  RUB_TO_BYN: 0.035,
  CNY_TO_BYN: 0.44,
};

// Функция конвертации
function convertToBYN(amount: number, currency: string): number {
  const upperCurrency = currency.toUpperCase();
  if (upperCurrency === 'USD' || upperCurrency === '$') {
    return Math.round(amount * EXCHANGE_RATES.USD_TO_BYN);
  }
  if (upperCurrency === 'EUR' || upperCurrency === '€') {
    return Math.round(amount * EXCHANGE_RATES.EUR_TO_BYN);
  }
  if (upperCurrency === 'RUB' || upperCurrency === '₽') {
    return Math.round(amount * EXCHANGE_RATES.RUB_TO_BYN);
  }
  if (upperCurrency === 'CNY' || upperCurrency === '¥') {
    return Math.round(amount * EXCHANGE_RATES.CNY_TO_BYN);
  }
  return amount; // Already BYN
}

// Функция валидации ответа AI
function validateAIResponse(data: any): { valid: boolean; error?: string } {
  if (!data.brand || typeof data.brand !== 'string' || data.brand.trim() === '') {
    return { valid: false, error: 'Brand is required' };
  }

  if (!data.model || typeof data.model !== 'string' || data.model.trim() === '') {
    return { valid: false, error: 'Model is required' };
  }

  if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
    return { valid: false, error: 'At least one size is required' };
  }

  if (!['sport', 'lifestyle', 'limited'].includes(data.category)) {
    data.category = 'lifestyle'; // Default fallback
  }

  if (!['available', 'preorder'].includes(data.status)) {
    data.status = 'available'; // Default fallback
  }

  return { valid: true };
}

// Функция с retry
async function callOpenAIWithRetry(
  messages: any[],
  maxRetries: number = 2
): Promise<any> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 1000,
        temperature: 0.3,
      });

      const structured = JSON.parse(completion.choices[0].message.content || '{}');

      // Валидация
      const validation = validateAIResponse(structured);
      if (!validation.valid) {
        if (attempt < maxRetries) {
          console.log(`Validation failed (attempt ${attempt + 1}), retrying...`);
          // Добавить подсказку в следующий запрос
          messages.push({
            role: 'assistant',
            content: JSON.stringify(structured),
          });
          messages.push({
            role: 'user',
            content: `Ошибка валидации: ${validation.error}. Пожалуйста, исправь и верни корректный JSON.`,
          });
          continue;
        }
        throw new Error(validation.error);
      }

      return structured;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries) {
        // Подождать перед повтором
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

export const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { image, command } = JSON.parse(event.body || '{}');

    if (!image && !command) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Требуется image или command' }),
      };
    }

    // Промпт для GPT
    const today = new Date().toISOString().split('T')[0];
    const preorderDefault = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const systemPrompt = `Ты AI-ассистент для магазина кроссовок HQF Sneakers в Минске, Беларусь.
Твоя задача: распознавать товары по фото или текстовому описанию и возвращать структурированные данные.

КОНТЕКСТ МАГАЗИНА:
- Локация: Минск, Беларусь
- Специализация: lifestyle и спортивные кроссовки
- Популярные бренды: Nike, Adidas, New Balance, Asics, Puma, Reebok
- Типичная наценка: 15-30% от закупочной цены
- Основные поставщики: Текс.смена, AI Import, Poizon, StockX
- Валюта: белорусский рубль (Br, BYN)

ВАЖНО - РЕАЛЬНЫЕ АРТИКУЛЫ ПРОИЗВОДИТЕЛЯ:
Пытайся распознать ОФИЦИАЛЬНЫЙ артикул с коробки, бирки или используй свою базу знаний.

Форматы артикулов по брендам:
- Nike: XXXXXX-XXX (например: DV0833-100, FD0774-001, DZ5485-612, 553558-207)
- Adidas: буквы+цифры (например: GZ2864, IE8582, IG6423, HQ6915)
- New Balance: буква+цифры+буквы (например: U574LGG, M2002RDA, ML574EVE)
- Asics: цифры-цифры (например: 1201A789-100, 1011B468-001)
- Puma: цифры-цифры (например: 396463-01, 384412-02)
- Reebok: буквы+цифры (например: GW0438, FZ1090)

Если артикул не виден на фото и не можешь определить из базы знаний - оставь пустым.

ЦЕНЫ И ВАЛЮТА:
- Все цены указывай в белорусских рублях (Br)
- Если видишь цену в USD ($) - умножь на ${EXCHANGE_RATES.USD_TO_BYN}
- Если видишь цену в EUR (€) - умножь на ${EXCHANGE_RATES.EUR_TO_BYN}
- Если видишь цену в RUB (₽) - умножь на ${EXCHANGE_RATES.RUB_TO_BYN}
- Если видишь цену в CNY (¥) - умножь на ${EXCHANGE_RATES.CNY_TO_BYN}
- Округляй до целых чисел
- purchasePrice обычно на 20-30% меньше retailPrice
- Типичная розничная цена кроссовок: 80-300 Br

РАЗМЕРЫ:
- Указывай EU размеры (35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46)
- Если видишь US размеры - конвертируй в EU:
  US 7 = EU 40, US 8 = EU 41, US 9 = EU 42, US 10 = EU 43, US 11 = EU 44

СТАТУС ТОВАРА:
- Если пользователь упоминает "предзаказ", "ожидается", "будет через", "скоро поступит", "в пути" → status: "preorder"
- Иначе → status: "available"

ДАТА ПРЕДЗАКАЗА:
- Если указана конкретная дата ("10 апреля", "2026-04-10") - используй её
- Если "через N дней/недель" - рассчитай от сегодняшней даты (сегодня ${today})
- По умолчанию для предзаказа: +14 дней от сегодня

КАТЕГОРИЯ:
- sport: беговые кроссовки, футбольная обувь, баскетбольные
- lifestyle: повседневные кроссовки, классические модели
- limited: лимитированные релизы, коллаборации, редкие модели

ПРИМЕРЫ ПРАВИЛЬНЫХ ОТВЕТОВ:

Пример 1 - Фото с коробкой Nike:
Вход: Фото Nike Dunk Low, на коробке видно "DV0833-100", размер 42
Выход: {
  "brand": "Nike",
  "model": "Dunk Low",
  "modelArticle": "DV0833-100",
  "color": "White/Black",
  "sizes": ["42"],
  "quantity": 1,
  "purchasePrice": 250,
  "retailPrice": 320,
  "supplier": "",
  "category": "lifestyle",
  "status": "available",
  "expectedDate": "",
  "notes": "",
  "message": "Распознал Nike Dunk Low (артикул DV0833-100), размер 42. Всё выглядит отлично! 👟"
}

Пример 2 - Голосовая команда:
Вход: "добавь джорданы первые лоу размеры 42-44 цена закупка 370 продажа 89"
Выход: {
  "brand": "Nike",
  "model": "Air Jordan 1 Low",
  "modelArticle": "",
  "color": "",
  "sizes": ["42", "43", "44"],
  "quantity": 1,
  "purchasePrice": 370,
  "retailPrice": 89,
  "supplier": "",
  "category": "lifestyle",
  "status": "available",
  "expectedDate": "",
  "notes": "",
  "message": "Понял! Nike Air Jordan 1 Low, размеры 42-44. Закупка 370 Br, продажа 89 Br. ✅"
}

Пример 3 - Предзаказ:
Вход: "предзаказ нью бэлэнс 574 размер 43 ожидается через 2 недели поставщик текс.смена"
Выход: {
  "brand": "New Balance",
  "model": "574",
  "modelArticle": "",
  "color": "",
  "sizes": ["43"],
  "quantity": 1,
  "purchasePrice": 0,
  "retailPrice": 0,
  "supplier": "Текс.смена",
  "category": "lifestyle",
  "status": "preorder",
  "expectedDate": "${preorderDefault}",
  "notes": "Предзаказ, ожидается через 2 недели",
  "message": "Создал предзаказ на New Balance 574, размер 43. Ожидается через 2 недели от поставщика Текс.смена. 📦"
}

Пример 4 - Цена в долларах:
Вход: Фото кроссовок, цена $95
Выход: {
  "brand": "...",
  "model": "...",
  "modelArticle": "",
  "color": "",
  "sizes": [],
  "quantity": 1,
  "purchasePrice": 304,
  "retailPrice": 0,
  "supplier": "",
  "category": "lifestyle",
  "status": "available",
  "expectedDate": "",
  "notes": "",
  "message": "Распознал товар. Закупочная цена $95 = 304 Br (курс ${EXCHANGE_RATES.USD_TO_BYN}). 💵"
}

ПРАВИЛА ВАЛИДАЦИИ:
- brand обязателен (не может быть пустым)
- model обязателен (не может быть пустым)
- sizes должен содержать хотя бы один размер
- sizes - массив строк EU размеров (например ["39", "40", "41"])
- modelArticle - РЕАЛЬНЫЙ артикул производителя или пустая строка
- category: "sport" | "lifestyle" | "limited"
- status: "available" | "preorder"
- expectedDate - только для предзаказов, формат YYYY-MM-DD
- purchasePrice и retailPrice - числа в белорусских рублях
- quantity - целое число >= 1

Верни JSON в точном формате:
{
  "brand": string,
  "model": string,
  "modelArticle": string,
  "color": string,
  "sizes": string[],
  "quantity": number,
  "purchasePrice": number,
  "retailPrice": number,
  "supplier": string,
  "category": "sport" | "lifestyle" | "limited",
  "status": "available" | "preorder",
  "expectedDate": string,
  "notes": string,
  "message": string
}

Поле "message" должно содержать дружелюбный ответ пользователю на русском языке с эмодзи.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Если есть фото - используем Vision API
    if (image) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: command || 'Распознай товар на фото и верни структурированные данные',
          },
          {
            type: 'image_url',
            image_url: { url: image },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: command,
      });
    }

    const structured = await callOpenAIWithRetry(messages);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        structured,
        message: structured.message || 'Данные успешно распознаны!',
      }),
    };
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Ошибка обработки запроса',
        details: error.message,
      }),
    };
  }
};
