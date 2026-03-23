import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const systemPrompt = `Ты AI-ассистент для магазина кроссовок в Беларуси. 
Твоя задача: распознавать товары по фото или текстовому описанию и возвращать структурированные данные.

ВАЖНО - РЕАЛЬНЫЕ АРТИКУЛЫ:
- Пытайся распознать ОФИЦИАЛЬНЫЙ артикул производителя с коробки, бирки или используй свою базу знаний
- Для Nike: формат "XXXXXX-XXX" (например "553558-207", "DM9467-500")
- Для Adidas: формат "XXXXXX" или "XXXXXX-XXX" (например "GZ2864", "FZ5246")
- Для New Balance: формат "MXXXXXX" или "UXXXXXX" (например "ML574EVE")
- Если артикул не виден на фото и не можешь определить из базы знаний - оставь пустым

СТАТУС ТОВАРА:
- Если пользователь упоминает "предзаказ", "ожидается", "будет через", "скоро поступит" - status: "preorder"
- Иначе - status: "available"

ДАТА ПРЕДЗАКАЗА:
- Если указана конкретная дата ("10 апреля", "2026-04-10") - используй её
- Если "через N дней/недель" - рассчитай от сегодняшней даты
- По умолчанию для предзаказа: +14 дней от сегодня

Верни JSON в формате:
{
  "brand": "Nike",
  "model": "Air Jordan 1 Low",
  "modelArticle": "553558-207",
  "color": "Shadow Brown",
  "sizes": ["39", "40", "41"],
  "quantity": 1,
  "purchasePrice": 370,
  "retailPrice": 89,
  "supplier": "Текс.смена",
  "category": "sport",
  "status": "available",
  "expectedDate": "2026-04-10",
  "notes": ""
}

Правила:
- sizes - массив строк EU размеров (например ["39", "40", "41"])
- modelArticle - РЕАЛЬНЫЙ артикул производителя или пустая строка
- category: "sport" | "lifestyle" | "limited"
- status: "available" | "preorder"
- expectedDate - только для предзаказов, формат YYYY-MM-DD
- цены в белорусских рублях (Br)
- если информации нет, оставь поле пустым или null

Также добавь поле "message" с дружелюбным ответом пользователю на русском.`;

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

    const completion = await openai.chat.completions.create({
      model: image ? 'gpt-4o' : 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        structured: result,
        message: result.message || 'Данные успешно распознаны!',
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
