import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, Preorder, Supplier } from '../types';
import { useViewMode } from '../contexts/ViewModeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { data: products } = useFirestore<Product>('products');
  const { data: sales } = useFirestore<Sale>('sales');
  const { data: preorders } = useFirestore<Preorder>('preorders');
  const { data: suppliers } = useFirestore<Supplier>('suppliers');
  const { isMobileView } = useViewMode();
  const { settings, updateSetting } = useSettings();
  const t = useTheme();

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = () => {
    window.alert('Функция смены пароля будет доступна в следующем обновлении.');
  };

  type SettingsItem = {
    icon: string;
    label: string;
    value: string | boolean;
    type: 'info' | 'toggle' | 'button';
    action?: () => void;
    btnText?: string;
    onToggle?: (val: boolean) => void;
  };

  type SettingsSection = {
    title: string;
    items: SettingsItem[];
  };

  const shopSection: SettingsSection = {
    title:'🏪 Магазин',
    items:[
      {
        icon:'📝',
        label:'Название магазина',
        value:'HQF Sneakers',
        type:'info'
      },
      {
        icon:'💰',
        label:'Валюта',
        value:'BYN (Br)',
        type:'info'
      },
      {
        icon:'🌍',
        label:'Регион',
        value:'Беларусь',
        type:'info'
      }
    ]
  };

  const securitySection: SettingsSection = {
    title:'🔐 Безопасность',
    items:[
      {
        icon:'📧',
        label:'Email',
        value:currentUser?.email || '—',
        type:'info'
      },
      {
        icon:'🔑',
        label:'Сменить пароль',
        value:'',
        type:'button',
        action:handleChangePassword,
        btnText:'Изменить'
      }
    ]
  };

  const notificationsSection: SettingsSection = {
    title:'🔔 Уведомления',
    items:[
      {
        icon:'📦',
        label:'Уведомления о заказах',
        value:settings.orderNotifications,
        type:'toggle',
        onToggle:(val) => updateSetting('orderNotifications', val)
      },
      {
        icon:'⚠️',
        label:'Низкий остаток товара',
        value:settings.showLowStock,
        type:'toggle',
        onToggle:(val) => updateSetting('showLowStock', val)
      },
      {
        icon:'💸',
        label:'Напоминание о расходах',
        value:settings.expenseReminders,
        type:'toggle',
        onToggle:(val) => updateSetting('expenseReminders', val)
      }
    ]
  };

  const renderSection = (section: SettingsSection) => (
    <div
      key={section.title}
      style={{
        backgroundColor:t.bgCard,
        borderRadius:'20px',
        overflow:'hidden',
        boxShadow:t.shadowMd,
        border:`1px solid ${t.borderLight}`
      }}
    >
      <div style={{
        padding:'16px 20px',
        borderBottom:`1px solid ${t.borderLight}`,
        fontSize:'15px',
        fontWeight:'700',
        color:t.textPrimary
      }}>
        {section.title}
      </div>
      {section.items.map((item,idx)=>(
        <div
          key={item.label}
          style={{
            display:'flex',
            alignItems:'center',
            gap:'14px',
            padding:'16px 20px',
            borderBottom:
              idx<section.items.length-1
                ? `1px solid ${t.bgHover}`
                : 'none',
            transition:'all 0.15s'
          }}
          onMouseEnter={e=>{
            e.currentTarget.style.backgroundColor=t.bgHover;
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.backgroundColor='transparent';
          }}
        >
          <div style={{
            width:'40px',
            height:'40px',
            borderRadius:'10px',
            backgroundColor:t.bgPrimary,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'18px',
            flexShrink:0
          }}>
            {item.icon}
          </div>

          <div style={{
            flex:1,
            fontSize:'14px',
            fontWeight:'600',
            color:t.textPrimary
          }}>
            {item.label}
          </div>

          {item.type==='info' && (
            <div style={{
              fontSize:'13px',
              color:t.textMuted,
              fontWeight:'500'
            }}>
              {String(item.value)}
            </div>
          )}

          {item.type==='toggle' && (
            <div
              onClick={()=>{ if (item.onToggle) item.onToggle(!item.value); }}
              style={{
                width:'44px',
                height:'24px',
                borderRadius:'12px',
                backgroundColor:
                  item.value ? t.accent : t.border,
                position:'relative',
                cursor:'pointer',
                transition:'all 0.2s',
                flexShrink:0
              }}
            >
              <div style={{
                position:'absolute',
                top:'2px',
                left:item.value ? '22px' : '2px',
                width:'20px',
                height:'20px',
                borderRadius:'50%',
                backgroundColor:'white',
                boxShadow:'0 1px 4px rgba(0,0,0,0.2)',
                transition:'all 0.2s'
              }} />
            </div>
          )}

          {item.type==='button' && 'action' in item && (
            <button
              onClick={item.action}
              style={{
                padding:'7px 16px',
                backgroundColor:t.accentBg,
                color:t.accent,
                border:'none',
                borderRadius:'8px',
                fontSize:'13px',
                fontWeight:'600',
                cursor:'pointer',
                transition:'all 0.15s'
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.backgroundColor=t.accentBorder;
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.backgroundColor=t.accentBg;
              }}
            >
              {item.btnText}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{maxWidth:'900px', margin:'0 auto', padding: isMobileView ? '16px' : '24px'}}>

      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:'32px'
      }}>
        <div>
          <h1 style={{
            margin:'0 0 4px 0',
            fontSize:'28px',
            fontWeight:'800',
            color:t.textPrimary,
            letterSpacing:'-0.5px'
          }}>
            ⚙️ Настройки
          </h1>
          <p style={{
            margin:0,
            fontSize:'14px',
            color:t.textMuted
          }}>
            Управление магазином HQF Sneakers
          </p>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div style={{
        backgroundColor:t.bgCard,
        borderRadius:'20px',
        overflow:'hidden',
        boxShadow:t.shadowMd,
        border:`1px solid ${t.borderLight}`,
        marginBottom:'16px'
      }}>
        <div style={{
          background:'linear-gradient(135deg,#6366F1,#8B5CF6)',
          padding:'24px',
          display:'flex',
          alignItems:'center',
          gap:'16px'
        }}>
          <div style={{
            width:'64px',
            height:'64px',
            borderRadius:'50%',
            backgroundColor:'rgba(255,255,255,0.25)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'28px',
            flexShrink:0,
            border:'3px solid rgba(255,255,255,0.4)'
          }}>
            👤
          </div>
          <div>
            <div style={{
              fontSize:'20px',
              fontWeight:'800',
              color:'white'
            }}>
              HQF Sneakers
            </div>
            <div style={{
              fontSize:'14px',
              color:'rgba(255,255,255,0.75)',
              marginTop:'4px'
            }}>
              {currentUser?.email || 'admin@hqf.com'}
            </div>
          </div>
          <div style={{
            marginLeft:'auto',
            backgroundColor:'rgba(255,255,255,0.2)',
            padding:'6px 14px',
            borderRadius:'20px',
            fontSize:'12px',
            fontWeight:'700',
            color:'white'
          }}>
            👑 Администратор
          </div>
        </div>
      </div>

      {/* APPEARANCE TOGGLE */}
      <div style={{
        backgroundColor: t.bgCard,
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '16px',
        border: `1px solid ${t.border}`,
        boxShadow: t.shadow,
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          fontWeight: '800',
          color: t.textPrimary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          🎨 Внешний вид
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          backgroundColor: settings.darkMode ? '#1E2040' : t.bgHover,
          borderRadius: '14px',
          border: `1.5px solid ${settings.darkMode ? '#3730A3' : t.border}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => updateSetting('darkMode', !settings.darkMode)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: settings.darkMode
                ? 'linear-gradient(135deg, #1E1B4B, #312E81)'
                : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              transition: 'all 0.3s',
            }}>
              {settings.darkMode ? '🌙' : '☀️'}
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '700',
                color: t.textPrimary,
              }}>
                {settings.darkMode ? 'Тёмная тема' : 'Светлая тема'}
              </div>
              <div style={{
                fontSize: '12px',
                color: t.textMuted,
                marginTop: '2px',
              }}>
                {settings.darkMode
                  ? 'Комфортно для глаз ночью'
                  : 'Нажми чтобы включить тёмную тему'}
              </div>
            </div>
          </div>

          <div style={{
            width: '52px',
            height: '28px',
            borderRadius: '14px',
            backgroundColor: settings.darkMode ? '#6366F1' : '#E2E8F0',
            position: 'relative',
            transition: 'background-color 0.3s ease',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute',
              top: '3px',
              left: settings.darkMode ? '27px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              transition: 'left 0.3s ease',
            }} />
          </div>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div style={{
        display:'grid',
        gridTemplateColumns: isMobileView ? '1fr' : '1fr 1fr',
        gap:'16px',
        alignItems:'start'
      }}>
        {/* LEFT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {renderSection(shopSection)}
          {renderSection(securitySection)}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {renderSection(notificationsSection)}

          {/* STATS CARD */}
          <div style={{
            backgroundColor:t.bgCard,
            borderRadius:'20px',
            overflow:'hidden',
            boxShadow:t.shadowMd,
            border:`1px solid ${t.borderLight}`
          }}>
            <div style={{
              padding:'16px 20px',
              borderBottom:`1px solid ${t.borderLight}`,
              fontSize:'15px',
              fontWeight:'700',
              color:t.textPrimary
            }}>
              📊 Статистика магазина
            </div>
            {[
              { icon:'👟', label:'Всего товаров', value:products?.length||0, color:t.accent },
              { icon:'🛍️', label:'Всего продаж', value:sales?.length||0, color:t.success },
              { icon:'📋', label:'Предзаказов', value:preorders?.length||0, color:'#F59E0B' },
              { icon:'🏪', label:'Поставщиков', value:suppliers?.length||0, color:'#8B5CF6' }
            ].map((item,idx,arr)=>(
              <div key={item.label} style={{
                display:'flex',
                alignItems:'center',
                gap:'14px',
                padding:'14px 20px',
                borderBottom: idx<arr.length-1 ? `1px solid ${t.bgHover}` : 'none'
              }}>
                <div style={{
                  width:'38px',
                  height:'38px',
                  borderRadius:'10px',
                  backgroundColor:t.bgHover,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  fontSize:'18px'
                }}>
                  {item.icon}
                </div>
                <div style={{flex:1}}>
                  <div style={{
                    fontSize:'14px',
                    fontWeight:'600',
                    color:t.textPrimary
                  }}>
                    {item.label}
                  </div>
                </div>
                <div style={{
                  fontSize:'20px',
                  fontWeight:'800',
                  color:item.color
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        style={{
          width:'100%',
          padding:'14px',
          backgroundColor:t.dangerBg,
          color:t.danger,
          border:`2px solid ${t.dangerBorder}`,
          borderRadius:'14px',
          fontSize:'15px',
          fontWeight:'700',
          cursor:'pointer',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          gap:'8px',
          transition:'all 0.2s',
          marginTop:'16px'
        }}
        onMouseEnter={e=>{
          e.currentTarget.style.backgroundColor=t.dangerBorder;
          e.currentTarget.style.transform='translateY(-1px)';
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.backgroundColor=t.dangerBg;
          e.currentTarget.style.transform='translateY(0)';
        }}
      >
        🚪 Выйти из аккаунта
      </button>

    </div>
  );
};

export default Settings;
