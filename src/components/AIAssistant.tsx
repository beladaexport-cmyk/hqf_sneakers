import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
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

  // Pulse animation for loading dots
  useEffect(() => {
    if (!document.getElementById('ai-pulse-style')) {
      const s = document.createElement('style');
      s.id = 'ai-pulse-style';
      s.textContent = `
        @keyframes aiPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

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
    <div style={{ maxWidth:'860px', margin:'0 auto', padding:'24px 16px' }}>

      {/* HEADER */}
      <div style={{
        display:'flex',
        alignItems:'center',
        gap:'16px',
        marginBottom:'28px',
        padding:'24px',
        background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
        borderRadius:'24px',
        boxShadow:'0 8px 32px rgba(99,102,241,0.35)',
        position:'relative',
        overflow:'hidden'
      }}>
        <div style={{
          position:'absolute',
          top:'-20px',
          right:'40px',
          width:'120px',
          height:'120px',
          borderRadius:'50%',
          backgroundColor:'rgba(255,255,255,0.08)'
        }}/>
        <div style={{
          position:'absolute',
          bottom:'-30px',
          right:'-10px',
          width:'160px',
          height:'160px',
          borderRadius:'50%',
          backgroundColor:'rgba(255,255,255,0.05)'
        }}/>
        <div style={{
          width:'60px',
          height:'60px',
          borderRadius:'18px',
          backgroundColor:'rgba(255,255,255,0.2)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          fontSize:'28px',
          flexShrink:0,
          border:'2px solid rgba(255,255,255,0.3)'
        }}>
          🤖
        </div>
        <div style={{position:'relative'}}>
          <h1 style={{
            margin:'0 0 6px 0',
            fontSize:'24px',
            fontWeight:'800',
            color:'white',
            letterSpacing:'-0.3px'
          }}>
            AI-Помощник
          </h1>
          <div style={{
            display:'flex',
            alignItems:'center',
            gap:'6px'
          }}>
            <div style={{
              width:'8px',
              height:'8px',
              borderRadius:'50%',
              backgroundColor:'#34D399',
              boxShadow:'0 0 8px rgba(52,211,153,0.8)'
            }}/>
            <span style={{
              fontSize:'13px',
              color:'rgba(255,255,255,0.85)',
              fontWeight:'500'
            }}>
              Онлайн • Готов к работе
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTION CHIPS */}
      <div style={{
        display:'flex',
        gap:'8px',
        flexWrap:'wrap',
        marginBottom:'20px'
      }}>
        {[
          { icon:'📦', text:'Добавить товар', prompt:'Добавь новый товар в каталог' },
          { icon:'📊', text:'Анализ продаж', prompt:'Проанализируй продажи за месяц' },
          { icon:'💡', text:'Совет по бизнесу', prompt:'Как увеличить прибыль магазина?' },
          { icon:'📋', text:'Отчёт', prompt:'Сделай краткий отчёт по магазину' }
        ].map(chip=>(
          <button
            key={chip.text}
            onClick={()=> setCommand(chip.prompt)}
            style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              padding:'8px 14px',
              backgroundColor:'white',
              border:'1.5px solid #E2E8F0',
              borderRadius:'20px',
              fontSize:'13px',
              fontWeight:'600',
              color:'#475569',
              cursor:'pointer',
              transition:'all 0.15s',
              boxShadow:'0 2px 6px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.backgroundColor='#EEF2FF';
              e.currentTarget.style.borderColor='#C7D2FE';
              e.currentTarget.style.color='#6366F1';
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.backgroundColor='white';
              e.currentTarget.style.borderColor='#E2E8F0';
              e.currentTarget.style.color='#475569';
            }}
          >
            {chip.icon} {chip.text}
          </button>
        ))}
      </div>

      {/* PHOTO UPLOAD ZONE */}
      <div
        onClick={()=> fileInputRef.current?.click()}
        onDragOver={e=>{
          e.preventDefault();
          e.currentTarget.style.borderColor='#6366F1';
          e.currentTarget.style.backgroundColor='#EEF2FF';
        }}
        onDragLeave={e=>{
          e.currentTarget.style.borderColor='#C7D2FE';
          e.currentTarget.style.backgroundColor='#F8FAFF';
        }}
        onDrop={e=>{
          handleDrop(e);
          e.currentTarget.style.borderColor='#C7D2FE';
          e.currentTarget.style.backgroundColor='#F8FAFF';
        }}
        style={{
          border:'2.5px dashed #C7D2FE',
          borderRadius:'20px',
          padding:'32px 20px',
          textAlign:'center',
          backgroundColor:'#F8FAFF',
          cursor:'pointer',
          marginBottom:'20px',
          transition:'all 0.2s'
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.borderColor='#6366F1';
          e.currentTarget.style.backgroundColor='#EEF2FF';
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.borderColor='#C7D2FE';
          e.currentTarget.style.backgroundColor='#F8FAFF';
        }}
      >
        {image ? (
          <div style={{ position:'relative', display:'inline-block' }}>
            <img src={image} alt="Preview" style={{
              maxHeight:'200px',
              maxWidth:'100%',
              borderRadius:'12px',
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)'
            }} />
            <button
              onClick={e=>{
                e.stopPropagation();
                setImage(null);
              }}
              style={{
                position:'absolute',
                top:'-8px',
                right:'-8px',
                width:'28px',
                height:'28px',
                borderRadius:'50%',
                backgroundColor:'#EF4444',
                color:'white',
                border:'none',
                cursor:'pointer',
                fontSize:'14px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center'
              }}
            >
              <XCircle size={16} />
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width:'64px',
              height:'64px',
              borderRadius:'18px',
              backgroundColor:'#EEF2FF',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:'28px',
              margin:'0 auto 16px'
            }}>
              📸
            </div>
            <div style={{
              fontSize:'15px',
              fontWeight:'700',
              color:'#6366F1',
              marginBottom:'6px'
            }}>
              Перетащи фото кроссовок
            </div>
            <div style={{
              fontSize:'13px',
              color:'#94A3B8'
            }}>
              или кликни для выбора файла
            </div>
            <div style={{
              display:'inline-flex',
              alignItems:'center',
              gap:'4px',
              marginTop:'12px',
              padding:'4px 12px',
              backgroundColor:'rgba(99,102,241,0.1)',
              borderRadius:'20px',
              fontSize:'12px',
              color:'#6366F1',
              fontWeight:'600'
            }}>
              JPG, PNG, WEBP
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{display:'none'}}
          onChange={handleImageUpload}
        />
      </div>

      {/* DIVIDER */}
      <div style={{
        display:'flex',
        alignItems:'center',
        gap:'12px',
        marginBottom:'16px'
      }}>
        <div style={{ flex:1, height:'1px', backgroundColor:'#E2E8F0' }}/>
        <span style={{
          fontSize:'12px',
          color:'#94A3B8',
          fontWeight:'600',
          letterSpacing:'0.5px'
        }}>
          ИЛИ ОПИШИТЕ ТЕКСТОМ
        </span>
        <div style={{ flex:1, height:'1px', backgroundColor:'#E2E8F0' }}/>
      </div>

      {/* TEXT INPUT AREA */}
      <div
        style={{
          backgroundColor:'white',
          borderRadius:'20px',
          border:'1.5px solid #E2E8F0',
          overflow:'hidden',
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
          transition:'border-color 0.2s'
        }}
        onFocusCapture={e=>{
          (e.currentTarget as HTMLElement).style.borderColor='#6366F1';
          (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(99,102,241,0.15)';
        }}
        onBlurCapture={e=>{
          (e.currentTarget as HTMLElement).style.borderColor='#E2E8F0';
          (e.currentTarget as HTMLElement).style.boxShadow='0 4px 20px rgba(0,0,0,0.06)';
        }}
      >
        <textarea
          value={command}
          onChange={e=> setCommand(e.target.value)}
          onKeyDown={e=>{
            if(e.key==='Enter' && !e.shiftKey){
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder='Например: "Добавь Nike Dunk Low Purple размеры 40-43, цена 370/89"'
          rows={3}
          style={{
            width:'100%',
            padding:'16px 20px',
            border:'none',
            outline:'none',
            fontSize:'14px',
            color:'#1E293B',
            resize:'none',
            fontFamily:'inherit',
            lineHeight:'1.6',
            backgroundColor:'transparent',
            boxSizing:'border-box'
          }}
        />
        <div style={{
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          padding:'12px 16px',
          borderTop:'1px solid #F1F5F9',
          backgroundColor:'#FAFAFA'
        }}>
          <div style={{
            fontSize:'12px',
            color:'#94A3B8'
          }}>
            Enter — отправить • Shift+Enter — перенос строки
          </div>
          <div style={{
            display:'flex',
            gap:'8px',
            alignItems:'center'
          }}>
            {/* VOICE BUTTON */}
            <button
              onClick={startVoiceInput}
              disabled={listening || processing}
              style={{
                width:'40px',
                height:'40px',
                borderRadius:'12px',
                backgroundColor: listening ? '#FEF2F2' : '#F1F5F9',
                border: listening ? '1.5px solid #FECACA' : '1.5px solid #E2E8F0',
                cursor: listening || processing ? 'not-allowed' : 'pointer',
                fontSize:'18px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                transition:'all 0.15s',
                color: listening ? '#EF4444' : '#64748B'
              }}
            >
              🎤
            </button>

            {/* SEND BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={processing || (!command && !image)}
              style={{
                padding:'10px 20px',
                background: processing || (!command && !image)
                  ? '#E2E8F0'
                  : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: processing || (!command && !image)
                  ? '#94A3B8'
                  : 'white',
                border:'none',
                borderRadius:'12px',
                fontSize:'13px',
                fontWeight:'700',
                cursor: processing || (!command && !image)
                  ? 'not-allowed'
                  : 'pointer',
                display:'flex',
                alignItems:'center',
                gap:'6px',
                boxShadow: processing || (!command && !image)
                  ? 'none'
                  : '0 4px 12px rgba(99,102,241,0.4)',
                transition:'all 0.2s'
              }}
              onMouseEnter={e=>{
                if(!processing && (command || image))
                  e.currentTarget.style.transform='scale(1.02)';
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.transform='scale(1)';
              }}
            >
              {processing ? '⏳ Обработка...' : '🚀 Отправить'}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          marginTop:'16px',
          backgroundColor:'#FEF2F2',
          border:'1px solid #FECACA',
          borderRadius:'14px',
          padding:'14px 20px',
          color:'#DC2626',
          fontSize:'14px',
          fontWeight:'500',
          display:'flex',
          alignItems:'center',
          gap:'8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* LOADING STATE */}
      {processing && (
        <div style={{
          marginTop:'20px',
          backgroundColor:'white',
          borderRadius:'20px',
          border:'1.5px solid #C7D2FE',
          padding:'24px',
          display:'flex',
          alignItems:'center',
          gap:'14px',
          boxShadow:'0 4px 20px rgba(99,102,241,0.1)'
        }}>
          <div style={{
            width:'40px',
            height:'40px',
            borderRadius:'12px',
            background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'20px',
            flexShrink:0
          }}>
            🤖
          </div>
          <div>
            <div style={{
              fontSize:'14px',
              fontWeight:'700',
              color:'#6366F1',
              marginBottom:'4px'
            }}>
              AI думает...
            </div>
            <div style={{ display:'flex', gap:'4px' }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{
                  width:'8px',
                  height:'8px',
                  borderRadius:'50%',
                  backgroundColor:'#6366F1',
                  opacity:0.4,
                  animation:`aiPulse 1.2s ${i*0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI MESSAGE RESPONSE */}
      {aiMessage && (
        <div style={{
          marginTop:'20px',
          backgroundColor:'white',
          borderRadius:'20px',
          border:'1px solid #F1F5F9',
          overflow:'hidden',
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            padding:'14px 20px',
            borderBottom:'1px solid #F1F5F9',
            display:'flex',
            alignItems:'center',
            gap:'10px',
            backgroundColor:'#F8FAFC'
          }}>
            <div style={{
              width:'32px',
              height:'32px',
              borderRadius:'10px',
              background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:'16px'
            }}>
              🤖
            </div>
            <span style={{
              fontSize:'14px',
              fontWeight:'700',
              color:'#0F172A'
            }}>
              Ответ AI-помощника
            </span>
          </div>
          <div style={{
            padding:'20px',
            fontSize:'14px',
            color:'#374151',
            lineHeight:'1.7',
            whiteSpace:'pre-wrap'
          }}>
            {aiMessage}
          </div>
        </div>
      )}

      {/* STRUCTURED DATA */}
      {aiResponse && (
        <div style={{
          marginTop:'16px',
          backgroundColor:'white',
          borderRadius:'20px',
          border:'1px solid #F1F5F9',
          overflow:'hidden',
          boxShadow:'0 4px 20px rgba(0,0,0,0.06)'
        }}>
          <div style={{
            padding:'14px 20px',
            borderBottom:'1px solid #F1F5F9',
            display:'flex',
            alignItems:'center',
            gap:'10px',
            backgroundColor:'#F0FDF4'
          }}>
            <CheckCircle size={20} color="#10B981" />
            <span style={{
              fontSize:'14px',
              fontWeight:'700',
              color:'#065F46'
            }}>
              Распознанные данные
            </span>
          </div>
          <div style={{ padding:'20px' }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              gap:'16px',
              fontSize:'14px'
            }}>
              <div>
                <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Бренд</div>
                <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.brand}</div>
              </div>
              <div>
                <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Модель</div>
                <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.model}</div>
              </div>
              {aiResponse.modelArticle && (
                <div>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Артикул</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.modelArticle}</div>
                </div>
              )}
              {aiResponse.color && (
                <div>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Цвет</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.color}</div>
                </div>
              )}
              <div>
                <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Размеры EU</div>
                <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.sizes.join(', ')}</div>
              </div>
              {aiResponse.purchasePrice !== undefined && aiResponse.purchasePrice > 0 && (
                <div>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Закупка</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.purchasePrice} Br</div>
                </div>
              )}
              {aiResponse.retailPrice !== undefined && aiResponse.retailPrice > 0 && (
                <div>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Продажа</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.retailPrice} Br</div>
                </div>
              )}
              {aiResponse.supplier && (
                <div>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Поставщик</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.supplier}</div>
                </div>
              )}
              {aiResponse.status === 'preorder' && (
                <div style={{ gridColumn:'1 / -1' }}>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Статус</div>
                  <div style={{ fontWeight:'600', color:'#F59E0B' }}>🛒 Предзаказ</div>
                </div>
              )}
              {aiResponse.expectedDate && (
                <div style={{ gridColumn:'1 / -1' }}>
                  <div style={{ color:'#94A3B8', fontSize:'12px', marginBottom:'2px' }}>Ожидается</div>
                  <div style={{ fontWeight:'600', color:'#1E293B' }}>{aiResponse.expectedDate}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleAddProduct}
              disabled={saving || saveSuccess}
              style={{
                width:'100%',
                padding:'14px',
                marginTop:'20px',
                border:'none',
                borderRadius:'14px',
                fontSize:'15px',
                fontWeight:'700',
                cursor: saving || saveSuccess ? 'default' : 'pointer',
                transition:'all 0.2s',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                gap:'8px',
                background: saveSuccess
                  ? '#10B981'
                  : saving
                  ? '#E2E8F0'
                  : aiResponse.status === 'preorder'
                  ? 'linear-gradient(135deg,#F59E0B,#D97706)'
                  : 'linear-gradient(135deg,#10B981,#059669)',
                color: saving ? '#94A3B8' : 'white',
                boxShadow: saving
                  ? 'none'
                  : saveSuccess
                  ? '0 4px 12px rgba(16,185,129,0.4)'
                  : aiResponse.status === 'preorder'
                  ? '0 4px 12px rgba(245,158,11,0.4)'
                  : '0 4px 12px rgba(16,185,129,0.4)'
              }}
            >
              {saveSuccess ? (
                <><CheckCircle size={18} /> Товар добавлен!</>
              ) : saving ? (
                '⏳ Сохранение...'
              ) : aiResponse.status === 'preorder' ? (
                '🛒 Добавить в предзаказы'
              ) : (
                '✅ Добавить в каталог'
              )}
            </button>

            {saveSuccess && (
              <div style={{
                marginTop:'12px',
                padding:'12px 16px',
                backgroundColor:'#F0FDF4',
                border:'1px solid #A7F3D0',
                borderRadius:'12px',
                textAlign:'center',
                fontSize:'14px',
                fontWeight:'600',
                color:'#065F46'
              }}>
                ✅ Товар успешно добавлен! Можете добавить следующий.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AIAssistant;
