import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirestore } from '../hooks/useFirestore';

interface CashEntry {
  id: string;
  type: 'income' | 'expense';
  method: 'cash' | 'card';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  source: 'manual' | 'sale';
}

const CashRegister: React.FC = () => {
  const { data: entries, loading } =
    useFirestore<CashEntry>('cash_entries');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    method: 'cash' as 'cash' | 'card',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  // Считаем балансы
  const cashBalance = entries
    .filter(e => e.method === 'cash')
    .reduce((sum, e) =>
      e.type === 'income'
        ? sum + Number(e.amount)
        : sum - Number(e.amount), 0);

  const cardBalance = entries
    .filter(e => e.method === 'card')
    .reduce((sum, e) =>
      e.type === 'income'
        ? sum + Number(e.amount)
        : sum - Number(e.amount), 0);

  const totalBalance = cashBalance + cardBalance;

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      alert('Укажи сумму!');
      return;
    }
    if (!form.description.trim()) {
      alert('Укажи описание!');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'cash_entries'), {
        type: form.type,
        method: form.method,
        amount: Number(form.amount),
        description: form.description.trim(),
        date: form.date,
        createdAt: new Date().toISOString(),
        source: 'manual',
      });
      setForm({
        type: 'income',
        method: 'cash',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
    } catch (e: unknown) {
      alert('Ошибка: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.createdAt || b.date).getTime() -
    new Date(a.createdAt || a.date).getTime()
  );

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '24px',
      boxSizing: 'border-box' as const
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '800',
          color: '#0F172A'
        }}>
          💰 Касса
        </h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg,#10B981,#34D399)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.35)'
          }}
        >
          + Операция
        </button>
      </div>

      {/* BALANCE CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* TOTAL */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #A7F3D0',
          boxShadow: '0 4px 20px rgba(16,185,129,0.12)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            💰
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: '700',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            ИТОГО В КАССЕ
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '900',
            color: totalBalance >= 0
              ? '#10B981' : '#EF4444',
            letterSpacing: '-0.5px'
          }}>
            {totalBalance.toLocaleString('ru-RU')} Br
          </div>
        </div>

        {/* CASH */}
        <div style={{
          backgroundColor: '#F0FDF4',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid #A7F3D0',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            💵
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: '700',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            НАЛИЧНЫЕ
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '900',
            color: '#10B981'
          }}>
            {cashBalance.toLocaleString('ru-RU')} Br
          </div>
        </div>

        {/* CARD */}
        <div style={{
          backgroundColor: '#EEF2FF',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid #C7D2FE',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>
            💳
          </div>
          <div style={{
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: '700',
            letterSpacing: '0.5px',
            marginBottom: '6px'
          }}>
            КАРТА / ПЕРЕВОД
          </div>
          <div style={{
            fontSize: '24px',
            fontWeight: '900',
            color: '#6366F1'
          }}>
            {cardBalance.toLocaleString('ru-RU')} Br
          </div>
        </div>
      </div>

      {/* HISTORY */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #F1F5F9'
      }}>
        <h3 style={{
          margin: '0 0 16px',
          fontSize: '16px',
          fontWeight: '800',
          color: '#0F172A'
        }}>
          📋 История операций
        </h3>

        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#94A3B8'
          }}>
            Загрузка...
          </div>
        )}

        {!loading && sortedEntries.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            color: '#94A3B8'
          }}>
            <div style={{ fontSize: '48px' }}>💰</div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#475569',
              marginTop: '12px'
            }}>
              Операций пока нет
            </div>
            <div style={{
              fontSize: '14px',
              marginTop: '4px'
            }}>
              Добавь первую операцию!
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {sortedEntries.map(entry => {
            const isIncome = entry.type === 'income';
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  backgroundColor: isIncome
                    ? '#F0FDF4' : '#FEF2F2',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: isIncome
                    ? '#A7F3D0' : '#FECACA',
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: isIncome
                    ? '#10B981' : '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  color: 'white',
                  fontWeight: '800'
                }}>
                  {isIncome ? '↑' : '↓'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#1E293B',
                    marginBottom: '3px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {entry.description}
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      fontWeight: '600'
                    }}>
                      {new Date(entry.date)
                        .toLocaleDateString('ru-RU')}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: entry.method === 'cash'
                        ? '#ECFDF5' : '#EEF2FF',
                      color: entry.method === 'cash'
                        ? '#10B981' : '#6366F1'
                    }}>
                      {entry.method === 'cash'
                        ? '💵 Нал' : '💳 Карта'}
                    </span>
                    {entry.source === 'manual' && (
                      <span style={{
                        fontSize: '11px',
                        color: '#94A3B8',
                        fontWeight: '600'
                      }}>
                        ручная
                      </span>
                    )}
                  </div>
                </div>

                <div style={{
                  fontSize: '18px',
                  fontWeight: '900',
                  color: isIncome ? '#10B981' : '#EF4444',
                  letterSpacing: '-0.3px',
                  flexShrink: 0
                }}>
                  {isIncome ? '+' : '-'}
                  {Number(entry.amount)
                    .toLocaleString('ru-RU')} Br
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD FORM MODAL */}
      {showForm && (
        <div
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '28px',
              width: '100%',
              maxWidth: '420px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)'
            }}
          >
            {/* MODAL HEADER */}
            <div style={{
              background: 'linear-gradient(135deg,#10B981,#34D399)',
              padding: '24px',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>
              <div style={{
                fontSize: '28px',
                marginBottom: '8px'
              }}>
                💰
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '800',
                color: 'white'
              }}>
                Новая операция
              </h2>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '24px' }}>

              {/* TYPE */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  ТИП ОПЕРАЦИИ
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {[
                    { key: 'income', label: '↑ Приход',
                      color: '#10B981', bg: '#F0FDF4',
                      border: '#A7F3D0' },
                    { key: 'expense', label: '↓ Расход',
                      color: '#EF4444', bg: '#FEF2F2',
                      border: '#FECACA' }
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setForm(p => ({
                        ...p, type: t.key as 'income'|'expense'
                      }))}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: form.type === t.key
                          ? t.color : '#E2E8F0',
                        backgroundColor: form.type === t.key
                          ? t.bg : 'white',
                        color: form.type === t.key
                          ? t.color : '#64748B',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* METHOD */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  СПОСОБ
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  {[
                    { key: 'cash', label: '💵 Наличные' },
                    { key: 'card', label: '💳 Карта' }
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setForm(p => ({
                        ...p,
                        method: m.key as 'cash'|'card'
                      }))}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: form.method === m.key
                          ? '#6366F1' : '#E2E8F0',
                        backgroundColor: form.method === m.key
                          ? '#EEF2FF' : 'white',
                        color: form.method === m.key
                          ? '#6366F1' : '#64748B',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AMOUNT */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  СУММА (Br)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(p => ({
                    ...p, amount: e.target.value
                  }))}
                  placeholder="0"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '20px',
                    fontWeight: '800',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    color: '#0F172A'
                  }}
                />
              </div>

              {/* DESCRIPTION */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  ОПИСАНИЕ
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(p => ({
                    ...p, description: e.target.value
                  }))}
                  placeholder="Продажа / Закупка / Снятие..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* DATE */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  ДАТА
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(p => ({
                    ...p, date: e.target.value
                  }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* BUTTONS */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: 'white',
                    color: '#64748B',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 2,
                    padding: '13px',
                    borderRadius: '14px',
                    border: 'none',
                    background: saving
                      ? '#E2E8F0'
                      : 'linear-gradient(135deg,#10B981,#34D399)',
                    color: saving ? '#94A3B8' : 'white',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: saving
                      ? 'none'
                      : '0 4px 14px rgba(16,185,129,0.4)'
                  }}
                >
                  {saving ? '⏳ Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;
