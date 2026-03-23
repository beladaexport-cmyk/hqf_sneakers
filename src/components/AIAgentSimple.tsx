import React, { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

let nextId = 1;

export default function AIAgentSimple() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId++,
      role: 'assistant',
      content: '👋 Привет! Я AI-помощник магазина HQF Sneakers. Чем могу помочь?\n\nДоступные команды:\n- Найти товары\n- Показать статистику\n- Помощь',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/.netlify/functions/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { id: nextId++, role: 'assistant', content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId++,
            role: 'assistant',
            content: '❌ Ошибка: ' + (data.error || 'Не удалось получить ответ'),
          },
        ]);
      }
    } catch (error: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: 'assistant',
          content: '❌ Ошибка соединения: ' + (error instanceof Error ? error.message : String(error)),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Агент</h2>
      </div>

      <p className="text-gray-600">
        Умный помощник для управления магазином. Задавайте вопросы и получайте ответы!
      </p>

      {/* Messages */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишите команду... (например: 'найди все найки')"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick commands */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInput('найди все найки')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              🔍 Найти Nike
            </button>
            <button
              onClick={() => setInput('покажи статистику')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              📊 Статистика
            </button>
            <button
              onClick={() => setInput('помощь')}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={loading}
            >
              ❓ Помощь
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Совет:</strong> Это упрощённая версия AI-агента. Скоро добавим
          возможность изменять товары, создавать предзаказы и многое другое!
        </p>
      </div>
    </div>
  );
}
