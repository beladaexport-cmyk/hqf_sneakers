import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Megaphone, Truck, FileText } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Expense } from '../types';

type Period = 'all' | 'today' | 'week' | 'month';
type ExpenseType = Expense['type'] | 'all';

const periodLabels: Record<Period, string> = {
  all: 'Все время',
  today: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
};

const typeLabels: Record<Expense['type'], string> = {
  advertising: 'Реклама',
  delivery: 'Доставка',
  other: 'Другое',
};

const typeIcons: Record<Expense['type'], React.ReactNode> = {
  advertising: <Megaphone className="w-4 h-4 text-purple-500" />,
  delivery: <Truck className="w-4 h-4 text-blue-500" />,
  other: <FileText className="w-4 h-4 text-gray-400" />,
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
  return expenses.filter((e) => new Date(e.date) >= cutoff);
}

const emptyExpense: Omit<Expense, 'id'> = {
  type: 'advertising',
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white placeholder-gray-400';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

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
    if (!form.description.trim()) { alert('Заполните описание расхода'); return; }
    if (form.amount <= 0) { alert('Сумма должна быть больше 0'); return; }
    onSave({ ...form, notes: form.notes?.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Тип расхода *</label>
            <select className={inputClass} value={form.type} onChange={(e) => set('type', e.target.value as Expense['type'])} required>
              <option value="advertising">Реклама</option>
              <option value="delivery">Доставка</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Сумма (Br) *</label>
            <input type="number" min="0.01" step="0.01" className={inputClass} value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} required />
          </div>
          <div>
            <label className={labelClass}>Описание *</label>
            <input className={inputClass} placeholder="Реклама в Instagram" value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Дата *</label>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Примечания</label>
            <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Дополнительная информация..." value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Отмена
            </button>
            <button type="submit" className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium shadow-sm">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Expenses: React.FC = () => {
  const { data: expenses, loading, add, update, remove } = useFirestore<Expense>('expenses');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [typeFilter, setTypeFilter] = useState<ExpenseType>('all');

  const periodFiltered = filterByPeriod([...expenses].reverse(), period);
  const filtered = typeFilter === 'all' ? periodFiltered : periodFiltered.filter((e) => e.type === typeFilter);
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleAdd = async (data: Omit<Expense, 'id'>) => { await add(data); setShowForm(false); };
  const handleEdit = async (data: Omit<Expense, 'id'>) => { if (!editExpense?.id) return; await update(editExpense.id, data); setEditExpense(null); };
  const handleDelete = async (id: string) => { if (window.confirm('Удалить этот расход?')) await remove(id); };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="text-gray-400 font-medium">Загрузка...</div></div>;
  }

  const tabClass = (active: boolean) =>
    `px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Расходы</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Добавить расход
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={tabClass(period === p)}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
        <select className={`border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ExpenseType)}>
          <option value="all">Все типы</option>
          <option value="advertising">Реклама</option>
          <option value="delivery">Доставка</option>
          <option value="other">Другое</option>
        </select>
        <div className="flex items-center text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 ml-auto">
          <span className="text-sm font-bold">Итого: {totalAmount.toLocaleString('ru-RU')} Br</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/80">
                {['Дата', 'Тип', 'Описание', 'Сумма', 'Примечания', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {expenses.length === 0 ? 'Расходов пока нет' : 'Нет расходов за выбранный период'}
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(expense.date).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        {typeIcons[expense.type]}
                        <span className="text-gray-700 font-medium">{typeLabels[expense.type]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600">{expense.amount.toLocaleString('ru-RU')} Br</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{expense.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditExpense(expense)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Редактировать">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <ExpenseForm title="Добавить расход" initial={emptyExpense} onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editExpense && <ExpenseForm title="Редактировать расход" initial={editExpense} onSave={handleEdit} onCancel={() => setEditExpense(null)} />}
    </div>
  );
};

export default Expenses;
