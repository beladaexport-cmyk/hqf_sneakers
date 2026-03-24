import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { Product, Sale, Preorder, Supplier } from '../types';
import { useViewMode } from '../contexts/ViewModeContext';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { data: products } = useFirestore<Product>('products');
  const { data: sales } = useFirestore<Sale>('sales');
  const { data: preorders } = useFirestore<Preorder>('preorders');
  const { data: suppliers } = useFirestore<Supplier>('suppliers');
  const { isMobileView } = useViewMode();

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
        value:true,
        type:'toggle'
      },
      {
        icon:'⚠️',
        label:'Низкий остаток товара',
        value:true,
        type:'toggle'
      },
      {
        icon:'💸',
        label:'Напоминание о расходах',
        value:false,
        type:'toggle'
      }
    ]
  };

  const renderSection = (section: SettingsSection) => (
    <div
      key={section.title}
      style={{
        backgroundColor:'white',
        borderRadius:'20px',
        overflow:'hidden',
        boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
        border:'1px solid #F1F5F9'
      }}
    >
      <div style={{
        padding:'16px 20px',
        borderBottom:'1px solid #F1F5F9',
        fontSize:'15px',
        fontWeight:'700',
        color:'#0F172A'
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
                ? '1px solid #F8FAFC'
                : 'none',
            transition:'all 0.15s'
          }}
          onMouseEnter={e=>{
            e.currentTarget.style.backgroundColor='#F8FAFC';
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.backgroundColor='transparent';
          }}
        >
          <div style={{
            width:'40px',
            height:'40px',
            borderRadius:'10px',
            backgroundColor:'#F1F5F9',
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
            color:'#374151'
          }}>
            {item.label}
          </div>

          {item.type==='info' && (
            <div style={{
              fontSize:'13px',
              color:'#94A3B8',
              fontWeight:'500'
            }}>
              {String(item.value)}
            </div>
          )}

          {item.type==='toggle' && (
            <div
              onClick={()=>{}}
              style={{
                width:'44px',
                height:'24px',
                borderRadius:'12px',
                backgroundColor:
                  item.value ? '#6366F1' : '#E2E8F0',
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
                backgroundColor:'#EEF2FF',
                color:'#6366F1',
                border:'none',
                borderRadius:'8px',
                fontSize:'13px',
                fontWeight:'600',
                cursor:'pointer',
                transition:'all 0.15s'
              }}
              onMouseEnter={e=>{
                e.currentTarget.style.backgroundColor='#E0E7FF';
              }}
              onMouseLeave={e=>{
                e.currentTarget.style.backgroundColor='#EEF2FF';
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
            color:'#0F172A',
            letterSpacing:'-0.5px'
          }}>
            ⚙️ Настройки
          </h1>
          <p style={{
            margin:0,
            fontSize:'14px',
            color:'#94A3B8'
          }}>
            Управление магазином HQF Sneakers
          </p>
        </div>
      </div>

      {/* PROFILE CARD */}
      <div style={{
        backgroundColor:'white',
        borderRadius:'20px',
        overflow:'hidden',
        boxShadow:'0 4px 20px rgba(0,0,0,0.07)',
        border:'1px solid #F1F5F9',
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
            backgroundColor:'white',
            borderRadius:'20px',
            overflow:'hidden',
            boxShadow:'0 4px 20px rgba(0,0,0,0.06)',
            border:'1px solid #F1F5F9'
          }}>
            <div style={{
              padding:'16px 20px',
              borderBottom:'1px solid #F1F5F9',
              fontSize:'15px',
              fontWeight:'700',
              color:'#0F172A'
            }}>
              📊 Статистика магазина
            </div>
            {[
              { icon:'👟', label:'Всего товаров', value:products?.length||0, color:'#6366F1' },
              { icon:'🛍️', label:'Всего продаж', value:sales?.length||0, color:'#10B981' },
              { icon:'📋', label:'Предзаказов', value:preorders?.length||0, color:'#F59E0B' },
              { icon:'🏪', label:'Поставщиков', value:suppliers?.length||0, color:'#8B5CF6' }
            ].map((item,idx,arr)=>(
              <div key={item.label} style={{
                display:'flex',
                alignItems:'center',
                gap:'14px',
                padding:'14px 20px',
                borderBottom: idx<arr.length-1 ? '1px solid #F8FAFC' : 'none'
              }}>
                <div style={{
                  width:'38px',
                  height:'38px',
                  borderRadius:'10px',
                  backgroundColor:'#F8FAFC',
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
                    color:'#374151'
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
          backgroundColor:'#FEF2F2',
          color:'#EF4444',
          border:'2px solid #FECACA',
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
          e.currentTarget.style.backgroundColor='#FEE2E2';
          e.currentTarget.style.transform='translateY(-1px)';
        }}
        onMouseLeave={e=>{
          e.currentTarget.style.backgroundColor='#FEF2F2';
          e.currentTarget.style.transform='translateY(0)';
        }}
      >
        🚪 Выйти из аккаунта
      </button>

    </div>
  );
};

export default Settings;
