import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { Supplier, Product, Preorder } from '../types';

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Телефон *</label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Примечания</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={form.notes}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
  const { data: products } = useFirestore<Product>('products');
  const { data: preorders } = useFirestore<Preorder>('preorders');
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
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'24px'
      }}>
        <div>
          <h1 style={{
            margin:'0 0 4px 0',
            fontSize:'28px',
            fontWeight:'800',
            color:'#0F172A',
            letterSpacing:'-0.5px'
          }}>
            🏪 Поставщики
          </h1>
          <p style={{
            margin:0,
            fontSize:'14px',
            color:'#94A3B8'
          }}>
            {suppliers?.length || 0} поставщиков
            в базе
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding:'12px 20px',
            background:
              'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color:'white',
            border:'none',
            borderRadius:'12px',
            fontSize:'14px',
            fontWeight:'700',
            cursor:'pointer',
            boxShadow:
              '0 4px 14px rgba(99,102,241,0.4)',
            transition:'all 0.2s'
          }}
          onMouseEnter={e=>{
            e.currentTarget.style.transform='translateY(-1px)';
            e.currentTarget.style.boxShadow='0 6px 20px rgba(99,102,241,0.5)';
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.transform='translateY(0)';
            e.currentTarget.style.boxShadow='0 4px 14px rgba(99,102,241,0.4)';
          }}
        >
          + Добавить поставщика
        </button>
      </div>

      {/* Cards Grid */}
      <div style={{
        display:'grid',
        gridTemplateColumns:
          'repeat(auto-fill,minmax(300px,1fr))',
        gap:'16px'
      }}>
        {suppliers?.map(supplier=>(
          <div
            key={supplier.id}
            style={{
              backgroundColor:'white',
              borderRadius:'20px',
              overflow:'hidden',
              boxShadow:'0 4px 20px rgba(0,0,0,0.07)',
              border:'1px solid #F1F5F9',
              transition:'all 0.2s ease'
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform='translateY(-3px)';
              e.currentTarget.style.boxShadow='0 12px 32px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform='translateY(0)';
              e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.07)';
            }}
          >
            <div style={{
              background:
                'linear-gradient(135deg,#6366F1,#8B5CF6)',
              padding:'20px',
              display:'flex',
              alignItems:'center',
              gap:'14px'
            }}>
              <div style={{
                width:'52px',
                height:'52px',
                borderRadius:'14px',
                backgroundColor:'rgba(255,255,255,0.2)',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontSize:'26px',
                flexShrink:0
              }}>
                🏪
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{
                  fontSize:'18px',
                  fontWeight:'800',
                  color:'white',
                  whiteSpace:'nowrap',
                  overflow:'hidden',
                  textOverflow:'ellipsis'
                }}>
                  {supplier.name}
                </div>
                {(supplier as any).instagram && (
                  <div style={{
                    fontSize:'13px',
                    color:'rgba(255,255,255,0.75)',
                    marginTop:'2px',
                    whiteSpace:'nowrap',
                    overflow:'hidden',
                    textOverflow:'ellipsis'
                  }}>
                    📸 {(supplier as any).instagram}
                  </div>
                )}
              </div>
            </div>

            <div style={{padding:'16px'}}>
              <div style={{
                display:'grid',
                gridTemplateColumns:'1fr 1fr',
                gap:'10px',
                marginBottom:'14px'
              }}>
                <div style={{
                  backgroundColor:'#F8FAFC',
                  borderRadius:'10px',
                  padding:'10px',
                  textAlign:'center',
                  border:'1px solid #E2E8F0'
                }}>
                  <div style={{
                    fontSize:'22px',
                    fontWeight:'800',
                    color:'#6366F1'
                  }}>
                    {products?.filter(p=>
                      p.supplier===supplier.name
                    ).length || 0}
                  </div>
                  <div style={{
                    fontSize:'10px',
                    color:'#94A3B8',
                    fontWeight:'700',
                    letterSpacing:'0.5px'
                  }}>
                    ТОВАРОВ
                  </div>
                </div>
                <div style={{
                  backgroundColor:'#F0FDF4',
                  borderRadius:'10px',
                  padding:'10px',
                  textAlign:'center',
                  border:'1px solid #A7F3D0'
                }}>
                  <div style={{
                    fontSize:'22px',
                    fontWeight:'800',
                    color:'#10B981'
                  }}>
                    {preorders?.filter(p=>
                      p.supplier===supplier.name
                    ).length || 0}
                  </div>
                  <div style={{
                    fontSize:'10px',
                    color:'#94A3B8',
                    fontWeight:'700',
                    letterSpacing:'0.5px'
                  }}>
                    ПРЕДЗАКАЗОВ
                  </div>
                </div>
              </div>

              {supplier.phone && (
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  gap:'8px',
                  padding:'9px 12px',
                  backgroundColor:'#F8FAFC',
                  borderRadius:'10px',
                  marginBottom:'10px',
                  border:'1px solid #E2E8F0'
                }}>
                  <span>📞</span>
                  <span style={{
                    fontSize:'13px',
                    color:'#374151',
                    fontWeight:'500'
                  }}>
                    {supplier.phone}
                  </span>
                </div>
              )}

              {supplier.notes && (
                <div style={{
                  fontSize:'12px',
                  color:'#92400E',
                  padding:'9px 12px',
                  backgroundColor:'#FFFBEB',
                  borderRadius:'8px',
                  marginBottom:'12px',
                  border:'1px solid #FDE68A'
                }}>
                  💬 {supplier.notes}
                </div>
              )}

              <div style={{display:'flex',gap:'8px'}}>
                <button
                  onClick={()=>
                    setEditSupplier(supplier)
                  }
                  style={{
                    flex:1,
                    padding:'10px',
                    border:'1.5px solid #E2E8F0',
                    borderRadius:'10px',
                    backgroundColor:'white',
                    color:'#475569',
                    fontSize:'13px',
                    fontWeight:'600',
                    cursor:'pointer',
                    transition:'all 0.15s'
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.backgroundColor='#F8FAFC';
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.backgroundColor='white';
                  }}
                >
                  ✏️ Изменить
                </button>
                <button
                  onClick={()=>
                    handleDelete(supplier.id)
                  }
                  style={{
                    width:'40px',
                    height:'40px',
                    border:'none',
                    borderRadius:'10px',
                    backgroundColor:'#FEF2F2',
                    color:'#EF4444',
                    fontSize:'16px',
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    transition:'all 0.15s'
                  }}
                  onMouseEnter={e=>{
                    e.currentTarget.style.backgroundColor='#FECACA';
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style.backgroundColor='#FEF2F2';
                  }}
                >🗑️</button>
              </div>
            </div>
          </div>
        ))}

        {(!suppliers || suppliers.length===0) && (
          <div style={{
            gridColumn:'1/-1',
            textAlign:'center',
            padding:'60px 20px',
            color:'#94A3B8'
          }}>
            <div style={{fontSize:'56px'}}>🏪</div>
            <div style={{
              fontSize:'18px',
              fontWeight:'700',
              color:'#475569',
              marginTop:'16px'
            }}>
              Поставщиков нет
            </div>
            <div style={{
              fontSize:'14px',
              marginTop:'6px'
            }}>
              Добавь первого поставщика
            </div>
          </div>
        )}
      </div>

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
