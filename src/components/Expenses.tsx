import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Megaphone, Truck, FileText, Home, Users, Package } from 'lucide-react';
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
  packaging: 'Упаковка',
  rent: 'Аренда',
  salary: 'Зарплата',
  other: 'Другое',
};

const typeIcons: Record<Expense['type'], React.ReactNode> = {
  advertising: <Megaphone className="w-4 h-4 text-purple-500" />,
  delivery: <Truck className="w-4 h-4 text-blue-500" />,
  packaging: <Package className="w-4 h-4 text-teal-500" />,
  rent: <Home className="w-4 h-4 text-orange-500" />,
  salary: <Users className="w-4 h-4 text-green-500" />,
  other: <FileText className="w-4 h-4 text-gray-500" />,
};

function filterByPeriod(expenses: Expense[], period: Period): Expense[] {
  if (period === 'all') return expenses;
  const now = new Date();
  const cutoff = new Date();
  if (period === 'today') cutoff.setHours(0, 0, 0, 0);
  else if (period === 'week') cutoff.setDate(now.getDate() - 7);
  else if (period === 'month') cutoff.setMonth(now.getMonth() - 1);
  return expenses.filter((e) => new Date(e.date) >= cutoff);
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
    if (!form.description.trim()) { alert('Заполните описание расхода'); return; }
    if (form.amount <= 0) { alert('Сумма должна быть больше 0'); return; }
    onSave({ ...form, notes: form.notes?.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип расхода *</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.type} onChange={(e) => set('type', e.target.value as Expense['type'])} required>
              <option value="advertising">Реклама</option>
              <option value="delivery">Доставка</option>
              <option value="packaging">Упаковка</option>
              <option value="rent">Аренда</option>
              <option value="salary">Зарплата</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (Br) *</label>
            <input type="number" min="0.01" step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.amount || ''} onChange={(e) => set('amount', Number(e.target.value))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Например: Реклама в Instagram" value={form.description} onChange={(e) => set('description', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Дополнительная информация..." value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Сохранить</button>
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

  const filtered = useMemo(() => {
    const periodFiltered = filterByPeriod([...expenses].reverse(), period);
    return typeFilter === 'all' ? periodFiltered : periodFiltered.filter((e) => e.type === typeFilter);
  }, [expenses, period, typeFilter]);

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  // Breakdown by type
  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => { map[e.type] = (map[e.type] ?? 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const handleAdd = async (data: Omit<Expense, 'id'>) => { await add(data); setShowForm(false); };
  const handleEdit = async (data: Omit<Expense, 'id'>) => { if (!editExpense?.id) return; await update(editExpense.id, data); setEditExpense(null); };
  const handleDelete = async (id: string) => { if (window.confirm('Удалить этот расход?')) await remove(id); };

  if (loading) return <div className="flex items-center justify-center p-8"><div className="text-gray-500">Загрузка данных...</div></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900">Расходы</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />Добавить расход
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow px-4 py-3 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">Итого расходов</p>
          <p className="text-lg font-bold text-red-600">{totalAmount.toLocaleString('ru-RU')} Br</p>
        </div>
        {breakdown.slice(0, 3).map(([type, amount]) => (
          <div key={type} className="bg-white rounded-lg shadow px-4 py-3">
            <p className="text-xs text-gray-500 flex items-center gap-1">{typeIcons[type as Expense['type']]}{typeLabels[type as Expense['type']]}</p>
            <p className="text-lg font-bold text-gray-900">{amount.toLocaleString('ru-RU')} Br</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{periodLabels[p]}</button>
          ))}
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ExpenseType)}>
          <option value="all">Все типы</option>
          <option value="advertising">Реклама</option>
          <option value="delivery">Доставка</option>
          <option value="packaging">Упаковка</option>
          <option value="rent">Аренда</option>
          <option value="salary">Зарплата</option>
          <option value="other">Другое</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Дата', 'Тип', 'Описание', 'Сумма', 'Примечания', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{expenses.length === 0 ? 'Расходов пока нет. Добавьте первый!' : 'Нет расходов за выбранный период'}</td></tr>
              ) : filtered.map((expense, idx) => (
                <tr key={expense.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(expense.date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-sm"><div className="flex items-center gap-1.5">{typeIcons[expense.type]}<span className="text-gray-700">{typeLabels[expense.type]}</span></div></td>
                  <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">{expense.amount.toLocaleString('ru-RU')} Br</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{expense.notes || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setEditExpense(expense)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Редактировать"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Удалить"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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
