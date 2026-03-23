import React, { useEffect, useState } from 'react';
import { History, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { getHistory, undoAction, ActionLog } from '../services/aiHistory';

const AIHistoryLog: React.FC = () => {
  const [history, setHistory] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    const logs = await getHistory(20);
    setHistory(logs);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleUndo = async (actionId: string) => {
    setUndoing(actionId);
    const result = await undoAction(actionId);
    setMessage(result.message);
    if (result.success) {
      await loadHistory();
    }
    setUndoing(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const toolLabels: Record<string, string> = {
    search_products: '🔍 Поиск',
    update_product: '✏️ Изменение',
    bulk_update_products: '📝 Массовое обновление',
    create_product: '➕ Создание',
    delete_product: '🗑️ Удаление',
    generate_report: '📊 Отчёт',
    update_order: '📦 Заказ',
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
        Загрузка истории...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-700">
        <History className="w-4 h-4" />
        <span className="font-medium text-sm">История действий AI</span>
        <button
          onClick={loadHistory}
          className="ml-auto text-xs text-blue-600 hover:text-blue-800"
        >
          Обновить
        </button>
      </div>

      {message && (
        <div className="text-sm p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {message}
        </div>
      )}

      {history.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">История действий пуста</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {history.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs border border-gray-100"
            >
              <div className="flex-shrink-0 mt-0.5">
                {log.success ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-gray-500">
                  <span>{toolLabels[log.toolUsed] || log.toolUsed}</span>
                  <span className="text-gray-300">•</span>
                  <span>
                    {new Date(log.timestamp).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {log.undoneAt && (
                    <span className="text-orange-500 font-medium">• отменено</span>
                  )}
                </div>
                <p className="text-gray-700 truncate" title={log.command}>
                  💬 {log.command}
                </p>
                <p className="text-gray-500 truncate" title={log.result}>
                  {log.result}
                </p>
              </div>
              {log.canUndo && !log.undoneAt && (
                <button
                  onClick={() => handleUndo(log.id)}
                  disabled={undoing === log.id}
                  className="flex-shrink-0 p-1 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                  title="Отменить действие"
                >
                  {undoing === log.id ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-orange-400 border-t-transparent" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIHistoryLog;
