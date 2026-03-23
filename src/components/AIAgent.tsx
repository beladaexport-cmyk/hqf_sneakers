import React, { useState, useRef, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Bot, Send, Mic, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import {
  searchProducts,
  bulkUpdateProducts,
  createProduct,
  deleteProduct,
  generateReport,
  updateOrder,
  createSale,
  createClientPreorder,
  getSalesStatistics,
  updateSale,
  searchSales,
  addProductImage,
  addSizeToProduct,
  addMultipleSizes,
  findProductByName,
  SearchFilters,
  ProductChanges,
  CreateProductParams,
  CreateSaleParams,
  CreateClientPreorderParams,
} from '../services/aiTools';
import { logAction } from '../services/aiHistory';
import AIHistoryLog from './AIHistoryLog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PendingAction {
  tool: string;
  params: Record<string, unknown>;
  preview: string;
  originalMessage: string;
}

const QUICK_COMMANDS = [
  { label: '📊 Продажи за неделю', command: 'покажи статистику продаж за неделю' },
  { label: '📦 Состояние склада', command: 'покажи состояние склада' },
  { label: '⚠️ Низкие остатки', command: 'покажи товары с низким остатком' },
  { label: '🏆 Топ товары', command: 'покажи топ-10 популярных товаров' },
  { label: '📈 Статистика сегодня', command: 'статистика за сегодня' },
  { label: '📊 Продажи сегодня', command: 'найди все продажи за сегодня' },
  { label: '🔍 Найти Nike', command: 'найди все найки' },
  { label: '🛒 Предзаказ клиента', command: 'создай предзаказ' },
];

