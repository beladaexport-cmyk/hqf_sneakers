import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFirestore } from '../hooks/useFirestore';
import { sanitizeForFirestore } from '../utils/sanitizeFirestore';
import { Preorder, PreorderStatus } from '../types';
import { SIZE_OPTIONS } from '../utils/sizeChart';
import { useViewMode } from '../contexts/ViewModeContext';

const emptyPreorder: Omit<Preorder, 'id' | 'createdAt'> = {
  modelId: '',
  modelName: '',
  sizeId: '',
  sizeEU: '',
  quantity: 1,
  purchasePrice: 0,
  retailPrice: 0,
  supplier: '',
  expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  status: 'pending',
  notes: '',
  forWho: '',
};

interface PreorderFormProps {
  initial: Omit<Preorder, 'id' | 'createdAt'>;
  onSave: (data: Omit<Preorder, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  title: string;
}

const PreorderForm: React.FC<PreorderFormProps> = ({ initial, onSave, onCancel, title }) => {
  const [form, setForm] = useState(initial);

  const set = (field: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelName || !form.sizeEU || !form.supplier) {
      alert('Заполните обязательные поля: Название модели, Размер, Поставщик');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              display: 'block',
              marginBottom: '8px'
            }}>
              Фото пары
            </label>
            <div
              onClick={() => document.getElementById('newPreorderPhoto')?.click()}
              style={{
                border: '2px dashed #E2E8F0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#F8FAFC',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#6366F1';
                e.currentTarget.style.backgroundColor = '#EEF2FF';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.backgroundColor = '#F8FAFC';
              }}
            >
              {form.image ? (
                <img
                  src={form.image}
                  alt="preview"
                  style={{
                    width: '100%',
                    maxHeight: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>
                    Нажми чтобы добавить фото
                  </div>
                </div>
              )}
            </div>
            <input
              type="file"
              id="newPreorderPhoto"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  setForm(prev => ({
                    ...prev,
                    image: event.target?.result as string
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название модели *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.modelName}
                onChange={(e) => set('modelName', e.target.value)}
                placeholder="Nike Air Jordan 1 Low Shadow"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Размер EU *</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.sizeEU}
                  onChange={(e) => set('sizeEU', e.target.value)}
                  required
                >
                  <option value="">Выберите размер</option>
                  {SIZE_OPTIONS.map((eu) => (
                    <option key={eu} value={eu}>
                      EU {eu}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.quantity}
                  onChange={(e) => set('quantity', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Закупочная цена (Br)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.purchasePrice}
                  onChange={(e) => set('purchasePrice', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Розничная цена (Br)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.retailPrice}
                  onChange={(e) => set('retailPrice', Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Поставщик *</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.supplier}
                onChange={(e) => set('supplier', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ожидаемая дата</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.expectedDate}
                onChange={(e) => set('expectedDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Для кого (Instagram)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.forWho || ''}
                onChange={(e) => set('forWho', e.target.value)}
                placeholder="@username или ссылка на Instagram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
              />
            </div>
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

const Preorders: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { isMobileView } = useViewMode();
  const { data: preorders, loading, add, update, remove } = useFirestore<Preorder>('preorders');
  const [showForm, setShowForm] = useState(false);
  const [editPreorder, setEditPreorder] = useState<Preorder | null>(null);
  const [statusFilter, setStatusFilter] = useState<PreorderStatus | 'all'>('all');
  const [photoTargetPreorder, setPhotoTargetPreorder] = useState<Preorder | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [arrivedModal, setArrivedModal] = useState<{
    show: boolean;
    preorder: Preorder | null;
    buyerTag: string;
    productId: string | null;
    alreadyExists: boolean;
  }>({
    show: false,
    preorder: null,
    buyerTag: '',
    productId: null,
    alreadyExists: false
  });

  const [sellModal, setSellModal] = useState<{ show: boolean; preorder: Preorder | null }>({
    show: false,
    preorder: null
  });
  const [sellForm, setSellForm] = useState({
    customerName: '',
    customerInstagram: '',
    price: '',
    purchasePrice: '',
    paymentMethod: 'наличные',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [sellLoading, setSellLoading] = useState(false);

  const [cloneModal, setCloneModal] = useState<{ show: boolean; preorder: Preorder | null }>({
    show: false,
    preorder: null
  });
  const [cloneForm, setCloneForm] = useState({
    size: '',
    forWho: '',
    purchasePrice: '',
    sellingPrice: '',
    notes: ''
  });
  const [cloneLoading, setCloneLoading] = useState(false);

  const filtered = statusFilter === 'all'
    ? preorders
    : preorders.filter((p) => p.status === statusFilter);

  const pending = preorders.filter((p) => p.status === 'pending');
  const totalPairs = pending.reduce((sum, p) => sum + p.quantity, 0);
  const totalExpectedRevenue = pending.reduce((sum, p) => sum + p.retailPrice * p.quantity, 0);

  const handleAdd = async (data: Omit<Preorder, 'id' | 'createdAt'>) => {
    await add({ ...data, image: data.image || undefined, createdAt: new Date().toISOString() });
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Preorder, 'id' | 'createdAt'>) => {
    if (!editPreorder?.id) return;
    await update(editPreorder.id, data);
    setEditPreorder(null);
  };

  const handleArrived = async (preorder: Preorder) => {
    console.log('=== handleArrived START ===');
    console.log('preorder object:', preorder);
    console.log('preorder keys:', Object.keys(preorder));

    try {
      // STEP 1: Update preorder status
      console.log('Step 1: Updating preorder status...');
      await updateDoc(
        doc(db, 'preorders', preorder.id),
        {
          status: 'arrived',
          arrivedAt: new Date().toISOString()
        }
      );
      console.log('✅ Step 1 done: Status updated to arrived');

      // STEP 2: Extract Instagram username / buyer tag
      const forWhoRaw = preorder.forWho || '';
      console.log('Step 2: forWhoRaw:', forWhoRaw);

      let buyerTag = forWhoRaw;
      if (forWhoRaw.includes('instagram.com/')) {
        const parts = forWhoRaw.split('instagram.com/');
        const username = parts[1]?.split('/')[0]?.split('?')[0] || '';
        buyerTag = username ? `@${username}` : forWhoRaw;
      } else if (forWhoRaw.startsWith('http')) {
        buyerTag = forWhoRaw;
      }
      console.log('buyerTag:', buyerTag);

      // STEP 3: Check if already in catalog
      console.log('Step 3: Checking if already in catalog...');
      console.log('Querying products where preorderId ==', preorder.id);
      const q = query(
        collection(db, 'products'),
        where('preorderId', '==', preorder.id)
      );
      const existing = await getDocs(q);
      console.log('Existing docs count:', existing.size);

      if (!existing.empty) {
        console.log('⚠️ Already in catalog, showing modal');
        setArrivedModal({
          show: true,
          preorder,
          buyerTag,
          productId: existing.docs[0].id,
          alreadyExists: true
        });
        return;
      }

      // STEP 4: Build product object
      const productName = preorder.modelName || 'Без названия';
      console.log('Step 4: Building product. Name:', productName);

      const newProduct = {
        sku: `PRE-${preorder.id.slice(0, 6).toUpperCase()}`,
        brand: preorder.modelName?.split(' ')[0] || '',
        model: productName,
        size: preorder.sizeEU || '',
        sizes: preorder.sizeEU ? [preorder.sizeEU] : [],
        color: '',
        purchasePrice: Number(preorder.purchasePrice || 0),
        retailPrice: Number(preorder.retailPrice || 0),
        image: preorder.image || '',
        images: preorder.image ? [preorder.image] : [],
        supplier: preorder.supplier || '',
        quantity: preorder.quantity || 1,
        category: 'sport' as const,
        status: 'available' as const,
        location: '',
        minStock: 1,
        dateAdded: new Date().toISOString().split('T')[0],

        // BUYER INFO
        forWho: forWhoRaw,
        buyerTag: buyerTag,
        isReserved: !!buyerTag,
        reservedFor: buyerTag || '',

        // META
        preorderId: preorder.id,
        addedFromPreorder: true,
        addedAt: new Date().toISOString(),
        arrivedDate: new Date().toLocaleDateString('ru-RU'),
        notes: buyerTag
          ? `Предзаказ для ${buyerTag}. Прибыло ${new Date().toLocaleDateString('ru-RU')}`
          : `Прибыло ${new Date().toLocaleDateString('ru-RU')}`,
      };

      // Sanitize to remove any undefined values that Firestore would reject
      const sanitizedProduct = sanitizeForFirestore(newProduct as unknown as Record<string, unknown>);
      console.log('Step 4 done. Sanitized product:', sanitizedProduct);

      // STEP 5: Save to catalog (products collection)
      console.log('Step 5: Saving to Firestore collection: products');
      const docRef = await addDoc(
        collection(db, 'products'),
        sanitizedProduct
      );
      console.log('✅ Step 5 done: Product added! ID:', docRef.id);

      // STEP 6: Update preorder with catalog reference
      console.log('Step 6: Updating preorder with catalogProductId...');
      await updateDoc(
        doc(db, 'preorders', preorder.id),
        {
          catalogProductId: docRef.id,
          addedToCatalog: true
        }
      );
      console.log('✅ Step 6 done: Preorder updated');

      // STEP 7: Show success modal
      setArrivedModal({
        show: true,
        preorder,
        buyerTag,
        productId: docRef.id,
        alreadyExists: false
      });

      console.log('=== handleArrived DONE ===');

    } catch (err: unknown) {
      console.error('❌ ERROR in handleArrived:', err);
      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      }
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('❌ Ошибка при добавлении в каталог:\n' + msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Удалить предзаказ?')) {
      await remove(id);
    }
  };

  const showToast = (message: string) => {
    const t = document.createElement('div');
    t.style.cssText = `
      position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(135deg, #10B981, #34D399);
      color: white; padding: 12px 24px; border-radius: 30px;
      font-size: 14px; font-weight: 700; z-index: 99999;
      box-shadow: 0 6px 24px rgba(16,185,129,0.45);
      white-space: nowrap; pointer-events: none;
    `;
    t.textContent = message;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, 2500);
  };

  const openSellModal = (preorder: Preorder) => {
    const forWhoRaw = preorder.forWho || '';
    let buyerName = forWhoRaw;
    if (forWhoRaw.includes('instagram.com/')) {
      const parts = forWhoRaw.split('instagram.com/');
      const username = parts[1]?.split('/')[0]?.split('?')[0] || '';
      buyerName = username ? `@${username}` : forWhoRaw;
    }

    setSellForm({
      customerName: buyerName,
      customerInstagram: forWhoRaw,
      price: String(preorder.retailPrice || ''),
      purchasePrice: String(preorder.purchasePrice || ''),
      paymentMethod: 'наличные',
      notes: `Продажа из предзаказа.${buyerName ? ` Покупатель: ${buyerName}` : ''}`,
      date: new Date().toISOString().split('T')[0]
    });

    setSellModal({ show: true, preorder });
  };

  const openCloneModal = (preorder: Preorder) => {
    setCloneForm({
      size: '',
      forWho: '',
      purchasePrice: String(preorder.purchasePrice || ''),
      sellingPrice: String(preorder.retailPrice || ''),
      notes: ''
    });
    setCloneModal({ show: true, preorder });
  };

  const handleClonePreorder = async () => {
    if (!cloneModal.preorder) return;
    if (!cloneForm.size) {
      alert('Укажи размер!');
      return;
    }
    if (!cloneForm.forWho) {
      alert('Укажи для кого!');
      return;
    }

    setCloneLoading(true);
    try {
      const original = cloneModal.preorder;

      const forWhoRaw = cloneForm.forWho || '';
      let buyerTag = forWhoRaw;
      if (forWhoRaw.includes('instagram.com/')) {
        const u = forWhoRaw.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (u) buyerTag = `@${u}`;
      }

      const newPreorder = {
        modelId: original.modelId || '',
        modelName: original.modelName || '',
        brand: original.modelName?.split(' ')[0] || '',
        image: original.image || '',
        supplier: original.supplier || '',
        sizeId: '',
        sizeEU: cloneForm.size,
        quantity: 1,
        purchasePrice: Number(cloneForm.purchasePrice || 0),
        retailPrice: Number(cloneForm.sellingPrice || 0),
        expectedDate: original.expectedDate || new Date().toISOString().split('T')[0],
        status: 'pending' as const,
        forWho: cloneForm.forWho,
        notes: cloneForm.notes || '',
        createdAt: new Date().toISOString(),
        isClone: true,
        originalPreorderId: original.id,
        originalName: original.modelName || '',
        clonedAt: new Date().toISOString()
      };

      const docRef = await addDoc(
        collection(db, 'preorders'),
        sanitizeForFirestore(newPreorder as unknown as Record<string, unknown>)
      );
      console.log('✅ Clone created:', docRef.id);

      const existingClones = Array.isArray(original.cloneIds)
        ? original.cloneIds
        : [];

      await updateDoc(
        doc(db, 'preorders', original.id),
        {
          cloneIds: [...existingClones, docRef.id],
          hasClones: true,
          clonesCount: existingClones.length + 1
        }
      );

      setCloneModal({ show: false, preorder: null });

      const t = document.createElement('div');
      t.style.cssText = `
        position:fixed;top:80px;left:50%;transform:translateX(-50%);
        background:linear-gradient(135deg,#6366F1,#8B5CF6);
        color:white;padding:12px 24px;border-radius:30px;
        font-size:14px;font-weight:700;z-index:99999;
        box-shadow:0 6px 24px rgba(99,102,241,0.45);
        white-space:nowrap;pointer-events:none;
      `;
      t.textContent = '✅ Доп. заказ EU ' + cloneForm.size + ' для ' + buyerTag + ' добавлен!';
      document.body.appendChild(t);
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.3s';
        setTimeout(() => t.remove(), 300);
      }, 3000);

    } catch (err: unknown) {
      console.error('ERROR:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Ошибка: ' + msg);
    } finally {
      setCloneLoading(false);
    }
  };

  const handleSellFromPreorder = async () => {
    if (!sellModal.preorder) return;
    if (!sellForm.price) {
      alert('Укажи цену продажи!');
      return;
    }

    setSellLoading(true);
    try {
      const preorder = sellModal.preorder;
      const salePrice = Number(sellForm.price);
      const purchasePrice = Number(sellForm.purchasePrice);
      const profit = salePrice - purchasePrice;

      const newSale = {
        productId: preorder.catalogProductId || preorder.id,
        productSku: `PRE-${preorder.id.slice(0, 6).toUpperCase()}`,
        productName: preorder.modelName || '',
        productImage: preorder.image || '',
        quantity: 1,
        price: salePrice,
        purchasePrice: purchasePrice,
        total: salePrice,
        profit: profit,
        date: sellForm.date,
        customer: sellForm.customerName,
        deliveryMethod: 'in_person',
        status: 'completed',
        comment: sellForm.notes,
        fromPreorder: true,
        preorderId: preorder.id,
        supplier: preorder.supplier || '',
        paymentMethod: sellForm.paymentMethod,
        createdAt: new Date().toISOString()
      };

      const saleRef = await addDoc(collection(db, 'sales'), newSale);
      console.log('✅ Sale created:', saleRef.id);

      await updateDoc(doc(db, 'preorders', preorder.id), {
        status: 'sold',
        soldAt: new Date().toISOString(),
        saleId: saleRef.id,
        soldPrice: salePrice,
        soldTo: sellForm.customerName
      });
      console.log('✅ Preorder updated to sold');

      setSellModal({ show: false, preorder: null });
      showToast(`✅ Продажа на ${salePrice} Br записана!`);
    } catch (err: unknown) {
      console.error('❌ Error creating sale:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Ошибка: ' + msg);
    } finally {
      setSellLoading(false);
    }
  };

  const handlePhotoClick = (preorder: Preorder) => {
    setPhotoTargetPreorder(preorder);
    photoInputRef.current?.click();
  };

  const handlePreorderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTargetPreorder) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;
        const preorderRef = doc(db, 'preorders', photoTargetPreorder.id);
        await updateDoc(preorderRef, {
          image: base64Image,
          updatedAt: new Date().toISOString(),
        });
        setPhotoTargetPreorder(null);
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Ошибка загрузки: ${msg}`);
    }

    // Reset file input so the same file can be re-selected
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Загрузка данных...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ padding: isMobileView ? '16px' : '24px' }}>
      {/* Hidden file input for photo uploads */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePreorderPhotoUpload}
      />

      {/* Header */}
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'14px',
        gap:'10px'
      }}>
        <h1 style={{
          margin:0,
          fontSize:'22px',
          fontWeight:'800',
          color:'#0F172A'
        }}>
          🛒 Предзаказы
        </h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding:'10px 14px',
            background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color:'white',
            border:'none',
            borderRadius:'12px',
            fontSize:'13px',
            fontWeight:'700',
            cursor:'pointer',
            whiteSpace:'nowrap',
            flexShrink:0,
            boxShadow:'0 4px 12px rgba(99,102,241,0.35)'
          }}
        >
          + Добавить
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobileView ? '1fr' : 'repeat(3,1fr)',
        gap:'10px',
        marginBottom:'16px'
      }}>
        {[
          {
            icon:'⏳',
            label:'Моделей',
            value:pending.length||0,
            color:'#F59E0B',
            bg:'#FFFBEB',
            border:'#FDE68A'
          },
          {
            icon:'📦',
            label:'Всего пар',
            value:totalPairs||0,
            color:'#6366F1',
            bg:'#EEF2FF',
            border:'#C7D2FE'
          },
          {
            icon:'💰',
            label:'Выручка',
            value:totalExpectedRevenue||0,
            color:'#10B981',
            bg:'#F0FDF4',
            border:'#A7F3D0',
            short:true
          }
        ].map(s=>(
          <div
            key={s.label}
            style={{
              backgroundColor:s.bg,
              border:`1.5px solid ${s.border}`,
              borderRadius:'14px',
              padding:'12px 8px',
              textAlign:'center'
            }}
          >
            <div style={{
              fontSize:'20px',
              marginBottom:'4px'
            }}>
              {s.icon}
            </div>
            <div style={{
              fontSize:s.short
                ? '13px' : '18px',
              fontWeight:'800',
              color:s.color,
              lineHeight:1,
              marginBottom:'3px'
            }}>
              {s.short
                ? `${s.value} Br`
                : s.value}
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

      {/* Status filter */}
      <div style={{
        display:'flex',
        gap:'6px',
        overflowX:'auto',
        paddingBottom:'4px',
        marginBottom:'14px',
        scrollbarWidth:'none'
      }}>
        {[
          {key:'all',label:'Все'},
          {key:'pending',label:'⏳ Ожидается'},
          {key:'arrived',label:'✅ Пришло'},
          {key:'sold',label:'💰 Продано'},
          {key:'cancelled',label:'❌ Отменён'}
        ].map(tab=>(
          <button
            key={tab.key}
            onClick={()=>
              setStatusFilter(tab.key as PreorderStatus | 'all')
            }
            style={{
              padding:'8px 14px',
              borderRadius:'20px',
              border:'none',
              backgroundColor:
                statusFilter===tab.key
                  ? '#6366F1'
                  : 'white',
              color:
                statusFilter===tab.key
                  ? 'white'
                  : '#64748B',
              fontSize:'12px',
              fontWeight:'600',
              cursor:'pointer',
              whiteSpace:'nowrap',
              flexShrink:0,
              boxShadow:
                statusFilter===tab.key
                  ? '0 4px 12px rgba(99,102,241,0.35)'
                  : '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid Cards */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px'
        }}>
          <div style={{ fontSize: '64px' }}>📋</div>
          <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#475569',
            marginTop: '16px'
          }}>
            {preorders.length === 0 ? 'Предзаказов нет' : 'Нет предзаказов с выбранным статусом'}
          </div>
          <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>
            {preorders.length === 0 ? 'Добавьте первый предзаказ!' : 'Попробуйте другой фильтр'}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          {[...filtered].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return 0;
          }).map((p) => {
            const isArrived = p.status === 'arrived';
            const isCancelled = p.status === 'cancelled';
            const isSold = p.status === 'sold';
            const isPending = !isArrived && !isCancelled && !isSold;
            const sizeDisplay = p.sizeEU || null;
            const mainImage = p.image || null;

            return (
            <div
              key={p.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: isPending
                  ? '0 4px 20px rgba(251,191,36,0.15)'
                  : (isArrived || isSold)
                  ? '0 4px 20px rgba(16,185,129,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
                border: isPending
                  ? '2px solid #FDE68A'
                  : (isArrived || isSold)
                  ? '2px solid #A7F3D0'
                  : '2px solid #FECACA',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* IMAGE AREA */}
              <div
                style={{
                  position: 'relative',
                  height: '190px',
                  backgroundColor: isPending
                    ? '#FFFBEB'
                    : (isArrived || isSold)
                    ? '#F0FDF4'
                    : '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden'
                }}
                onClick={() => handlePhotoClick(p)}
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={p.modelName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '52px' }}>👟</span>
                    <span style={{
                      fontSize: '12px',
                      color: '#94A3B8',
                      fontWeight: '600'
                    }}>
                      + Добавить фото
                    </span>
                  </div>
                )}

                {/* STATUS BADGE */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  backdropFilter: 'blur(8px)',
                  backgroundColor: isSold
                    ? 'rgba(16,185,129,0.92)'
                    : isPending
                    ? 'rgba(251,191,36,0.92)'
                    : isArrived
                    ? 'rgba(16,185,129,0.92)'
                    : 'rgba(239,68,68,0.85)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {isSold
                    ? '💰 Продано'
                    : isPending
                    ? '⏳ Ожидается'
                    : isArrived
                    ? '✅ Пришло'
                    : '❌ Отменён'}
                </div>

                {/* DATE */}
                {p.expectedDate && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255,255,255,0.92)',
                    borderRadius: '8px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748B',
                    backdropFilter: 'blur(8px)'
                  }}>
                    📅 {new Date(p.expectedDate).toLocaleDateString('ru-RU')}
                  </div>
                )}

                {/* SIZE BADGE — LARGE VISIBLE */}
                {sizeDisplay && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: '#1E293B',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '6px 14px',
                    fontSize: '16px',
                    fontWeight: '900',
                    letterSpacing: '0.5px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: '#94A3B8',
                      letterSpacing: '1px'
                    }}>
                      EU
                    </span>
                    {sizeDisplay}
                  </div>
                )}

                {/* Camera hint */}
                {mainImage && (
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    📷 Изменить
                  </div>
                )}

                {/* Bottom color strip */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  height: '3px',
                  background: isPending
                    ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                    : (isArrived || isSold)
                    ? 'linear-gradient(90deg, #10B981, #34D399)'
                    : 'linear-gradient(90deg, #EF4444, #FCA5A5)'
                }} />
              </div>

              {/* CARD BODY */}
              <div style={{ padding: '14px 16px' }}>
                {/* Model name */}
                <div style={{
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#0F172A',
                  marginBottom: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.2px'
                }}>
                  {p.modelName}
                </div>

                {/* Clone badges */}
                {p.hasClones && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#6366F1',
                    marginBottom: '6px'
                  }}>
                    +{p.clonesCount || 1} доп.
                  </div>
                )}
                {p.isClone && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    backgroundColor: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#7C3AED',
                    marginBottom: '6px'
                  }}>
                    🔗 Доп. заказ
                  </div>
                )}

                {/* Supplier row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <span style={{ fontSize: '13px' }}>🏪</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#475569',
                    backgroundColor: '#F1F5F9',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {p.supplier || 'Поставщик'}
                  </span>
                  {p.quantity > 1 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748B',
                      backgroundColor: '#F1F5F9',
                      padding: '2px 7px',
                      borderRadius: '6px'
                    }}>
                      {p.quantity} шт
                    </span>
                  )}
                </div>

                {/* BUYER / FOR WHO */}
                {p.forWho && (
                  <div style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'8px',
                    padding:'8px 12px',
                    backgroundColor:
                      p.status==='arrived'
                        ? '#EEF2FF'
                        : '#F8FAFC',
                    borderRadius:'10px',
                    border:'1px solid',
                    borderColor:
                      p.status==='arrived'
                        ? '#C7D2FE'
                        : '#E2E8F0',
                    marginBottom:'8px'
                  }}>
                    <span style={{fontSize:'16px'}}>
                      👤
                    </span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{
                        fontSize:'10px',
                        color:'#94A3B8',
                        fontWeight:'600',
                        marginBottom:'2px'
                      }}>
                        ДЛЯ КОГО
                      </div>
                      <a
                        href={
                          p.forWho.startsWith('http')
                            ? p.forWho
                            : `https://instagram.com/${p.forWho}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize:'13px',
                          fontWeight:'700',
                          color:'#6366F1',
                          textDecoration:'none'
                        }}
                      >
                        {(()=>{
                          const raw = p.forWho || '';
                          if(raw.includes('instagram.com/')){
                            const u = raw
                              .split('instagram.com/')[1]
                              ?.split('/')[0]
                              ?.split('?')[0];
                            return u ? `@${u}` : raw;
                          }
                          return raw;
                        })()}
                      </a>
                    </div>
                    <span style={{
                      fontSize:'14px',
                      color:'#94A3B8'
                    }}>
                      📸
                    </span>
                  </div>
                )}

                {/* Notes */}
                {p.notes && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '13px' }}>📝</span>
                    <span style={{
                      fontSize: '12px',
                      color: '#6366F1',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      {p.notes}
                    </span>
                  </div>
                )}

                {/* PRICE CARDS */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  <div style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid #E2E8F0'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#1E293B'
                    }}>
                      {p.purchasePrice ? p.purchasePrice.toLocaleString('ru-RU') : '—'} Br
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      fontWeight: '700',
                      marginTop: '2px',
                      letterSpacing: '0.5px'
                    }}>
                      ЗАКУПКА
                    </div>
                  </div>
                  <div style={{
                    backgroundColor: '#F0FDF4',
                    borderRadius: '10px',
                    padding: '10px',
                    textAlign: 'center',
                    border: '1px solid #A7F3D0'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '800',
                      color: '#10B981'
                    }}>
                      {p.retailPrice ? p.retailPrice.toLocaleString('ru-RU') : '—'} Br
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#94A3B8',
                      fontWeight: '700',
                      marginTop: '2px',
                      letterSpacing: '0.5px'
                    }}>
                      ПРОДАЖА
                    </div>
                  </div>
                </div>

                {/* PROFIT PILL */}
                {p.retailPrice > 0 && p.purchasePrice > 0 && (
                  <div style={{
                    backgroundColor: '#EEF2FF',
                    border: '1px solid #C7D2FE',
                    borderRadius: '10px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6366F1',
                      fontWeight: '600'
                    }}>
                      💰 Потенциал
                    </span>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      color: '#4F46E5'
                    }}>
                      +{(p.retailPrice - p.purchasePrice).toFixed(0)} Br
                    </span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginTop: '10px'
                }}>
                  {!isSold && (
                    <button
                      onClick={() => openSellModal(p)}
                      style={{
                        flex: 1,
                        minWidth: '100px',
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg,#10B981,#34D399)',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.45)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
                      }}
                    >
                      💰 Продать
                    </button>
                  )}
                  {isPending && (
                    <button
                      onClick={() => handleArrived(p)}
                      style={{
                        flex: 1,
                        minWidth: '90px',
                        padding: '10px 8px',
                        border: 'none',
                        borderRadius: '12px',
                        backgroundColor: '#D1FAE5',
                        color: '#065F46',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s'
                      }}
                    >
                      ✅ Пришло
                    </button>
                  )}
                  <button
                    onClick={() => openCloneModal(p)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '12px',
                      border: '1.5px solid #C7D2FE',
                      backgroundColor: '#EEF2FF',
                      color: '#6366F1',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                      whiteSpace: 'nowrap' as const
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#6366F1';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.borderColor = '#6366F1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#EEF2FF';
                      e.currentTarget.style.color = '#6366F1';
                      e.currentTarget.style.borderColor = '#C7D2FE';
                    }}
                  >
                    ➕ Заказ
                  </button>
                  <button
                    onClick={() => setEditPreorder(p)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    style={{
                      width: '38px',
                      height: '38px',
                      border: 'none',
                      borderRadius: '10px',
                      backgroundColor: '#FEF2F2',
                      color: '#EF4444',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}

      {showForm && (
        <PreorderForm
          title="Добавить предзаказ"
          initial={emptyPreorder}
          onSave={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editPreorder && (
        <PreorderForm
          title="Редактировать предзаказ"
          initial={editPreorder}
          onSave={handleEdit}
          onCancel={() => setEditPreorder(null)}
        />
      )}

      {/* ARRIVED MODAL */}
      {arrivedModal.show && (
        <div
          onClick={()=> setArrivedModal({show:false, preorder:null, buyerTag:'', productId:null, alreadyExists:false})}
          style={{
            position:'fixed',
            top:0,left:0,
            right:0,bottom:0,
            backgroundColor:'rgba(15,23,42,0.6)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            zIndex:9999,
            padding:'20px',
            backdropFilter:'blur(4px)'
          }}
        >
          <div
            onClick={e=>e.stopPropagation()}
            style={{
              backgroundColor:'white',
              borderRadius:'28px',
              padding:'28px 24px',
              maxWidth:'400px',
              width:'100%',
              boxShadow:'0 24px 64px rgba(0,0,0,0.3)',
              position:'relative',
              overflow:'hidden'
            }}
          >
            {/* BG DECORATION */}
            <div style={{
              position:'absolute',
              top:'-40px',
              right:'-40px',
              width:'160px',
              height:'160px',
              borderRadius:'50%',
              background:
                arrivedModal.alreadyExists
                  ? 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(252,211,77,0.1))'
                  : 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(52,211,153,0.1))',
              pointerEvents:'none'
            }}/>

            {/* CLOSE BUTTON */}
            <button
              onClick={()=> setArrivedModal({show:false, preorder:null, buyerTag:'', productId:null, alreadyExists:false})}
              style={{
                position:'absolute',
                top:'16px',
                right:'16px',
                width:'32px',
                height:'32px',
                borderRadius:'50%',
                border:'none',
                backgroundColor:'#F1F5F9',
                cursor:'pointer',
                fontSize:'16px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:'#64748B'
              }}
            >
              ×
            </button>

            {/* ICON */}
            <div style={{
              width:'80px',
              height:'80px',
              borderRadius:'50%',
              background:
                arrivedModal.alreadyExists
                  ? 'linear-gradient(135deg,#F59E0B,#FCD34D)'
                  : 'linear-gradient(135deg,#10B981,#34D399)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:'36px',
              margin:'0 auto 20px',
              boxShadow:
                arrivedModal.alreadyExists
                  ? '0 8px 24px rgba(245,158,11,0.4)'
                  : '0 8px 24px rgba(16,185,129,0.4)'
            }}>
              {arrivedModal.alreadyExists ? '⚠️' : '✅'}
            </div>

            {/* TITLE */}
            <h2 style={{
              textAlign:'center',
              margin:'0 0 8px',
              fontSize:'22px',
              fontWeight:'800',
              color:'#0F172A'
            }}>
              {arrivedModal.alreadyExists
                ? 'Уже в каталоге!'
                : '🎉 Добавлено в каталог!'}
            </h2>

            <p style={{
              textAlign:'center',
              margin:'0 0 24px',
              fontSize:'14px',
              color:'#64748B',
              lineHeight:'1.5'
            }}>
              {arrivedModal.alreadyExists
                ? 'Этот предзаказ уже был добавлен в каталог ранее'
                : 'Предзаказ отмечен как прибывший и товар добавлен в каталог'}
            </p>

            {/* PRODUCT CARD */}
            <div style={{
              backgroundColor:'#F8FAFC',
              borderRadius:'16px',
              padding:'16px',
              marginBottom:'16px',
              border:'1px solid #F1F5F9'
            }}>
              {/* Name */}
              <div style={{
                fontSize:'16px',
                fontWeight:'700',
                color:'#1E293B',
                marginBottom:'14px',
                textAlign:'center'
              }}>
                {arrivedModal.preorder?.modelName || 'Товар'}
              </div>

              {/* BUYER TAG */}
              {arrivedModal.buyerTag && (
                <div style={{
                  display:'flex',
                  alignItems:'center',
                  gap:'10px',
                  padding:'12px 14px',
                  backgroundColor:'#EEF2FF',
                  borderRadius:'12px',
                  border:'1.5px solid #C7D2FE',
                  marginBottom:'10px'
                }}>
                  <div style={{
                    width:'36px',
                    height:'36px',
                    borderRadius:'10px',
                    background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    fontSize:'18px',
                    flexShrink:0
                  }}>
                    👤
                  </div>
                  <div>
                    <div style={{
                      fontSize:'10px',
                      color:'#94A3B8',
                      fontWeight:'700',
                      letterSpacing:'0.5px',
                      marginBottom:'3px'
                    }}>
                      ЗАРЕЗЕРВИРОВАНО ДЛЯ
                    </div>
                    <div style={{
                      fontSize:'16px',
                      fontWeight:'800',
                      color:'#6366F1'
                    }}>
                      {arrivedModal.buyerTag}
                    </div>
                  </div>
                </div>
              )}

              {/* INSTAGRAM LINK */}
              {arrivedModal.preorder?.forWho && (
                <a
                  href={
                    arrivedModal.preorder.forWho.startsWith('http')
                      ? arrivedModal.preorder.forWho
                      : `https://instagram.com/${arrivedModal.preorder.forWho}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:'8px',
                    padding:'10px 14px',
                    backgroundColor:'white',
                    borderRadius:'10px',
                    border:'1px solid #E2E8F0',
                    textDecoration:'none',
                    color:'#E1306C',
                    fontSize:'13px',
                    fontWeight:'600',
                    marginBottom:'12px',
                    transition:'all 0.15s'
                  }}
                >
                  <span style={{fontSize:'20px'}}>📸</span>
                  Открыть Instagram покупателя
                  <span style={{marginLeft:'auto',fontSize:'16px'}}>→</span>
                </a>
              )}

              {/* PRICES */}
              <div style={{
                display:'grid',
                gridTemplateColumns:'1fr 1fr',
                gap:'8px'
              }}>
                <div style={{
                  padding:'10px',
                  backgroundColor:'white',
                  borderRadius:'10px',
                  border:'1px solid #E2E8F0',
                  textAlign:'center'
                }}>
                  <div style={{
                    fontSize:'10px',
                    color:'#94A3B8',
                    fontWeight:'700',
                    letterSpacing:'0.5px',
                    marginBottom:'4px'
                  }}>
                    ЗАКУПКА
                  </div>
                  <div style={{
                    fontSize:'16px',
                    fontWeight:'800',
                    color:'#374151'
                  }}>
                    {Number(arrivedModal.preorder?.purchasePrice || 0)} Br
                  </div>
                </div>
                <div style={{
                  padding:'10px',
                  backgroundColor:'white',
                  borderRadius:'10px',
                  border:'1px solid #E2E8F0',
                  textAlign:'center'
                }}>
                  <div style={{
                    fontSize:'10px',
                    color:'#94A3B8',
                    fontWeight:'700',
                    letterSpacing:'0.5px',
                    marginBottom:'4px'
                  }}>
                    ПРОДАЖА
                  </div>
                  <div style={{
                    fontSize:'16px',
                    fontWeight:'800',
                    color:'#10B981'
                  }}>
                    {Number(arrivedModal.preorder?.retailPrice || 0)} Br
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{
              display:'flex',
              gap:'10px'
            }}>
              <button
                onClick={()=> setArrivedModal({show:false, preorder:null, buyerTag:'', productId:null, alreadyExists:false})}
                style={{
                  flex:1,
                  padding:'12px',
                  borderRadius:'14px',
                  border:'1.5px solid #E2E8F0',
                  backgroundColor:'white',
                  color:'#64748B',
                  fontSize:'14px',
                  fontWeight:'600',
                  cursor:'pointer'
                }}
              >
                Закрыть
              </button>
              <button
                onClick={()=>{
                  setArrivedModal({show:false, preorder:null, buyerTag:'', productId:null, alreadyExists:false});
                  if (onNavigate) onNavigate('catalog');
                }}
                style={{
                  flex:2,
                  padding:'12px',
                  borderRadius:'14px',
                  border:'none',
                  background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  color:'white',
                  fontSize:'14px',
                  fontWeight:'700',
                  cursor:'pointer',
                  boxShadow:'0 4px 14px rgba(99,102,241,0.4)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  gap:'6px'
                }}
              >
                👟 Открыть каталог
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SELL MODAL */}
      {sellModal.show && sellModal.preorder && (
        <div
          onClick={() => setSellModal({ show: false, preorder: null })}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '28px',
              width: '100%', maxWidth: '460px', maxHeight: '90vh',
              overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            {/* HEADER */}
            <div style={{
              background: 'linear-gradient(135deg,#10B981,#34D399)',
              borderRadius: '28px 28px 0 0', padding: '24px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '100px', height: '100px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}/>
              <button
                onClick={() => setSellModal({ show: false, preorder: null })}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: 'none', backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white', cursor: 'pointer', fontSize: '18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                ×
              </button>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
              <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: '800', color: 'white' }}>
                Записать продажу
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                {sellModal.preorder.modelName || 'Товар'}
              </p>
            </div>

            {/* BODY */}
            <div style={{ padding: '24px' }}>

              {/* PRODUCT INFO */}
              <div style={{
                display: 'flex', gap: '12px', padding: '14px',
                backgroundColor: '#F8FAFC', borderRadius: '16px',
                marginBottom: '20px', border: '1px solid #F1F5F9'
              }}>
                {sellModal.preorder.image && (
                  <img
                    src={sellModal.preorder.image}
                    alt=""
                    style={{
                      width: '60px', height: '60px', borderRadius: '10px',
                      objectFit: 'cover', flexShrink: 0
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: '700', color: '#1E293B',
                    marginBottom: '4px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {sellModal.preorder.modelName || 'Товар'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', gap: '8px' }}>
                    {sellModal.preorder.sizeEU && <span>EU {sellModal.preorder.sizeEU}</span>}
                    {sellModal.preorder.supplier && <span>{sellModal.preorder.supplier}</span>}
                  </div>
                </div>
              </div>

              {/* CUSTOMER NAME */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '700',
                  color: '#374151', marginBottom: '6px', letterSpacing: '0.3px'
                }}>
                  👤 ПОКУПАТЕЛЬ
                </label>
                <input
                  type="text"
                  value={sellForm.customerName}
                  onChange={e => setSellForm(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Имя или @instagram"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #E2E8F0', borderRadius: '12px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* INSTAGRAM LINK */}
              {sellModal.preorder.forWho && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{
                    display: 'block', fontSize: '12px', fontWeight: '700',
                    color: '#374151', marginBottom: '6px'
                  }}>
                    📸 INSTAGRAM ПОКУПАТЕЛЯ
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 14px', backgroundColor: '#FFF0F5',
                    borderRadius: '12px', border: '1px solid #FBCFE8'
                  }}>
                    <span style={{ fontSize: '16px' }}>📸</span>
                    <a
                      href={
                        sellModal.preorder.forWho.startsWith('http')
                          ? sellModal.preorder.forWho
                          : `https://instagram.com/${sellModal.preorder.forWho}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '13px', color: '#E1306C', fontWeight: '600',
                        textDecoration: 'none', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1
                      }}
                    >
                      {sellForm.customerName || sellModal.preorder.forWho}
                    </a>
                  </div>
                </div>
              )}

              {/* PRICES ROW */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '12px', marginBottom: '14px'
              }}>
                <div>
                  <label style={{
                    display: 'block', fontSize: '12px', fontWeight: '700',
                    color: '#374151', marginBottom: '6px'
                  }}>
                    💰 ЦЕНА ПРОДАЖИ (Br)
                  </label>
                  <input
                    type="number"
                    value={sellForm.price}
                    onChange={e => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1.5px solid #A7F3D0', borderRadius: '12px',
                      fontSize: '16px', fontWeight: '700', color: '#10B981',
                      outline: 'none', boxSizing: 'border-box', backgroundColor: '#F0FDF4'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block', fontSize: '12px', fontWeight: '700',
                    color: '#374151', marginBottom: '6px'
                  }}>
                    🏷️ ЗАКУПКА (Br)
                  </label>
                  <input
                    type="number"
                    value={sellForm.purchasePrice}
                    onChange={e => setSellForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '11px 14px',
                      border: '1.5px solid #E2E8F0', borderRadius: '12px',
                      fontSize: '16px', fontWeight: '700', color: '#374151',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* PROFIT PREVIEW */}
              {sellForm.price && sellForm.purchasePrice && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: (Number(sellForm.price) - Number(sellForm.purchasePrice)) >= 0 ? '#F0FDF4' : '#FEF2F2',
                  borderRadius: '12px',
                  border: '1.5px solid',
                  borderColor: (Number(sellForm.price) - Number(sellForm.purchasePrice)) >= 0 ? '#A7F3D0' : '#FECACA',
                  marginBottom: '14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                    🔥 Прибыль с продажи:
                  </span>
                  <span style={{
                    fontSize: '18px', fontWeight: '800',
                    color: (Number(sellForm.price) - Number(sellForm.purchasePrice)) >= 0 ? '#10B981' : '#EF4444'
                  }}>
                    {(Number(sellForm.price) - Number(sellForm.purchasePrice)) >= 0 ? '+' : ''}
                    {Number(sellForm.price) - Number(sellForm.purchasePrice)} Br
                  </span>
                </div>
              )}

              {/* PAYMENT METHOD */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '700',
                  color: '#374151', marginBottom: '6px'
                }}>
                  💳 СПОСОБ ОПЛАТЫ
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { key: 'наличные', icon: '💵', label: 'Наличные' },
                    { key: 'перевод', icon: '📱', label: 'Перевод' },
                    { key: 'карта', icon: '💳', label: 'Карта' }
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setSellForm(prev => ({ ...prev, paymentMethod: m.key }))}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: '10px',
                        border: '1.5px solid',
                        borderColor: sellForm.paymentMethod === m.key ? '#10B981' : '#E2E8F0',
                        backgroundColor: sellForm.paymentMethod === m.key ? '#F0FDF4' : 'white',
                        cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                        color: sellForm.paymentMethod === m.key ? '#10B981' : '#64748B',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '3px', transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DATE */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '700',
                  color: '#374151', marginBottom: '6px'
                }}>
                  📅 ДАТА ПРОДАЖИ
                </label>
                <input
                  type="date"
                  value={sellForm.date}
                  onChange={e => setSellForm(prev => ({ ...prev, date: e.target.value }))}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #E2E8F0', borderRadius: '12px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* NOTES */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '700',
                  color: '#374151', marginBottom: '6px'
                }}>
                  📝 ЗАМЕТКА
                </label>
                <textarea
                  value={sellForm.notes}
                  onChange={e => setSellForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Дополнительная информация..."
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #E2E8F0', borderRadius: '12px',
                    fontSize: '14px', outline: 'none', resize: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setSellModal({ show: false, preorder: null })}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '14px',
                    border: '1.5px solid #E2E8F0', backgroundColor: 'white',
                    color: '#64748B', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleSellFromPreorder}
                  disabled={sellLoading}
                  style={{
                    flex: 2, padding: '13px', borderRadius: '14px', border: 'none',
                    background: sellLoading ? '#E2E8F0' : 'linear-gradient(135deg,#10B981,#34D399)',
                    color: sellLoading ? '#94A3B8' : 'white',
                    fontSize: '15px', fontWeight: '800',
                    cursor: sellLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: sellLoading ? 'none' : '0 4px 14px rgba(16,185,129,0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  {sellLoading ? '⏳ Сохраняем...' : '💰 Записать продажу'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CLONE PREORDER MODAL */}
      {cloneModal.show && cloneModal.preorder && (
        <div
          onClick={() => setCloneModal({ show: false, preorder: null })}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
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
              maxWidth: '460px',
              maxHeight: '92vh',
              overflowY: 'auto' as const,
              boxShadow: '0 24px 64px rgba(0,0,0,0.3)'
            }}
          >
            {/* HEADER */}
            <div style={{
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              borderRadius: '28px 28px 0 0',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px', right: '-30px',
                width: '120px', height: '120px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.08)',
                pointerEvents: 'none' as const
              }} />

              <button
                onClick={() => setCloneModal({ show: false, preorder: null })}
                style={{
                  position: 'absolute',
                  top: '16px', right: '16px',
                  width: '32px', height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >×</button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  width: '60px', height: '60px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {cloneModal.preorder.image ? (
                    <img
                      src={cloneModal.preorder.image}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                    />
                  ) : (
                    <span style={{ fontSize: '26px' }}>👟</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: '600',
                    marginBottom: '4px',
                    letterSpacing: '0.5px'
                  }}>
                    ➕ ДОПОЛНИТЕЛЬНЫЙ ЗАКАЗ
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const
                  }}>
                    {cloneModal.preorder.modelName || 'Модель'}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    marginTop: '2px'
                  }}>
                    Оригинал: EU {cloneModal.preorder.sizeEU || '?'}
                  </div>
                </div>
              </div>
            </div>

            {/* BODY */}
            <div style={{ padding: '20px 24px 24px' }}>

              {/* SIZE INPUT */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '8px',
                  letterSpacing: '0.3px'
                }}>
                  📏 НОВЫЙ РАЗМЕР *
                </label>

                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap' as const,
                  marginBottom: '10px'
                }}>
                  {['36','37','38','39','40','41','42','43','44','45','46','47'].map(s => (
                    <button
                      key={s}
                      onClick={() => setCloneForm(prev => ({ ...prev, size: s }))}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid',
                        borderColor: cloneForm.size === s ? '#6366F1' : '#E2E8F0',
                        backgroundColor: cloneForm.size === s ? '#EEF2FF' : 'white',
                        color: cloneForm.size === s ? '#6366F1' : '#64748B',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={cloneForm.size}
                  onChange={e => setCloneForm(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Или введи вручную: 42.5"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366F1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* FOR WHO */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '6px',
                  letterSpacing: '0.3px'
                }}>
                  👤 ДЛЯ КОГО * (Instagram ссылка)
                </label>
                <input
                  type="text"
                  value={cloneForm.forWho}
                  onChange={e => setCloneForm(prev => ({ ...prev, forWho: e.target.value }))}
                  placeholder="https://instagram.com/username"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box' as const,
                    fontFamily: 'inherit',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#E1306C';
                    e.target.style.boxShadow = '0 0 0 3px rgba(225,48,108,0.08)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {cloneForm.forWho.includes('instagram.com/') && (
                  <div style={{
                    marginTop: '6px',
                    padding: '6px 10px',
                    backgroundColor: '#EEF2FF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#6366F1',
                    fontWeight: '600'
                  }}>
                    👤 {(() => {
                      const u = cloneForm.forWho.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
                      return u ? `@${u}` : cloneForm.forWho;
                    })()}
                  </div>
                )}
              </div>

              {/* PRICES */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '14px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    🏷️ ЗАКУПКА (Br)
                  </label>
                  <input
                    type="number"
                    value={cloneForm.purchasePrice}
                    onChange={e => setCloneForm(prev => ({ ...prev, purchasePrice: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#374151',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '6px'
                  }}>
                    💰 ПРОДАЖА (Br)
                  </label>
                  <input
                    type="number"
                    value={cloneForm.sellingPrice}
                    onChange={e => setCloneForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      border: '1.5px solid #A7F3D0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#10B981',
                      outline: 'none',
                      boxSizing: 'border-box' as const,
                      backgroundColor: '#F0FDF4',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* PROFIT PREVIEW */}
              {cloneForm.sellingPrice && cloneForm.purchasePrice && (() => {
                const profit = Number(cloneForm.sellingPrice) - Number(cloneForm.purchasePrice);
                return (
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: profit >= 0 ? '#F0FDF4' : '#FEF2F2',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: profit >= 0 ? '#A7F3D0' : '#FECACA',
                    marginBottom: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      color: '#64748B',
                      fontWeight: '600'
                    }}>
                      🔥 Потенциал:
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: '900',
                      color: profit >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {profit >= 0 ? '+' : ''}{profit} Br
                    </span>
                  </div>
                );
              })()}

              {/* NOTES */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  📝 ЗАМЕТКА
                </label>
                <textarea
                  value={cloneForm.notes}
                  onChange={e => setCloneForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Дополнительная информация..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none' as const,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box' as const
                  }}
                />
              </div>

              {/* BUTTONS */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setCloneModal({ show: false, preorder: null })}
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
                  onClick={handleClonePreorder}
                  disabled={cloneLoading}
                  style={{
                    flex: 2,
                    padding: '13px',
                    borderRadius: '14px',
                    border: 'none',
                    background: cloneLoading ? '#E2E8F0' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                    color: cloneLoading ? '#94A3B8' : 'white',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: cloneLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: cloneLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s'
                  }}
                >
                  {cloneLoading ? '⏳ Добавляем...' : '➕ Добавить заказ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preorders;
