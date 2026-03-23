import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Найти товары по фильтрам (бренд, цена, размер, статус и т.д.)',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Бренд (Nike, Adidas, New Balance и т.д.)' },
          model: { type: 'string', description: 'Модель или часть названия' },
          minPrice: { type: 'number', description: 'Минимальная цена розницы (Br)' },
          maxPrice: { type: 'number', description: 'Максимальная цена розницы (Br)' },
          size: { type: 'string', description: 'Размер EU' },
          status: { type: 'string', enum: ['available', 'preorder', 'sold_out'] },
          category: { type: 'string', enum: ['sport', 'lifestyle', 'limited'] },
          supplier: { type: 'string', description: 'Поставщик' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_update_products',
      description: 'Массово обновить товары по фильтрам. ОПАСНО — требует подтверждения пользователя!',
      parameters: {
        type: 'object',
        properties: {
          searchFilters: {
            type: 'object',
            description: 'Фильтры для поиска обновляемых товаров',
            properties: {
              brand: { type: 'string' },
              model: { type: 'string' },
              minPrice: { type: 'number' },
              maxPrice: { type: 'number' },
              status: { type: 'string' },
              category: { type: 'string' },
              supplier: { type: 'string' },
            },
          },
          changes: {
            type: 'object',
            description: 'Изменения для всех найденных товаров',
            properties: {
              retailPrice: { type: 'number', description: 'Новая розничная цена (Br)' },
              purchasePrice: { type: 'number', description: 'Новая закупочная цена (Br)' },
              priceMultiplier: { type: 'number', description: 'Множитель цены (1.2 = +20%, 0.9 = -10%)' },
              status: { type: 'string', enum: ['available', 'preorder', 'sold_out'] },
              supplier: { type: 'string' },
              category: { type: 'string', enum: ['sport', 'lifestyle', 'limited'] },
            },
          },
        },
        required: ['searchFilters', 'changes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_product',
      description: 'Создать новый товар (или несколько размеров) в каталоге',
      parameters: {
        type: 'object',
        properties: {
          brand: { type: 'string', description: 'Бренд' },
          model: { type: 'string', description: 'Модель' },
          sizes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Размеры EU (например ["42","43","44"])',
          },
          purchasePrice: { type: 'number', description: 'Закупочная цена (Br)' },
          retailPrice: { type: 'number', description: 'Розничная цена (Br)' },
          supplier: { type: 'string', description: 'Поставщик' },
          status: { type: 'string', enum: ['available', 'preorder'] },
          color: { type: 'string', description: 'Цвет/колорвей' },
          category: { type: 'string', enum: ['sport', 'lifestyle', 'limited'] },
          expectedDate: { type: 'string', description: 'Дата ожидания для предзаказа (YYYY-MM-DD)' },
          notes: { type: 'string', description: 'Заметки' },
        },
        required: ['brand', 'model', 'sizes'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_product',
      description: 'Удалить товар из каталога. КРИТИЧНО — всегда требует подтверждения!',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID товара в Firebase' },
          productName: { type: 'string', description: 'Название товара для подтверждения' },
        },
        required: ['productId', 'productName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_report',
      description: 'Сгенерировать отчёт (продажи, остатки, топ товары и т.д.)',
      parameters: {
        type: 'object',
        properties: {
          reportType: {
            type: 'string',
            enum: ['sales_summary', 'inventory', 'low_stock', 'top_products', 'no_photo'],
            description: 'Тип отчёта',
          },
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year', 'all'],
            description: 'Период для отчёта по продажам',
          },
        },
        required: ['reportType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_order',
      description: 'Обновить статус предзаказа',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: 'ID предзаказа' },
          status: { type: 'string', enum: ['pending', 'arrived', 'cancelled'] },
          notes: { type: 'string', description: 'Комментарий' },
        },
        required: ['orderId', 'status'],
      },
    },
  },
];

const CONFIRMATION_REQUIRED = new Set(['delete_product', 'bulk_update_products']);

function previewMessage(toolName: string, params: Record<string, unknown>): string {
  switch (toolName) {
    case 'bulk_update_products': {
      const filters = params.searchFilters as Record<string, unknown> | undefined;
      const changes = params.changes as Record<string, unknown> | undefined;
      const filterDesc = filters
        ? Object.entries(filters)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : '';
      const changeDesc = changes
        ? Object.entries(changes)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => {
              if (k === 'priceMultiplier') return `цена × ${v}`;
              return `${k} → ${v}`;
            })
            .join(', ')
        : '';
      return `Массовое обновление товаров (${filterDesc || 'все'}) — изменить: ${changeDesc}`;
    }
    case 'delete_product':
      return `Удалить товар: "${params.productName}"`;
    default:
      return `Выполнить: ${toolName}`;
  }
}

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { command, conversationHistory = [] } = JSON.parse(event.body || '{}') as {
      command: string;
      conversationHistory: Array<{ role: string; content: string }>;
    };

    if (!command?.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Команда не указана' }),
      };
    }

    const systemPrompt = `Ты AI-агент для управления магазином кроссовок HQF Sneakers (Минск, Беларусь).

Твоя задача:
1. Понять что хочет пользователь на русском языке
2. Выбрать правильный инструмент (tool) с нужными параметрами
3. Для массовых изменений или удаления — инструмент будет помечен как требующий подтверждения

Контекст магазина:
- Валюта: белорусские рубли (Br)
- Бренды: Nike, Adidas, New Balance, Asics, Puma, Reebok
- Размеры EU: 35–47
- Статусы: available, preorder, sold_out
- Категории: sport, lifestyle, limited

Если команда не требует инструмента (например, просто вопрос) — ответь текстом на русском языке с эмодзи.
Всегда отвечай дружелюбно и кратко.`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory as OpenAI.Chat.ChatCompletionMessageParam[]),
      { role: 'user', content: command },
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1000,
      temperature: 0.3,
    });

    const choice = response.choices[0];
    const toolCall = choice.message.tool_calls?.[0];

    if (toolCall) {
      const toolName = toolCall.function.name;
      const toolParams = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const requiresConfirmation = CONFIRMATION_REQUIRED.has(toolName);
      const preview = requiresConfirmation ? previewMessage(toolName, toolParams) : undefined;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: { tool: toolName, params: toolParams },
          requiresConfirmation,
          preview,
          message: choice.message.content || '',
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: choice.message.content || 'Готово!',
      }),
    };
  } catch (error: unknown) {
    console.error('AI Agent error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Ошибка AI-агента', details: msg }),
    };
  }
};
