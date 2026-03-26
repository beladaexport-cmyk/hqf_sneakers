import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Expense } from '../types';
import { useViewMode } from '../contexts/ViewModeContext';
import { safeDate } from '../utils/helpers';

type Period = 'all' | 'today' | 'week' | 'month';
type ExpenseType = Expense['type'] | 'all';

const periodLabels: Record<Period, string> = {
  all: 'Все время',
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
};

const typeLabels: Record<Expense['type'], string> = {
  advertising: '📢 Реклама',
  delivery: '🚚 Доставка',
  other: '📝 Другое',
};


function filterByPeriod(expenses: Expense[], period: Period): Expense[] {
  if (period === 'all') return expenses;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'today') {
    cutoff.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    cutoff.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    cutoff.setMonth(now.getMonth() - 1);
  }
  return expenses.filter((e) => new Date(safeDate(e.date) || Date.now()) >= cutoff);
}

const emptyExpense: Omit<Expense, 'id'> = {
  type: 'advertising',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

interface ExpenseFormProps {
  initial: Omit<Expense, 'id'>;
  onSave: (data: Omit<Expense, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState<Omit<Expense, 'id'>>(initial);

  const set = <K extends keyof Omit<Expense, 'id'>>(field: K, value: Omit<Expense, 'id'>[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      alert('Заполните описание расхода');
      return;
    }
    if (form.amount <= 0) {
      alert('Сумма должна быть больше 0');
      return;
    }
    onSave({ ...form, notes: form.notes?.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип расхода *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.type}
              onChange={(e) => set('type', e.target.value as Expense['type'])}
              required
            >
              <option value="advertising">📢 Реклама</option>
              <option value="delivery">🚚 Доставка</option>
              <option value="other">📝 Другое</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (Br) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.amount || ''}
              onChange={(e) => set('amount', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Реклама в Instagram"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания (необязательно)
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Дополнительная информация..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Expenses: React.FC = () => {
  const { isMobileView } = useViewMode();
  const { data: expenses, loading, error, add, update, remove } = useFirestore<Expense>('expenses');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [typeFilter, setTypeFilter] = useState<ExpenseType>('all');

  const periodFiltered = filterByPeriod([...expenses].reverse(), period);
  const filtered = typeFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter((e) => e.type === typeFilter);

  const totalExp = filtered
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const adExp = filtered
    .filter(e => e.type === 'advertising')
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const delExp = filtered
    .filter(e => e.type === 'delivery')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleAdd = async (data: Omit<Expense, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Expense, 'id'>) => {
    if (!editExpense?.id) return;
    await update(editExpense.id, data);
    setEditExpense(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    await remove(deleteConfirm);
    setDeleteConfirm(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse space-y-4 w-full">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  const exportToCSV = () => {
    const headers = ['Дата', 'Тип', 'Сумма', 'Описание', 'Примечание'];
    const rows = filtered.map(e => [
      e.date || '',
      e.type || '',
      e.amount || 0,
      e.description || '',
      e.notes || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `расходы_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          ⚠️ Ошибка загрузки данных. Проверьте соединение.
        </div>
      )}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'16px',
        gap:'12px'
      }}>
        <div style={{minWidth:0}}>
          <h1 style={{
            margin:'0 0 2px 0',
            fontSize:'22px',
            fontWeight:'800',
            color:'#0F172A',
            letterSpacing:'-0.3px'
          }}>
            💸 Расходы
          </h1>
          <p style={{
            margin:0,
            fontSize:'12px',
            color:'#94A3B8'
          }}>
            Управление расходами
          </p>
        </div>
        <button onClick={exportToCSV} style={{ padding:'10px 14px', backgroundColor:'#10B981', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:'700', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
          📥 CSV
        </button>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding:'10px 14px',
            backgroundColor:'#EF4444',
            color:'white',
            border:'none',
            borderRadius:'12px',
            fontSize:'13px',
            fontWeight:'700',
            cursor:'pointer',
            whiteSpace:'nowrap',
            flexShrink:0,
            boxShadow:'0 4px 12px rgba(239,68,68,0.35)'
          }}
        >
          + Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Period */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ExpenseType)}
        >
          <option value="all">Все типы</option>
          <option value="advertising">📢 Реклама</option>
          <option value="delivery">🚚 Доставка</option>
          <option value="other">📝 Другое</option>
        </select>
      </div>

      {/* Stat Cards */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobileView ? '1fr' : 'repeat(3,1fr)',
        gap:'10px',
        marginBottom:'16px'
      }}>
        {[
          {
            label:'Итого',
            value:totalExp.toFixed(0),
            icon:'💸',
            color:'#EF4444',
            bg:'#FEF2F2',
            border:'#FECACA'
          },
          {
            label:'Реклама',
            value:adExp.toFixed(0),
            icon:'📣',
            color:'#6366F1',
            bg:'#EEF2FF',
            border:'#C7D2FE'
          },
          {
            label:'Доставка',
            value:delExp.toFixed(0),
            icon:'📦',
            color:'#F59E0B',
            bg:'#FFFBEB',
            border:'#FDE68A'
          }
        ].map(s=>(
          <div
            key={s.label}
            style={{
              backgroundColor:s.bg,
              border:`1.5px solid ${s.border}`,
              borderRadius:'14px',
              padding:'12px 10px',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              textAlign:'center',
              gap:'4px'
            }}
          >
            <div style={{fontSize:'22px'}}>
              {s.icon}
            </div>
            <div style={{
              fontSize:'14px',
              fontWeight:'800',
              color:s.color,
              lineHeight:1
            }}>
              {s.value}
              <span style={{
                fontSize:'10px',
                marginLeft:'2px'
              }}>
                Br
              </span>
            </div>
            <div style={{
              fontSize:'10px',
              color:'#94A3B8',
              fontWeight:'600'
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Expense Cards */}
      <div style={{
        display:'flex',
        flexDirection:'column',
        gap:'10px'
      }}>
        {filtered.map(expense=>(
          <div
            key={expense.id}
            style={{
              backgroundColor:'white',
              borderRadius:'14px',
              padding:'12px 14px',
              display:'flex',
              alignItems:'center',
              gap:'10px',
              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
              border:'1px solid #F1F5F9',
              marginBottom:'8px'
            }}
          >
            <div style={{
              width:'40px',
              height:'40px',
              borderRadius:'12px',
              backgroundColor:
                expense.type==='advertising'
                  ? '#EEF2FF'
                  : expense.type==='delivery'
                  ? '#FFFBEB'
                  : '#F0FDF4',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:'20px',
              flexShrink:0
            }}>
              {expense.type==='advertising'
                ? '📣'
                : expense.type==='delivery'
                ? '📦' : '💼'}
            </div>

            <div style={{flex:1,minWidth:0}}>
              <div style={{
                fontSize:'14px',
                fontWeight:'700',
                color:'#1E293B',
                whiteSpace:'nowrap',
                overflow:'hidden',
                textOverflow:'ellipsis'
              }}>
                {expense.description || typeLabels[expense.type]}
              </div>
              <div style={{
                fontSize:'11px',
                color:'#94A3B8',
                marginTop:'2px',
                display:'flex',
                gap:'6px',
                alignItems:'center'
              }}>
                <span>📅 {expense.date}</span>
                <span style={{
                  padding:'1px 6px',
                  borderRadius:'4px',
                  backgroundColor:
                    expense.type==='advertising'
                      ? '#EEF2FF'
                      : expense.type==='delivery'
                      ? '#FFFBEB'
                      : '#F0FDF4',
                  color:
                    expense.type==='advertising'
                      ? '#6366F1'
                      : expense.type==='delivery'
                      ? '#F59E0B'
                      : '#10B981',
                  fontWeight:'600',
                  fontSize:'10px'
                }}>
                  {typeLabels[expense.type]}
                </span>
              </div>
            </div>

            <div style={{
              fontSize:'15px',
              fontWeight:'800',
              color:'#EF4444',
              flexShrink:0
            }}>
              -{Number(expense.amount).toFixed(2)} Br
            </div>

            <div style={{
              display:'flex',
              gap:'4px',
              flexShrink:0
            }}>
              <button
                onClick={()=>setEditExpense(expense)}
                style={{
                  width:'32px',
                  height:'32px',
                  border:'1px solid #E2E8F0',
                  borderRadius:'8px',
                  backgroundColor:'white',
                  cursor:'pointer',
                  fontSize:'13px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >✏️</button>
              <button
                onClick={()=>handleDeleteClick(expense.id)}
                style={{
                  width:'32px',
                  height:'32px',
                  border:'none',
                  borderRadius:'8px',
                  backgroundColor:'#FEF2F2',
                  cursor:'pointer',
                  fontSize:'13px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >🗑️</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign:'center',
            padding:'60px 20px',
            color:'#94A3B8'
          }}>
            <div style={{fontSize:'56px'}}>💸</div>
            <div style={{
              fontSize:'18px',
              fontWeight:'700',
              color:'#475569',
              marginTop:'16px'
            }}>
              Расходов нет
            </div>
            <div style={{
              fontSize:'14px',
              marginTop:'6px'
            }}>
              Нажми + Добавить расход
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          title="Добавить расход"
          initial={emptyExpense}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editExpense && (
        <ExpenseForm
          title="Редактировать расход"
          initial={editExpense}
          onSave={handleEdit}
          onCancel={() => setEditExpense(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Удалить запись?</h3>
            <p className="text-gray-500 mb-6">Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">Отмена</button>
              <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600">Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
