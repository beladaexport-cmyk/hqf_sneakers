import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Phone, Mail, MapPin, User } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Supplier } from '../types';

const emptySupplier: Omit<Supplier, 'id'> = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

interface SupplierFormProps {
  initial: Omit<Supplier, 'id'>;
  onSave: (data: Omit<Supplier, 'id'>) => void;
  onCancel: () => void;
  title: string;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(initial);

  const set = (field: keyof Omit<Supplier, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.phone) {
      alert('Заполните обязательные поля: Название, Контакт, Телефон');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Контактное лицо *
            </label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <input
              type="tel"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-shadow"
              value={form.notes}
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
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Suppliers: React.FC = () => {
  const { data: suppliers, loading, add, update, remove } = useFirestore<Supplier>('suppliers');
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const handleAdd = async (data: Omit<Supplier, 'id'>) => {
    await add(data);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Supplier, 'id'>) => {
    if (!editSupplier?.id) return;
    await update(editSupplier.id, data);
    setEditSupplier(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить этого поставщика?')) {
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
        <h2 className="text-xl font-bold text-gray-900">Поставщики</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить поставщика
        </button>
      </div>

      {/* Cards Grid */}
      {suppliers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400">Поставщиков пока нет. Добавьте первого!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{s.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditSupplier(s)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2.5 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <span>{s.contact}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <span>{s.address}</span>
                  </div>
                )}
                {s.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-gray-400 italic text-xs">
                    {s.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <SupplierForm
          title="Добавить поставщика"
          initial={emptySupplier}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editSupplier && (
        <SupplierForm
          title="Редактировать поставщика"
          initial={editSupplier}
          onSave={handleEdit}
          onCancel={() => setEditSupplier(null)}
        />
      )}
    </div>
  );
};

export default Suppliers;
