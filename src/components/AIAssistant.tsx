import React, { useState, useRef } from 'react';
import { Camera, Mic, Send, Sparkles, CheckCircle, XCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AIResponse {
  brand: string;
  model: string;
  modelArticle?: string;
  color?: string;
  sizes: string[];
  quantity?: number;
  purchasePrice?: number;
  retailPrice?: number;
  supplier?: string;
  category?: 'sport' | 'lifestyle' | 'limited';
  status?: 'available' | 'preorder';
  expectedDate?: string;
  notes?: string;
}

const AIAssistant: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [command, setCommand] = useState('');
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки фото
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Голосовой ввод (Web Speech API)
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Голосовой ввод не поддерживается в этом браузере');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCommand(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
      setError('Ошибка распознавания голоса');
    };

    recognition.start();
  };

  // Отправка запроса к AI
  const handleSubmit = async () => {
    if (!command && !image) {
      setError('Добавьте фото или введите команду');
      return;
    }

    setProcessing(true);
    setError('');
    setAiMessage('');

    try {
      const response = await fetch('/.netlify/functions/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image || undefined,
          command: command || 'Распознай товар на фото и предложи данные для внесения',
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка запроса к AI');
      }

      const data = await response.json();
      setAiResponse(data.structured);
      setAiMessage(data.message);
    } catch (err: any) {
      setError(err.message || 'Ошибка обработки запроса');
    } finally {
      setProcessing(false);
    }
  };

  // Добавить товар в каталог
  const handleAddProduct = async () => {
    if (!aiResponse) return;

    setSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const productsRef = collection(db, 'products');
      const today = new Date().toISOString().split('T')[0];

      // Для каждого размера создаём отдельный товар
      for (const size of aiResponse.sizes) {
        const product = {
          sku: `${aiResponse.brand.substring(0, 3).toUpperCase()}-${aiResponse.model.substring(0, 3).toUpperCase()}-${size}`,
          modelArticle: aiResponse.modelArticle || '',
          brand: aiResponse.brand,
          model: aiResponse.model,
          size: size,
          color: aiResponse.color || '',
          quantity: aiResponse.quantity || 1,
          purchasePrice: aiResponse.purchasePrice || 0,
          retailPrice: aiResponse.retailPrice || 0,
          dateAdded: today,
          supplier: aiResponse.supplier || 'AI Import',
          category: aiResponse.category || 'lifestyle',
          status: aiResponse.status || 'available',
          location: '',
          minStock: 2,
        };

        await addDoc(productsRef, product);
      }

      // Если это предзаказ - добавить в коллекцию preorders
      if (aiResponse.status === 'preorder') {
        const preordersRef = collection(db, 'preorders');
        const expectedDate = aiResponse.expectedDate ||
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        for (const size of aiResponse.sizes) {
          const preorder = {
            modelId: '',
            modelArticle: aiResponse.modelArticle || '',
            modelName: `${aiResponse.brand} ${aiResponse.model}${aiResponse.color ? ' "' + aiResponse.color + '"' : ''}`,
            sizeId: '',
            sizeEU: size,
            quantity: aiResponse.quantity || 1,
            purchasePrice: aiResponse.purchasePrice || 0,
            retailPrice: aiResponse.retailPrice || 0,
            supplier: aiResponse.supplier || 'AI Import',
            expectedDate: expectedDate,
            status: 'pending',
            notes: aiResponse.notes || 'Добавлено через AI-помощника',
            createdAt: new Date().toISOString(),
          };

          await addDoc(preordersRef, preorder);
        }
      }

      setSaveSuccess(true);

      // Очистить форму через 2 секунды
      setTimeout(() => {
        setImage(null);
        setCommand('');
        setAiResponse(null);
        setAiMessage('');
        setSaveSuccess(false);
      }, 2000);

    } catch (err: any) {
      console.error('Ошибка сохранения:', err);
      setError('Ошибка сохранения товара: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">🤖 AI-Помощник</h2>
      </div>

      <p className="text-gray-600">
        Загрузите фото кроссовок или опишите товар голосом/текстом, и AI автоматически заполнит данные.
      </p>

      {/* Загрузка фото */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        {image ? (
          <div className="relative">
            <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImage(null);
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-500">Перетащите фото сюда или кликните для выбора</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Текстовая команда */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Или опишите товар текстом:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder='Например: "Добавь Nike Dunk Low Purple размеры 40-43, цена 370/89"'
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={startVoiceInput}
            disabled={listening || processing}
            className={`px-4 py-2 rounded-lg transition-colors ${
              listening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || (!command && !image)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Обработка...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Отправить
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          ⚠️ {error}
        </div>
      )}

      {/* Ответ AI */}
      {aiMessage && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-900 font-medium mb-2">🤖 AI-Ассистент:</p>
          <p className="text-purple-800">{aiMessage}</p>
        </div>
      )}

      {/* Структурированные данные */}
      {aiResponse && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Распознанные данные:
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Бренд:</span>
              <p className="font-medium">{aiResponse.brand}</p>
            </div>
            <div>
              <span className="text-gray-500">Модель:</span>
              <p className="font-medium">{aiResponse.model}</p>
            </div>
            {aiResponse.modelArticle && (
              <div>
                <span className="text-gray-500">Артикул:</span>
                <p className="font-medium">{aiResponse.modelArticle}</p>
              </div>
            )}
            {aiResponse.color && (
              <div>
                <span className="text-gray-500">Цвет:</span>
                <p className="font-medium">{aiResponse.color}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Размеры EU:</span>
              <p className="font-medium">{aiResponse.sizes.join(', ')}</p>
            </div>
            {aiResponse.status === 'preorder' && (
              <div className="col-span-2">
                <span className="text-gray-500">Статус:</span>
                <p className="font-medium text-orange-600">🛒 Предзаказ</p>
              </div>
            )}
            {aiResponse.expectedDate && (
              <div className="col-span-2">
                <span className="text-gray-500">Ожидается:</span>
                <p className="font-medium">{aiResponse.expectedDate}</p>
              </div>
            )}
            {aiResponse.purchasePrice && (
              <div>
                <span className="text-gray-500">Закупка:</span>
                <p className="font-medium">{aiResponse.purchasePrice} Br</p>
              </div>
            )}
            {aiResponse.retailPrice && (
              <div>
                <span className="text-gray-500">Продажа:</span>
                <p className="font-medium">{aiResponse.retailPrice} Br</p>
              </div>
            )}
            {aiResponse.supplier && (
              <div>
                <span className="text-gray-500">Поставщик:</span>
                <p className="font-medium">{aiResponse.supplier}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleAddProduct}
            disabled={saving || saveSuccess}
            className={`w-full px-4 py-3 rounded-lg transition-colors font-medium ${
              saveSuccess
                ? 'bg-green-600 text-white cursor-default'
                : saving
                ? 'bg-gray-400 text-white cursor-wait'
                : aiResponse.status === 'preorder'
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saveSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                ✅ Товар добавлен!
              </span>
            ) : saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Сохранение...
              </span>
            ) : aiResponse.status === 'preorder' ? (
              '🛒 Добавить в предзаказы'
            ) : (
              '✅ Добавить в каталог'
            )}
          </button>

          {saveSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium text-center">
                ✅ Товар успешно добавлен! Можете добавить следующий.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
