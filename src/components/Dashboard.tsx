import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useViewMode } from '../contexts/ViewModeContext';
import { Product, Sale, Expense } from '../types';
import { safeDate, safeNumber } from '../utils/helpers';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

type Period = 'week' | 'month' | 'year' | 'all';

const getStartDate = (period: Period): Date | null => {
  const now = new Date();
  switch (period) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return d;
    }
    case 'year': {
      const d = new Date(now.getFullYear(), 0, 1);
      return d;
    }
    case 'all':
      return null;
  }
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { isMobileView } = useViewMode();
  const { data: products, loading: loadingProducts, error: errorProducts } = useFirestore<Product>('products');
  const { data: sales, loading: loadingSales, error: errorSales } = useFirestore<Sale>('sales');
  const { data: expenses, loading: loadingExpenses, error: errorExpenses } = useFirestore<Expense>('expenses');
  const [period, setPeriod] = useState<Period>('month');

  // Cash balance from Firestore
  const [dashCashAmount, setDashCashAmount] = useState(0);
  const [dashCardAmount, setDashCardAmount] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'cash_balance', 'main'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setDashCashAmount(safeNumber(d.cashAmount));
        setDashCardAmount(safeNumber(d.cardAmount));
      }
    });
    return () => unsub();
  }, []);

  if (loadingProducts || loadingSales || loadingExpenses) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse space-y-4 w-full" style={{maxWidth:'800px',padding:'24px'}}>
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

  const anyError = errorProducts || errorSales || errorExpenses;

  const navigate = (tab: string) => {
    if (onNavigate) onNavigate(tab);
  };

  // Period-based filtering
  const startDate = getStartDate(period);

  const monthSalesData = sales.filter(s => {
    const d = safeDate(s.sale_date || s.date || s.created_at);
    if (!d) return false;
    if (startDate) {
      const saleDate = new Date(d);
      if (saleDate < startDate) return false;
    }
    // Exclude cancelled/returned sales
    const isCancelled =
      s.status === 'cancelled' ||
      (s.status as string) === 'отменена' ||
      (s.status as string) === 'возврат' ||
      (s as any).cancelled === true ||
      !!s.cancelledAt;
    if (isCancelled) return false;
    // Only include completed sales (default to completed if no status)
    const st = (s.status ?? 'completed').toLowerCase();
    return st === 'completed' || st === 'завершена';
  });

  const monthlyExpenses = expenses.filter(exp => {
    const d = safeDate(exp.date || exp.created_at);
    if (!d) return false;
    if (startDate) {
      const expDate = new Date(d);
      if (expDate < startDate) return false;
    }
    return true;
  });

  const adExpenses = monthlyExpenses
    .filter(e => e.type === 'advertising')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const deliveryExpenses = monthlyExpenses
    .filter(e => e.type === 'delivery')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const otherExpenses = monthlyExpenses
    .filter(e => e.type !== 'advertising' && e.type !== 'delivery')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthRevenue = monthSalesData.reduce((s, e) => s + Number(e.total || 0), 0);
  const monthExpenses = adExpenses + deliveryExpenses + otherExpenses;
  const grossProfit = monthSalesData.reduce((sum, sale) => {
    const price = Number(sale.price) || 0;
    const purchase = Number(sale.purchase_price ?? sale.purchasePrice ?? 0);
    return sum + (price - purchase);
  }, 0);
  const netProfit = grossProfit - monthExpenses;
  const totalProducts = products.reduce((s, p) => s + Number(p.quantity || 0), 0);

  const recentSales = [...sales]
    .sort((a, b) => {
      const da = new Date(safeDate(a.date) || 0);
      const db = new Date(safeDate(b.date) || 0);
      return db.getTime() - da.getTime();
    })
    .slice(0, 10);

  // Chart data: last 7 days
  const chartData = (() => {
    const days: { date: string; revenue: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      const dayRevenue = sales
        .filter(s => {
          const sd = safeDate(s.sale_date || s.date || s.created_at);
          if (!sd) return false;
          const isCancelled =
            s.status === 'cancelled' ||
            (s.status as string) === 'отменена' ||
            (s.status as string) === 'возврат' ||
            (s as any).cancelled === true ||
            !!s.cancelledAt;
          if (isCancelled) return false;
          const cst = (s.status ?? 'completed').toLowerCase();
          if (cst !== 'completed' && cst !== 'завершена') return false;
          return sd.slice(0, 10) === key;
        })
        .reduce((sum, s) => sum + Number(s.total || 0), 0);
      days.push({ date: label, revenue: dayRevenue });
    }
    return days;
  })();

  // Low stock alerts
  const lowStockItems = products.filter(p => (Number(p.quantity) || 0) < 2);

  const periodLabels: Record<Period, string> = {
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
    all: 'Всё время'
  };

  return (
    <div style={{
      maxWidth: isMobileView ? '100%' : '1400px',
      margin: '0 auto',
      padding: isMobileView ? '16px' : '24px',
      width: '100%',
      boxSizing: 'border-box' as const,
      overflowX: 'hidden' as const
    }}>

      {/* ERROR BANNER */}
      {anyError && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <span>⚠️</span>
          <span>Ошибка загрузки данных: {errorProducts || errorSales || errorExpenses}</span>
        </div>
      )}

      {/* WELCOME BANNER */}
      <div style={{
        background: 'linear-gradient(135deg,#6366F1 0%,#8B5CF6 50%,#A78BFA 100%)',
        borderRadius: '24px',
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(99,102,241,0.35)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '120px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.07)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40px',
          right: '20px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            fontSize: '22px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '6px',
            letterSpacing: '-0.3px'
          }}>
            {new Date().getHours() < 12
              ? '☀️ Доброе утро'
              : new Date().getHours() < 18
              ? '🌤️ Добрый день'
              : '🌙 Добрый вечер'},
            HQF Sneakers!
          </div>
          <div style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.75)'
          }}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobileView ? '1fr 1fr' : 'repeat(4, auto)',
          gap: '8px',
          marginTop: isMobileView ? '16px' : '0',
          position: 'relative',
          zIndex: 1,
          width: isMobileView ? '100%' : 'auto'
        }}>
          {[
            { label: '+ Продажа', tab: 'sales' },
            { label: '+ Предзаказ', tab: 'preorders' },
            { label: '+ Расход', tab: 'expenses' },
            { label: '+ Товар', tab: 'catalog' }
          ].map(btn => (
            <button
              key={btn.label}
              onClick={() => navigate(btn.tab)}
              style={{
                padding: isMobileView ? '10px 8px' : '9px 16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.15s',
                width: '100%',
                textAlign: 'center'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* PERIOD FILTER */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {(['week', 'month', 'year', 'all'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              border: period === p ? '2px solid #6366F1' : '2px solid #E2E8F0',
              backgroundColor: period === p ? '#EEF2FF' : 'white',
              color: period === p ? '#6366F1' : '#64748B',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* STAT CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobileView ? '1fr 1fr' : 'repeat(4,1fr)',
        gap: isMobileView ? '10px' : '16px',
        marginBottom: isMobileView ? '16px' : '24px',
        width: '100%'
      }}>
        {[
          {
            label: 'Товаров на складе',
            value: `${totalProducts || 0}`,
            unit: 'шт.',
            icon: '👟',
            gradient: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            glow: 'rgba(99,102,241,0.25)',
            lightBg: '#EEF2FF'
          },
          {
            label: 'Выручка за период',
            value: `${monthRevenue || 0}`,
            unit: 'Br',
            icon: '💰',
            gradient: 'linear-gradient(135deg,#10B981,#34D399)',
            glow: 'rgba(16,185,129,0.25)',
            lightBg: '#F0FDF4'
          },
          {
            label: 'Расходы за период',
            value: `${monthExpenses || 0}`,
            unit: 'Br',
            icon: '📉',
            gradient: 'linear-gradient(135deg,#F59E0B,#FCD34D)',
            glow: 'rgba(245,158,11,0.25)',
            lightBg: '#FFFBEB'
          },
          {
            label: 'Чистая прибыль',
            value: `${netProfit || 0}`,
            unit: 'Br',
            icon: (netProfit || 0) >= 0 ? '🏆' : '⚠️',
            gradient: (netProfit || 0) >= 0
              ? 'linear-gradient(135deg,#10B981,#34D399)'
              : 'linear-gradient(135deg,#EF4444,#FCA5A5)',
            glow: (netProfit || 0) >= 0
              ? 'rgba(16,185,129,0.25)'
              : 'rgba(239,68,68,0.25)',
            lightBg: (netProfit || 0) >= 0 ? '#F0FDF4' : '#FEF2F2'
          }
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'white',
              borderRadius: isMobileView ? '16px' : '20px',
              padding: isMobileView ? '14px' : '22px',
              display: 'flex',
              flexDirection: isMobileView ? 'column' : 'row',
              alignItems: isMobileView ? 'flex-start' : 'center',
              gap: isMobileView ? '10px' : '16px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              border: '1px solid #F1F5F9',
              width: '100%',
              overflow: 'hidden',
              minWidth: 0,
              transition: 'all 0.2s ease',
              cursor: 'default'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 14px 36px ${stat.glow}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
            }}
          >
            <div style={{
              width: isMobileView ? '44px' : '58px',
              height: isMobileView ? '44px' : '58px',
              borderRadius: isMobileView ? '13px' : '16px',
              background: stat.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isMobileView ? '22px' : '26px',
              flexShrink: 0,
              boxShadow: `0 4px 12px ${stat.glow}`
            }}>
              {stat.icon}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: isMobileView ? '11px' : '12px',
                color: '#94A3B8',
                fontWeight: '500',
                marginBottom: isMobileView ? '4px' : '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: isMobileView ? '20px' : '28px',
                fontWeight: '800',
                color: '#0F172A',
                letterSpacing: '-0.5px',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {stat.value}
                <span style={{
                  fontSize: isMobileView ? '12px' : '13px',
                  fontWeight: '600',
                  color: '#94A3B8',
                  marginLeft: isMobileView ? '3px' : '4px'
                }}>
                  {stat.unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CASH WIDGET */}
      <div
        onClick={() => navigate('cash')}
        style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: isMobileView ? '16px' : '22px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '1px solid #F1F5F9',
          marginBottom: isMobileView ? '16px' : '24px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 14px 36px rgba(99,102,241,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#94A3B8', marginBottom: '12px' }}>
          💰 Касса
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobileView ? '16px' : '24px',
          flexWrap: 'wrap'
        }}>
          <div>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>💵 </span>
            <span style={{ fontSize: isMobileView ? '18px' : '22px', fontWeight: '800', color: '#10B981' }}>
              {dashCashAmount.toLocaleString('ru-RU')} Br
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '4px' }}>нал</span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>💳 </span>
            <span style={{ fontSize: isMobileView ? '18px' : '22px', fontWeight: '800', color: '#6366F1' }}>
              {dashCardAmount.toLocaleString('ru-RU')} Br
            </span>
            <span style={{ fontSize: '12px', color: '#94A3B8', marginLeft: '4px' }}>карта</span>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Итого: </span>
            <span style={{ fontSize: isMobileView ? '18px' : '22px', fontWeight: '900', color: '#0F172A' }}>
              {(dashCashAmount + dashCardAmount).toLocaleString('ru-RU')} Br
            </span>
          </div>
        </div>
      </div>

      {/* SALES CHART — Last 7 days */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #F1F5F9',
        marginBottom: '20px'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '17px',
          fontWeight: '800',
          color: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📈 Выручка за последние 7 дней
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              formatter={(value) => `${value} Br`}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#6366F1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* LOW STOCK ALERTS */}
      {lowStockItems.length > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1.5px solid #FCD34D',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> Мало на складе ({lowStockItems.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {lowStockItems.slice(0, 10).map(p => (
              <span
                key={p.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#92400E'
                }}
              >
                {p.brand} {p.model} ({p.size}) — {Number(p.quantity) || 0} шт.
              </span>
            ))}
            {lowStockItems.length > 10 && (
              <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '600', padding: '4px 6px' }}>
                ...и ещё {lowStockItems.length - 10}
              </span>
            )}
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobileView ? '1fr' : '1fr 340px',
        gap: '20px',
        marginBottom: '20px',
        alignItems: 'stretch'
      }}>

        {/* LEFT — DETAILS */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #F1F5F9',
          height: '100%'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '17px',
            fontWeight: '800',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 Детализация за период
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: isMobileView ? '10px' : '12px',
            width: '100%'
          }}>
            {[
              { label: 'ВЫРУЧКА', value: monthRevenue || 0, icon: '💵', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0', wide: false },
              { label: 'ВАЛОВАЯ ПРИБЫЛЬ', value: grossProfit || 0, icon: '📈', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE', wide: false },
              { label: 'РАСХОДЫ', value: monthExpenses || 0, icon: '📉', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', wide: false },
              {
                label: 'ЧИСТАЯ ПРИБЫЛЬ',
                value: netProfit || 0,
                icon: (netProfit || 0) >= 0 ? '🏆' : '⚠️',
                color: (netProfit || 0) >= 0 ? '#10B981' : '#EF4444',
                bg: (netProfit || 0) >= 0 ? '#F0FDF4' : '#FEF2F2',
                border: (netProfit || 0) >= 0 ? '#A7F3D0' : '#FECACA',
                wide: true
              }
            ].map(item => (
              <div
                key={item.label}
                style={{
                  gridColumn: item.wide ? '1 / -1' : 'auto',
                  backgroundColor: item.bg,
                  border: `1.5px solid ${item.border}`,
                  borderRadius: '14px',
                  padding: isMobileView ? '14px' : '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobileView ? '10px' : '12px',
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: isMobileView ? '24px' : '28px', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '10px',
                    color: '#94A3B8',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    marginBottom: isMobileView ? '3px' : '4px'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: item.wide ? (isMobileView ? '20px' : '22px') : (isMobileView ? '16px' : '18px'),
                    fontWeight: '800',
                    color: item.color,
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.value} Br
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — EXPENSES BREAKDOWN */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid #F1F5F9',
          height: '100%'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '17px',
            fontWeight: '800',
            color: '#0F172A'
          }}>
            💸 Расходы
          </h3>
          {[
            { label: 'Реклама', value: adExpenses, total: monthExpenses, color: '#6366F1', bg: '#EEF2FF', icon: '📣' },
            { label: 'Доставка', value: deliveryExpenses, total: monthExpenses, color: '#10B981', bg: '#F0FDF4', icon: '📦' },
            { label: 'Другое', value: otherExpenses, total: monthExpenses, color: '#F59E0B', bg: '#FFFBEB', icon: '💼' }
          ].map(exp => {
            const pct = monthExpenses > 0 ? Math.round((exp.value / monthExpenses) * 100) : 0;
            return (
              <div key={exp.label} style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    <span>{exp.icon}</span>
                    {exp.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: exp.color }}>
                      {exp.value} Br
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      backgroundColor: '#F1F5F9',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: exp.color,
                    borderRadius: '4px',
                    transition: 'width 0.8s ease',
                    background: `linear-gradient(90deg,${exp.color},${exp.color}88)`
                  }} />
                </div>
              </div>
            );
          })}

          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#FEF2F2',
            borderRadius: '12px',
            border: '1px solid #FECACA',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#EF4444' }}>
              Итого расходов
            </span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#EF4444' }}>
              {monthExpenses} Br
            </span>
          </div>
        </div>
      </div>

      {/* RECENT SALES */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        border: '1px solid #F1F5F9'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '17px',
            fontWeight: '800',
            color: '#0F172A'
          }}>
            🛍️ Последние продажи
          </h3>
          <button
            onClick={() => navigate('sales')}
            style={{
              padding: '6px 14px',
              backgroundColor: '#EEF2FF',
              color: '#6366F1',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#E0E7FF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#EEF2FF';
            }}
          >
            Все продажи →
          </button>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {recentSales.slice(0, 5).map(sale => {
            const img = sale.productImage;
            const isDone = sale.status === 'completed' || (sale.status as string) === 'завершена';
            const isCancelled =
              sale.status === 'cancelled' ||
              (sale as any).cancelled === true ||
              (sale.status as string) === 'отменена' ||
              (sale.status as string) === 'возврат';

            return (
              <div
                key={sale.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  backgroundColor: isCancelled ? '#FFF5F5' : '#F8FAFC',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: isCancelled ? '#FECACA' : '#F1F5F9',
                  transition: 'all 0.15s',
                  opacity: isCancelled ? 0.85 : 1,
                  position: 'relative' as const,
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  if (!isCancelled) {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.transform = 'translateX(3px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCancelled) {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {/* Cancelled red stripe */}
                {isCancelled && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: '#EF4444',
                    borderRadius: '4px 0 0 4px'
                  }} />
                )}

                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  filter: isCancelled ? 'grayscale(60%)' : 'none'
                }}>
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>👟</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: isCancelled ? '#9CA3AF' : '#1E293B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: '3px',
                    maxWidth: isMobileView ? '120px' : 'none',
                    textDecoration: isCancelled ? 'line-through' : 'none'
                  }}>
                    {sale.productName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>👤</span>
                    <span style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: isMobileView ? '100px' : 'none'
                    }}>
                      {sale.customer || 'Покупатель'}
                    </span>
                  </div>
                  {isCancelled && sale.cancellationReason && (
                    <div style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: '#EF4444',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>↩️</span>
                      {sale.cancellationReason}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '800',
                    color: isCancelled ? '#9CA3AF' : '#10B981',
                    letterSpacing: '-0.3px',
                    textDecoration: isCancelled ? 'line-through' : 'none'
                  }}>
                    {(Number(sale.total) || 0)} Br
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    marginTop: '2px'
                  }}>
                    {new Date(safeDate(sale.date) || Date.now()).toLocaleDateString('ru-RU')}
                  </div>
                </div>

                {isCancelled ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#EF4444',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    ↩️ Возврат
                  </div>
                ) : (
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '700',
                    flexShrink: 0,
                    backgroundColor: isDone ? '#D1FAE5' : '#FEF3C7',
                    color: isDone ? '#065F46' : '#92400E'
                  }}>
                    {isDone ? '✅ Готово' : '⏳ В процессе'}
                  </div>
                )}
              </div>
            );
          })}

          {recentSales.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#94A3B8'
            }}>
              <div style={{ fontSize: '40px' }}>🛍️</div>
              <div style={{
                fontSize: '15px',
                fontWeight: '600',
                color: '#475569',
                marginTop: '12px'
              }}>
                Продаж пока нет
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
