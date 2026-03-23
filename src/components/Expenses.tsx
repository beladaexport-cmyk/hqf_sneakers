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
  other: <FileText className="w-4 h-4 text-gray-500" />,
};

const typeBadgeColors: Record<Expense['type'], string> = {
  advertising: 'bg-purple-100 text-purple-700',
  delivery: 'bg-blue-100 text-blue-700',
  other: 'bg-gray-100 text-gray-700',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип расхода *</label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.type}
              onChange={(e) => set('type', e.target.value as Expense['type'])}
              required
            >
              <option value="advertising">Реклама</option>
              <option value="delivery">Доставка</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Сумма (Br) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.amount || ''}
              onChange={(e) => set('amount', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
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
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
              placeholder="Дополнительная информация..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
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
  const { data: expenses, loading, add, update, remove } = useFirestore<Expense>('expenses');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [typeFilter, setTypeFilter] = useState<ExpenseType>('all');

  const periodFiltered = filterByPeriod([...expenses].reverse(), period);
  const filtered = typeFilter === 'all'
    ? periodFiltered
    : periodFiltered.filter((e) => e.type === typeFilter);

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleAdd = async (data: Omit<Expense, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Expense, 'id'>) => {
    if (!editExpense?.id) return;
    await update(editExpense.id, data);
    setEditExpense(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этот расход?')) {
      await remove(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Расходы</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить расход
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        <select
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ExpenseType)}
        >
          <option value="all">Все типы</option>
          <option value="advertising">Реклама</option>
          <option value="delivery">Доставка</option>
          <option value="other">Другое</option>
        </select>

        <div className="flex items-center text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2 sm:ml-auto">
          <span className="text-sm font-medium">
            Итого: {totalAmount.toLocaleString('ru-RU')} Br
          </span>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-card space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-400">
              {expenses.length === 0 ? 'Расходов пока нет. Добавьте первый!' : 'Нет расходов за выбранный период'}
            </p>
          </div>
        ) : (
          filtered.map((expense) => (
            <div key={expense.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {typeIcons[expense.type]}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[expense.type]}`}>
                    {typeLabels[expense.type]}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString('ru-RU')}</span>
              </div>
              <p className="font-medium text-gray-900 text-sm">{expense.description}</p>
              {expense.notes && <p className="text-xs text-gray-400 mt-1">{expense.notes}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="font-bold text-red-600">{expense.amount.toLocaleString('ru-RU')} Br</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditExpense(expense)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="desktop-table bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                {['Дата', 'Тип', 'Описание', 'Сумма', 'Примечания', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {expenses.length === 0
                      ? 'Расходов пока нет. Добавьте первый!'
                      : 'Нет расходов за выбранный период'}
                  </td>
                </tr>
              ) : (
                filtered.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        {typeIcons[expense.type]}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[expense.type]}`}>
                          {typeLabels[expense.type]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600">
                      {expense.amount.toLocaleString('ru-RU')} Br
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {expense.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditExpense(expense)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default Expenses;
