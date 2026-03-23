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

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white placeholder-gray-400';
const labelClass = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Название *</label>
            <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Контактное лицо *</label>
            <input className={inputClass} value={form.contact} onChange={(e) => set('contact', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Телефон *</label>
            <input type="tel" className={inputClass} value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Адрес</label>
            <input className={inputClass} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Примечания</label>
            <textarea rows={3} className={`${inputClass} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
              Отмена
            </button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
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

  const handleAdd = async (data: Omit<Supplier, 'id'>) => { await add(data); setShowForm(false); };
  const handleEdit = async (data: Omit<Supplier, 'id'>) => { if (!editSupplier?.id) return; await update(editSupplier.id, data); setEditSupplier(null); };
  const handleDelete = async (id: string) => { if (window.confirm('Удалить этого поставщика?')) await remove(id); };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><div className="text-gray-400 font-medium">Загрузка...</div></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Поставщики</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Добавить поставщика
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Поставщиков пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setEditSupplier(s)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Редактировать">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Удалить">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-2 text-gray-300 flex-shrink-0" />
                  <span>{s.contact}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-2 text-gray-300 flex-shrink-0" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-gray-300 flex-shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-start">
                    <MapPin className="w-3.5 h-3.5 mr-2 text-gray-300 flex-shrink-0 mt-0.5" />
                    <span>{s.address}</span>
                  </div>
                )}
                {s.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-50 text-gray-400 text-xs italic">
                    {s.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <SupplierForm title="Добавить поставщика" initial={emptySupplier} onSave={handleAdd} onCancel={() => setShowForm(false)} />}
      {editSupplier && <SupplierForm title="Редактировать поставщика" initial={editSupplier} onSave={handleEdit} onCancel={() => setEditSupplier(null)} />}
    </div>
  );
};

export default Suppliers;
