import React, { useState } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import { useViewMode } from '../contexts/ViewModeContext';
import { Product, Sale, Expense } from '../types';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { isMobileView } = useViewMode();
  const { data: products, loading: loadingProducts } = useFirestore<Product>('products');
  const { data: sales, loading: loadingSales } = useFirestore<Sale>('sales');
  const { data: expenses, loading: loadingExpenses } = useFirestore<Expense>('expenses');

  if (loadingProducts || loadingSales || loadingExpenses) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ color: '#94A3B8', fontSize: '15px' }}>Загрузка данных...</div>
      </div>
    );
  }

  const [dashPeriod, setDashPeriod] = useState<'month' | 'all'>('month');

  const navigate = (tab: string) => {
    if (onNavigate) onNavigate(tab);
  };

  // Monthly calculations
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthSalesData = sales.filter(s => {
    if (dashPeriod === 'month') {
      if (!s.date || !s.date.startsWith(currentMonth)) return false;
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
    return (s.status ?? 'completed') === 'completed';
  });

  const adExpenses = expenses
    .filter(e => (dashPeriod === 'month' ? e.date.startsWith(currentMonth) : true) && e.type === 'advertising')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const deliveryExpenses = expenses
    .filter(e => (dashPeriod === 'month' ? e.date.startsWith(currentMonth) : true) && e.type === 'delivery')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const otherExpenses = expenses
    .filter(e => (dashPeriod === 'month' ? e.date.startsWith(currentMonth) : true) && e.type !== 'advertising' && e.type !== 'delivery')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthRevenue = monthSalesData.reduce((s, e) => s + Number(e.total || 0), 0);
  const monthCost = monthSalesData.reduce((sum, sale) => {
    const cost = Number(
      sale.purchasePrice ||
      (sale as any).costPrice ||
      (sale as any).buyPrice ||
      (sale as any).cost ||
      0
    );
    return sum + cost * sale.quantity;
  }, 0);
  const monthExpenses = adExpenses + deliveryExpenses + otherExpenses;
  const grossProfit = monthRevenue - monthCost;
  const netProfit = grossProfit - monthExpenses;

  // === COST DEBUG ===
  const cancelledThisMonth = sales.filter(s => s.date && s.date.startsWith(currentMonth) && (
    s.status === 'cancelled' || (s.status as string) === 'отменена' || (s.status as string) === 'возврат' || (s as any).cancelled === true || !!s.cancelledAt
  ));
  console.log('=== COST DEBUG ===');
  console.log('Current month:', currentMonth);
  console.log('All sales count:', sales.length, '| Active this month:', monthSalesData.length, '| Cancelled this month:', cancelledThisMonth.length);
  monthSalesData.forEach((s, i) => {
    console.log(
      `Active Sale ${i + 1}:`, s.productName,
      '| price:', s.price,
      '| purchasePrice:', s.purchasePrice,
      '| total:', s.total,
      '| quantity:', s.quantity,
      '| status:', s.status
    );
  });
  cancelledThisMonth.forEach((s, i) => {
    console.log(
      `Cancelled ${i + 1}:`, s.productName,
      '| purchasePrice:', s.purchasePrice,
      '| status:', s.status,
      '| cancelledAt:', s.cancelledAt
    );
  });
  console.log('monthRevenue:', monthRevenue, '| monthCost:', monthCost, '| grossProfit:', grossProfit, '| monthExpenses:', monthExpenses, '| netProfit:', netProfit);
  const totalProducts = products.reduce((s, p) => s + Number(p.quantity || 0), 0);

  const recentSales = [...sales]
    .sort((a, b) => {
      const da = new Date(a.date || 0);
      const db = new Date(b.date || 0);
      return db.getTime() - da.getTime();
    })
    .slice(0, 10);

  return (
    <div style={{
      maxWidth: isMobileView ? '100%' : '1400px',
      margin: '0 auto',
      padding: isMobileView ? '16px' : '24px',
      width: '100%',
      boxSizing: 'border-box' as const,
      overflowX: 'hidden' as const
    }}>

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
            label: dashPeriod === 'month' ? 'Выручка за месяц' : 'Выручка за всё время',
            value: `${monthRevenue || 0}`,
            unit: 'Br',
            icon: '💰',
            gradient: 'linear-gradient(135deg,#10B981,#34D399)',
            glow: 'rgba(16,185,129,0.25)',
            lightBg: '#F0FDF4'
          },
          {
            label: dashPeriod === 'month' ? 'Расходы за месяц' : 'Расходы за всё время',
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
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {[
              { key: 'month', label: '📅 Этот месяц' },
              { key: 'all',   label: '📊 Всё время'  }
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setDashPeriod(p.key as 'month' | 'all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: dashPeriod === p.key ? '#6366F1' : 'white',
                  color: dashPeriod === p.key ? 'white' : '#64748B',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: dashPeriod === p.key
                    ? '0 4px 12px rgba(99,102,241,0.35)'
                    : '0 1px 4px rgba(0,0,0,0.08)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '17px',
            fontWeight: '800',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📊 {dashPeriod === 'month' ? 'Детализация за месяц' : 'Детализация за всё время'}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: isMobileView ? '10px' : '12px',
            width: '100%'
          }}>
            {[
              { label: 'ВЫРУЧКА', value: monthRevenue || 0, icon: '💵', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0', wide: false },
              { label: 'СЕБЕСТОИМОСТЬ', value: monthCost || 0, icon: '🏷️', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', wide: false },
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
            const isDone = sale.status === 'completed';
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
                    {sale.total} Br
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: '#94A3B8',
                    marginTop: '2px'
                  }}>
                    {new Date(sale.date).toLocaleDateString('ru-RU')}
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