const AIAgent: React.FC = () => {
  const [command, setCommand] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [historyKey, setHistoryKey] = useState(0);
  const [products, setProducts] = useState<Array<{ id: string; brand: string; model: string; color?: string; sizes?: string[]; sku?: string; [key: string]: unknown }>>([]);
  const [preorders, setPreorders] = useState<Array<{ id: string; [key: string]: unknown }>>([]);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, pendingAction]);

  // Load products and preorders from Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const loadedProducts = productsSnapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as { brand: string; model: string; color?: string; sizes?: string[]; sku?: string }),
        }));
        setProducts(loadedProducts);

        const preordersSnapshot = await getDocs(collection(db, 'preorders'));
        const loadedPreorders = preordersSnapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));
        setPreorders(loadedPreorders);
      } catch (err) {
        console.error('Error loading data for AI agent:', err);
      }
    };
    loadData();
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setConversation(prev => [...prev, { role, content }]);
  };

  // Execute a tool and return the result message
  const executeTool = async (tool: string, params: Record<string, unknown>): Promise<{
    success: boolean;
    message: string;
    canUndo?: boolean;
    undoData?: unknown;
  }> => {
    switch (tool) {
      case 'search_products':
        return searchProducts(params as SearchFilters);

      case 'bulk_update_products': {
        const { searchFilters, changes } = params as {
          searchFilters: SearchFilters;
          changes: ProductChanges;
        };
        return bulkUpdateProducts(searchFilters, changes);
      }

      case 'create_product':
        return createProduct(params as unknown as CreateProductParams);

      case 'delete_product': {
        const { productId } = params as { productId: string };
        return deleteProduct(productId);
      }

      case 'generate_report': {
        const { reportType, period } = params as { reportType: string; period?: string };
        return generateReport(reportType, period);
      }

      case 'update_order': {
        const { orderId, status, notes } = params as {
          orderId: string;
          status: string;
          notes?: string;
        };
        return updateOrder(orderId, status, notes);
      }

      case 'create_sale':
        return createSale(params as unknown as CreateSaleParams);

      case 'create_preorder':
        return createClientPreorder(params as unknown as CreateClientPreorderParams);

      case 'get_statistics': {
        const { period } = params as { period: 'today' | 'week' | 'month' | 'all' };
        return getSalesStatistics(period);
      }

      case 'update_sale':
        return updateSale(params as Parameters<typeof updateSale>[0]);

      case 'search_sales':
        return searchSales(params as Parameters<typeof searchSales>[0]);

      case 'add_product_image':
        return addProductImage(params as { productSku: string; imageUrl: string });

      default:
        return { success: false, message: `Неизвестный инструмент: ${tool}` };
    }
  };

  const sendCommand = async (commandText?: string) => {
    const text = (commandText ?? command).trim();
    if (!text || isProcessing) return;

    setCommand('');
    setError('');
    setIsProcessing(true);
    addMessage('user', text);

    try {
      // Detect "добавить размер" intent
      const addSizePatterns = [
        /добав[ьи]\s+размеры?\s+([\d\s.]+)\s+к\s+(.+)/i,
        /добав[ьи]\s+([\d.]+)\s+размер\s+к\s+(.+)/i,
        /размер\s+([\d.]+)\s+добав[ьи]\s+к\s+(.+)/i,
      ];

      let sizeActionDetected = false;

      for (const pattern of addSizePatterns) {
        const match = text.match(pattern);
        if (match) {
          sizeActionDetected = true;

          const sizesRaw = match[1].trim();
          const productSearch = match[2]
            .trim()
            .replace(/,.*?(количество|закупка).*/gi, '')
            .trim();

          // Parse sizes (could be "42" or "41 42 43")
          const sizes = sizesRaw.split(/\s+/).filter(s => s.match(/^\d+\.?\d*$/));

          // Extract quantity if mentioned
          const qtyMatch = text.match(/количество\s+(\d+)/i);
          const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;

          // Extract purchase price if mentioned
          const priceMatch = text.match(/закупка\s+(\d+)/i);
          const purchasePrice = priceMatch ? Number(priceMatch[1]) : 0;

          // Find product
          const product = findProductByName(products, productSearch);

          if (!product) {
            addMessage('assistant',
              `❌ Товар "${productSearch}" не найден в каталоге.\n\nДоступные товары:\n${products
                .slice(0, 20)
                .map(p => `• ${p.brand} ${p.model} ${p.color || ''}`)
                .join('\n')}`
            );
            break;
          }

          let result;
          if (sizes.length > 1) {
            result = await addMultipleSizes(
              product.id,
              `${product.brand} ${product.model}`,
              sizes,
              quantity,
              purchasePrice
            );
          } else {
            result = await addSizeToProduct(
              product.id,
              `${product.brand} ${product.model}`,
              sizes[0],
              quantity,
              purchasePrice
            );
          }

          const currentSizes = (product.sizes as string[] | undefined) || [];
          const newSizes = [...currentSizes, ...sizes.map(String)];
          const uniqueSizes = [...new Set(newSizes)].sort((a, b) => Number(a) - Number(b));

          addMessage('assistant',
            result.message + `\n\n📦 Текущие размеры ${product.brand} ${product.model}:\n${uniqueSizes.join(', ')}`
          );

          // Reload products after update
          const updatedSnapshot = await getDocs(collection(db, 'products'));
          const updatedProducts = updatedSnapshot.docs.map(d => ({
            id: d.id,
            ...(d.data() as { brand: string; model: string; color?: string; sizes?: string[]; sku?: string }),
          }));
          setProducts(updatedProducts);

          break;
        }
      }

      if (sizeActionDetected) {
        setIsProcessing(false);
        return;
      }

      // Prepare preorders context for AI
      const preordersContext = preorders.map(p => ({
        id: p.id,
        customerName: p.customerName || p.buyerName || p.client || '',
        productName: p.productName || p.product || p.modelName || '',
        size: p.size || p.sizeEU || '',
        price: p.price || p.retailPrice || '',
        status: p.status || '',
        createdAt: p.createdAt || '',
        instagram: p.instagram || p.customerContact || '',
        prepayment: p.prepayment || p.deposit || p.advance || '',
        notes: p.notes || p.comment || '',
      }));

      const response = await fetch('/.netlify/functions/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: text,
          conversationHistory: conversation.slice(-10),
          preorders: preordersContext,
          preordersCount: preorders.length,
          productsCount: products.length,
        }),
      });

      if (!response.ok) throw new Error('Ошибка запроса к AI-агенту');

      const data = await response.json() as {
        success: boolean;
        message?: string;
        action?: { tool: string; params: Record<string, unknown> };
        requiresConfirmation?: boolean;
        preview?: string;
        error?: string;
      };

      if (!data.success) {
        throw new Error(data.error || 'Ошибка AI-агента');
      }

      if (data.action) {
        const { tool, params } = data.action;

        if (data.requiresConfirmation) {
          // Show confirmation dialog — don't execute yet
          setPendingAction({
            tool,
            params,
            preview: data.preview || `Выполнить: ${tool}`,
            originalMessage: text,
          });
          addMessage('assistant', `⚠️ Требуется подтверждение!\n\n${data.preview || ''}`);
        } else {
          // Execute immediately
          if (data.message) addMessage('assistant', data.message);
          const result = await executeTool(tool, params);
          addMessage('assistant', result.message);

          // Log to history
          await logAction({
            timestamp: new Date().toISOString(),
            command: text,
            toolUsed: tool,
            parameters: params,
            result: result.message,
            success: result.success,
            canUndo: result.canUndo ?? false,
            undoData: result.undoData,
          });

          setHistoryKey(k => k + 1);
        }
      } else {
        // Plain text response — no tool needed
        addMessage('assistant', data.message || 'Готово!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setError(msg);
      addMessage('assistant', `❌ ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsConfirming(true);

    try {
      const result = await executeTool(pendingAction.tool, pendingAction.params);

      // Replace confirmation message with result
      setConversation(prev => {
        const updated = [...prev];
        // Find and replace the last assistant confirmation message
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant' && updated[i].content.startsWith('⚠️')) {
            updated[i] = { role: 'assistant', content: result.message };
            break;
          }
        }
        return updated;
      });

      await logAction({
        timestamp: new Date().toISOString(),
        command: pendingAction.originalMessage,
        toolUsed: pendingAction.tool,
        parameters: pendingAction.params,
        result: result.message,
        success: result.success,
        canUndo: result.canUndo ?? false,
        undoData: result.undoData,
      });

      setHistoryKey(k => k + 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      addMessage('assistant', `❌ ${msg}`);
    } finally {
      setPendingAction(null);
      setIsConfirming(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    addMessage('assistant', '✋ Действие отменено.');
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Голосовой ввод не поддерживается в этом браузере');
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionAPI() as any;
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      setCommand(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setError('Ошибка распознавания голоса');
    };
    recognition.start();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-indigo-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Агент</h2>
          <p className="text-sm text-gray-500">Управляйте магазином текстовыми командами</p>
        </div>
      </div>

      {/* Quick commands */}
      <div className="flex flex-wrap gap-2">
        {QUICK_COMMANDS.map(qc => (
          <button
            key={qc.command}
            onClick={() => sendCommand(qc.command)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {qc.label}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-64 max-h-96 overflow-y-auto p-4 space-y-3">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
            <Zap className="w-12 h-12 text-indigo-200" />
            <p className="text-sm text-center">
              Введите команду, и AI-агент выполнит её для вас.<br />
              Например: <span className="italic">"найди все найки дешевле 100 и подними цену на 20%"</span>
            </p>
          </div>
        ) : (
          conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm text-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              Обрабатываю...
            </div>
          </div>
        )}

        <div ref={conversationEndRef} />
      </div>

      {/* Confirmation dialog */}
      {pendingAction && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-semibold">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Требуется подтверждение
          </div>
          <p className="text-amber-900 text-sm bg-white border border-amber-200 rounded-lg p-3">
            {pendingAction.preview}
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmAction}
              disabled={isConfirming}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isConfirming ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Подтвердить
            </button>
            <button
              onClick={cancelAction}
              disabled={isConfirming}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <XCircle className="w-4 h-4" />
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Command input */}
      <div className="flex gap-2">
        <textarea
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendCommand();
            }
          }}
          placeholder='Напишите команду... Например: "найди все адидасы и поставь категорию lifestyle"'
          rows={2}
          disabled={isProcessing}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-gray-50"
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={startVoiceInput}
            disabled={listening || isProcessing}
            className={`px-3 py-2 rounded-xl transition-colors ${
              listening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Голосовой ввод"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={() => sendCommand()}
            disabled={!command.trim() || isProcessing}
            className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors"
            title="Отправить"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Enter — отправить • Shift+Enter — новая строка • Или используйте голосовой ввод
      </p>

      {/* Action history */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <AIHistoryLog key={historyKey} />
      </div>
    </div>
  );
};

export default AIAgent;
