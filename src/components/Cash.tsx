import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useViewMode } from '../contexts/ViewModeContext';
import { useTheme } from '../contexts/ThemeContext';
import { CashEntry } from '../types';
import { safeNumber, safeDate } from '../utils/helpers';
import { db } from '../config/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type ModalType = 'none' | 'operation' | 'transfer' | 'setBalance';
type FilterType = 'all' | 'cash' | 'card';
type PeriodFilter = 'all' | 'today' | 'week' | 'month';

const Cash: React.FC = () => {
  const { isMobileView } = useViewMode();
  const theme = useTheme();
  const { data: entries, loading, error, add } = useFirestore<CashEntry>('cash_entries');

  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [modal, setModal] = useState<ModalType>('none');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  // Operation form
  const [opType, setOpType] = useState<'cash' | 'card'>('cash');
  const [opOperation, setOpOperation] = useState<'in' | 'out'>('in');
  const [opAmount, setOpAmount] = useState('');
  const [opDescription, setOpDescription] = useState('');
  const [opCategory, setOpCategory] = useState<CashEntry['category']>('other');
  const [opDate, setOpDate] = useState(new Date().toISOString().slice(0, 10));

  // Transfer form
  const [transferFrom, setTransferFrom] = useState<'cash' | 'card'>('cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferComment, setTransferComment] = useState('');

  // Set balance form
  const [setCashVal, setSetCashVal] = useState('');
  const [setCardVal, setSetCardVal] = useState('');
  const [setBalanceNote, setSetBalanceNote] = useState('');

  // Listen to cash_balance/main document
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cash_balance', 'main'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setCashAmount(safeNumber(d.cashAmount));
        setCardAmount(safeNumber(d.cardAmount));
      }
      setBalanceLoading(false);
    }, () => setBalanceLoading(false));
    return () => unsub();
  }, []);

  const updateBalance = async (newCash: number, newCard: number, note?: string) => {
    await setDoc(doc(db, 'cash_balance', 'main'), {
      cashAmount: newCash,
      cardAmount: newCard,
      updatedAt: new Date().toISOString(),
      ...(note ? { note } : {})
    });
  };

  const handleAddOperation = async () => {
    const amt = safeNumber(opAmount);
    if (amt <= 0) return;
    await add({
      type: opType,
      operation: opOperation,
      amount: amt,
      description: opDescription || (opOperation === 'in' ? 'Приход' : 'Расход'),
      category: opCategory,
      date: opDate || new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    } as any);

    let newCash = cashAmount;
    let newCard = cardAmount;
    if (opType === 'cash') {
      newCash = opOperation === 'in' ? newCash + amt : newCash - amt;
    } else {
      newCard = opOperation === 'in' ? newCard + amt : newCard - amt;
    }
    await updateBalance(newCash, newCard);
    resetOpForm();
    setModal('none');
  };

  const handleTransfer = async () => {
    const amt = safeNumber(transferAmount);
    if (amt <= 0) return;
    const to = transferFrom === 'cash' ? 'card' : 'cash';
    const now = new Date().toISOString();
    const dateStr = now.slice(0, 10);
    const desc = `Перевод ${transferFrom === 'cash' ? 'нал→карта' : 'карта→нал'}${transferComment ? ': ' + transferComment : ''}`;

    await add({
      type: transferFrom,
      operation: 'out',
      amount: amt,
      description: desc,
      category: 'transfer',
      date: dateStr,
      createdAt: now
    } as any);
    await add({
      type: to,
      operation: 'in',
      amount: amt,
      description: desc,
      category: 'transfer',
      date: dateStr,
      createdAt: now
    } as any);

    let newCash = cashAmount;
    let newCard = cardAmount;
    if (transferFrom === 'cash') {
      newCash -= amt;
      newCard += amt;
    } else {
      newCard -= amt;
      newCash += amt;
    }
    await updateBalance(newCash, newCard);
    setTransferAmount('');
    setTransferComment('');
    setModal('none');
  };

  const handleSetBalance = async () => {
    const newCash = safeNumber(setCashVal);
    const newCard = safeNumber(setCardVal);
    await updateBalance(newCash, newCard, setBalanceNote || undefined);
    const now = new Date().toISOString();
    await add({
      type: 'cash',
      operation: newCash >= cashAmount ? 'in' : 'out',
      amount: Math.abs(newCash - cashAmount),
      description: 'Корректировка баланса (наличные)',
      category: 'other',
      date: now.slice(0, 10),
      createdAt: now
    } as any);
    if (Math.abs(newCard - cardAmount) > 0) {
      await add({
        type: 'card',
        operation: newCard >= cardAmount ? 'in' : 'out',
        amount: Math.abs(newCard - cardAmount),
        description: 'Корректировка баланса (карта)',
        category: 'other',
        date: now.slice(0, 10),
        createdAt: now
      } as any);
    }
    setSetCashVal('');
    setSetCardVal('');
    setSetBalanceNote('');
    setModal('none');
  };

  const resetOpForm = () => {
    setOpAmount('');
    setOpDescription('');
    setOpCategory('other');
    setOpDate(new Date().toISOString().slice(0, 10));
  };

  const openOperation = (type: 'cash' | 'card', op: 'in' | 'out') => {
    setOpType(type);
    setOpOperation(op);
    resetOpForm();
    setModal('operation');
  };

  // Filtering
  const filteredEntries = entries
    .filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (periodFilter !== 'all') {
        const d = safeDate(e.date || e.createdAt);
        if (!d) return false;
        const entryDate = new Date(d);
        const now = new Date();
        if (periodFilter === 'today') {
          return entryDate.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
        }
        if (periodFilter === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return entryDate >= weekAgo;
        }
        if (periodFilter === 'month') {
          return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
        }
      }
      return true;
    })
    .sort((a, b) => {
      const da = new Date(safeDate(a.createdAt) || 0);
      const db2 = new Date(safeDate(b.createdAt) || 0);
      return db2.getTime() - da.getTime();
    })
    .slice(0, 20);

  const formatNum = (n: number) => n.toLocaleString('ru-RU');

  const categoryLabels: Record<string, string> = {
    sale: '💰 Продажа',
    expense: '📢 Расход',
    supplier: '📦 Закупка',
    transfer: '🔄 Перевод',
    other: '📝 Другое'
  };

  const categoryOptions = [
    { value: 'sale', label: '💰 Продажа' },
    { value: 'supplier', label: '📦 Закупка у поставщика' },
    { value: 'expense', label: '📢 Реклама / Расход' },
    { value: 'transfer', label: '🔄 Перевод между счетами' },
    { value: 'other', label: '📝 Другое' }
  ];

  if (loading || balanceLoading) return (
    <div style={{ padding: '24px', textAlign: 'center', color: theme.textMuted }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>💰</div>
      Загрузка кассы...
    </div>
  );

  if (error) return (
    <div style={{ padding: '24px', backgroundColor: '#FEF2F2', borderRadius: '12px', color: '#DC2626', fontSize: '14px' }}>
      ⚠️ Ошибка загрузки: {error}
    </div>
  );

  const total = cashAmount + cardAmount;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: `1.5px solid ${theme.border}`,
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    backgroundColor: theme.bgInput,
    color: theme.textPrimary
  };

  const btnPrimary: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
    color: 'white',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const btnCancel: React.CSSProperties = {
    padding: '12px 24px',
    borderRadius: '12px',
    border: `1.5px solid ${theme.border}`,
    backgroundColor: theme.bgCard,
    color: theme.textSecondary,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  };

  const smallBtn = (bg: string, color: string, border?: string): React.CSSProperties => ({
    padding: isMobileView ? '8px 12px' : '8px 16px',
    borderRadius: '10px',
    border: border || 'none',
    backgroundColor: bg,
    color,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap'
  });

  const renderModal = () => {
    if (modal === 'none') return null;

    return (
      <>
        <div
          onClick={() => setModal('none')}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 1000, backdropFilter: 'blur(4px)'
          }}
        />
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          backgroundColor: theme.bgCard,
          borderRadius: '24px',
          padding: isMobileView ? '20px' : '32px',
          width: isMobileView ? '92vw' : '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 1001,
          boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
        }}>
          {modal === 'operation' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textPrimary, marginBottom: '20px' }}>
                Новая операция
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Тип</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['cash', 'card'] as const).map(t => (
                      <button key={t} onClick={() => setOpType(t)} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: opType === t ? (t === 'cash' ? '#10B981' : theme.accent) : theme.border,
                        backgroundColor: opType === t ? (t === 'cash' ? '#F0FDF4' : theme.accentBg) : theme.bgCard,
                        color: opType === t ? (t === 'cash' ? '#10B981' : theme.accent) : theme.textSecondary,
                        fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                      }}>
                        {t === 'cash' ? '💵 Наличные' : '💳 Карта'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Операция</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['in', 'out'] as const).map(o => (
                      <button key={o} onClick={() => setOpOperation(o)} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: opOperation === o ? (o === 'in' ? '#10B981' : '#EF4444') : theme.border,
                        backgroundColor: opOperation === o ? (o === 'in' ? '#F0FDF4' : '#FEF2F2') : theme.bgCard,
                        color: opOperation === o ? (o === 'in' ? '#10B981' : '#EF4444') : theme.textSecondary,
                        fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                      }}>
                        {o === 'in' ? '+ Приход' : '- Расход'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Сумма (Br)</label>
                  <input type="number" value={opAmount} onChange={e => setOpAmount(e.target.value)}
                    placeholder="0" style={inputStyle} min="0" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Описание</label>
                  <input type="text" value={opDescription} onChange={e => setOpDescription(e.target.value)}
                    placeholder="Описание операции" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Категория</label>
                  <select value={opCategory} onChange={e => setOpCategory(e.target.value as CashEntry['category'])}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {categoryOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Дата</label>
                  <input type="date" value={opDate} onChange={e => setOpDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setModal('none')} style={btnCancel}>Отмена</button>
                  <button onClick={handleAddOperation} style={btnPrimary}>Добавить</button>
                </div>
              </div>
            </>
          )}

          {modal === 'transfer' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textPrimary, marginBottom: '20px' }}>
                Перевод
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Откуда</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['cash', 'card'] as const).map(t => (
                      <button key={t} onClick={() => setTransferFrom(t)} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid',
                        borderColor: transferFrom === t ? '#F59E0B' : theme.border,
                        backgroundColor: transferFrom === t ? '#FFFBEB' : theme.bgCard,
                        color: transferFrom === t ? '#D97706' : theme.textSecondary,
                        fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                      }}>
                        {t === 'cash' ? '💵 Наличные' : '💳 Карта'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: '20px', color: '#F59E0B' }}>⬇️</div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Куда</label>
                  <div style={{
                    padding: '10px', borderRadius: '10px', border: `1.5px solid ${theme.border}`,
                    backgroundColor: theme.bgHover, textAlign: 'center', fontSize: '14px', fontWeight: '700', color: theme.textSecondary
                  }}>
                    {transferFrom === 'cash' ? '💳 Карта' : '💵 Наличные'}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Сумма (Br)</label>
                  <input type="number" value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                    placeholder="0" style={inputStyle} min="0" />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Комментарий</label>
                  <input type="text" value={transferComment} onChange={e => setTransferComment(e.target.value)}
                    placeholder="Комментарий (необязательно)" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setModal('none')} style={btnCancel}>Отмена</button>
                  <button onClick={handleTransfer} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#F59E0B,#FBBF24)' }}>
                    Перевести
                  </button>
                </div>
              </div>
            </>
          )}

          {modal === 'setBalance' && (
            <>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: theme.textPrimary, marginBottom: '20px' }}>
                Установить фактический баланс
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>
                    Наличные на руках (Br)
                  </label>
                  <input type="number" value={setCashVal} onChange={e => setSetCashVal(e.target.value)}
                    placeholder={String(cashAmount)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>
                    На карте (Br)
                  </label>
                  <input type="number" value={setCardVal} onChange={e => setSetCardVal(e.target.value)}
                    placeholder={String(cardAmount)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: theme.textSecondary, marginBottom: '6px', display: 'block' }}>Комментарий</label>
                  <textarea value={setBalanceNote} onChange={e => setSetBalanceNote(e.target.value)}
                    placeholder="Причина корректировки"
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button onClick={() => setModal('none')} style={btnCancel}>Отмена</button>
                  <button onClick={handleSetBalance} style={btnPrimary}>Сохранить</button>
                </div>
              </div>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <div style={{
      maxWidth: isMobileView ? '100%' : '1400px',
      margin: '0 auto',
      padding: isMobileView ? '16px' : '24px',
      paddingBottom: isMobileView ? '90px' : '24px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {renderModal()}

      {/* HEADER */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: isMobileView ? '22px' : '28px', fontWeight: '900', color: theme.textPrimary, margin: 0 }}>
          💰 Касса
        </h1>
        <p style={{ fontSize: '14px', color: theme.textMuted, marginTop: '4px' }}>
          Учёт наличных и безналичных средств
        </p>
      </div>

      {/* BLOCK 1 — Balance Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>
        {/* Cash card */}
        <div style={{
          background: 'linear-gradient(135deg,#10B981,#34D399)',
          borderRadius: '24px',
          padding: isMobileView ? '20px' : '28px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(16,185,129,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
          }} />
          <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>💵 НАЛИЧНЫЕ</div>
          <div style={{ fontSize: isMobileView ? '28px' : '36px', fontWeight: '900', lineHeight: 1.1 }}>
            {formatNum(cashAmount)} Br
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>на руках</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => openOperation('cash', 'in')}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              + Пополнить
            </button>
            <button onClick={() => openOperation('cash', 'out')}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              - Снять
            </button>
            <button onClick={() => { setSetCashVal(String(cashAmount)); setSetCardVal(String(cardAmount)); setModal('setBalance'); }}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              Установить
            </button>
          </div>
        </div>

        {/* Card card */}
        <div style={{
          background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
          borderRadius: '24px',
          padding: isMobileView ? '20px' : '28px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(99,102,241,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
          }} />
          <div style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9, marginBottom: '8px' }}>💳 КАРТА</div>
          <div style={{ fontSize: isMobileView ? '28px' : '36px', fontWeight: '900', lineHeight: 1.1 }}>
            {formatNum(cardAmount)} Br
          </div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>на карте</div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => openOperation('card', 'in')}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              + Пополнить
            </button>
            <button onClick={() => openOperation('card', 'out')}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              - Снять
            </button>
            <button onClick={() => { setSetCashVal(String(cashAmount)); setSetCardVal(String(cardAmount)); setModal('setBalance'); }}
              style={smallBtn('rgba(255,255,255,0.2)', 'white', '1px solid rgba(255,255,255,0.3)')}>
              Установить
            </button>
          </div>
        </div>
      </div>

      {/* Total */}
      <div style={{
        backgroundColor: theme.bgCard,
        borderRadius: '16px',
        padding: isMobileView ? '16px' : '20px',
        textAlign: 'center',
        marginBottom: '20px',
        boxShadow: theme.shadowMd,
        border: `1px solid ${theme.borderLight}`
      }}>
        <span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: '600' }}>ИТОГО НА СЧЕТУ: </span>
        <span style={{ fontSize: isMobileView ? '22px' : '28px', fontWeight: '900', color: theme.textPrimary }}>
          {formatNum(total)} Br
        </span>
      </div>

      {/* BLOCK 2 — Quick Operations */}
      <div style={{
        backgroundColor: theme.bgCard,
        borderRadius: '20px',
        padding: isMobileView ? '16px' : '20px',
        marginBottom: '20px',
        boxShadow: theme.shadowMd,
        border: `1px solid ${theme.borderLight}`
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary, marginBottom: '12px' }}>
          Быстрые операции
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobileView ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          <button onClick={() => openOperation('cash', 'in')}
            style={smallBtn('#F0FDF4', '#10B981', '1.5px solid #BBF7D0')}>
            + Приход нал
          </button>
          <button onClick={() => openOperation('card', 'in')}
            style={smallBtn(theme.accentBg, theme.accent, `1.5px solid ${theme.accentBorder}`)}>
            + Приход карта
          </button>
          <button onClick={() => openOperation('cash', 'out')}
            style={smallBtn('#FEF2F2', '#EF4444', '1.5px solid #FECACA')}>
            - Расход нал
          </button>
          <button onClick={() => openOperation('card', 'out')}
            style={smallBtn('#FEF2F2', '#EF4444', '1.5px solid #FECACA')}>
            - Расход карта
          </button>
          <button onClick={() => { setTransferFrom('cash'); setModal('transfer'); }}
            style={smallBtn('#FFFBEB', '#D97706', '1.5px solid #FDE68A')}>
            Нал → Карта
          </button>
          <button onClick={() => { setTransferFrom('card'); setModal('transfer'); }}
            style={smallBtn('#FFFBEB', '#D97706', '1.5px solid #FDE68A')}>
            Карта → Нал
          </button>
        </div>
      </div>

      {/* BLOCK 4 — Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap'
      }}>
        {([
          { key: 'all' as FilterType, label: 'Все' },
          { key: 'cash' as FilterType, label: '💵 Наличные' },
          { key: 'card' as FilterType, label: '💳 Карта' }
        ]).map(f => (
          <button key={f.key} onClick={() => setFilterType(f.key)} style={{
            padding: '8px 14px', borderRadius: '10px', border: '1.5px solid',
            borderColor: filterType === f.key ? theme.accent : theme.border,
            backgroundColor: filterType === f.key ? theme.accentBg : theme.bgCard,
            color: filterType === f.key ? theme.accent : theme.textSecondary,
            fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>{f.label}</button>
        ))}
        <div style={{ width: '1px', backgroundColor: theme.border, margin: '0 4px' }} />
        {([
          { key: 'all' as PeriodFilter, label: 'Всё время' },
          { key: 'today' as PeriodFilter, label: 'Сегодня' },
          { key: 'week' as PeriodFilter, label: 'Неделя' },
          { key: 'month' as PeriodFilter, label: 'Месяц' }
        ]).map(f => (
          <button key={f.key} onClick={() => setPeriodFilter(f.key)} style={{
            padding: '8px 14px', borderRadius: '10px', border: '1.5px solid',
            borderColor: periodFilter === f.key ? theme.accent : theme.border,
            backgroundColor: periodFilter === f.key ? theme.accentBg : theme.bgCard,
            color: periodFilter === f.key ? theme.accent : theme.textSecondary,
            fontSize: '13px', fontWeight: '600', cursor: 'pointer'
          }}>{f.label}</button>
        ))}
      </div>

      {/* BLOCK 3 — History */}
      <div style={{
        backgroundColor: theme.bgCard,
        borderRadius: '20px',
        padding: isMobileView ? '12px' : '20px',
        boxShadow: theme.shadowMd,
        border: `1px solid ${theme.borderLight}`
      }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: theme.textPrimary, marginBottom: '12px' }}>
          История операций
        </div>

        {filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: theme.textMuted }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            Операций пока нет
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredEntries.map(entry => {
              const isIn = entry.operation === 'in';
              const icon = entry.type === 'cash' ? '💵' : '💳';
              const dateStr = (() => {
                const d = safeDate(entry.date || entry.createdAt);
                if (!d) return '—';
                return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
              })();

              return (
                <div key={entry.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobileView ? '8px' : '12px',
                  padding: isMobileView ? '10px' : '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: isIn ? '#F0FDF4' : '#FEF2F2',
                  border: `1px solid ${isIn ? '#BBF7D0' : '#FECACA'}`,
                  transition: 'all 0.15s'
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: '600', color: theme.textPrimary,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {entry.description || '—'}
                    </div>
                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: '2px' }}>
                      {dateStr} · {categoryLabels[entry.category] || entry.category}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: '800',
                    color: isIn ? '#10B981' : '#EF4444',
                    flexShrink: 0
                  }}>
                    {isIn ? '+' : '-'}{formatNum(safeNumber(entry.amount))} Br
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cash;
