import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleChangePassword = () => {
    window.alert('Функция смены пароля будет доступна в следующем обновлении.');
  };

  return (
    <div style={{maxWidth:'700px'}}>

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
          background:
            'linear-gradient(135deg,#6366F1,#8B5CF6)',
          padding:'24px',
          display:'flex',
          alignItems:'center',
          gap:'16px'
        }}>
          <div style={{
            width:'64px',
            height:'64px',
            borderRadius:'50%',
            backgroundColor:
              'rgba(255,255,255,0.25)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'28px',
            flexShrink:0,
            border:
              '3px solid rgba(255,255,255,0.4)'
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
              {currentUser?.email ||
               'admin@hqf.com'}
            </div>
          </div>
          <div style={{
            marginLeft:'auto',
            backgroundColor:
              'rgba(255,255,255,0.2)',
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

      {/* SETTINGS SECTIONS */}
      {[
        {
          title:'🏪 Магазин',
          items:[
            {
              icon:'📝',
              label:'Название магазина',
              value:'HQF Sneakers' as string | boolean,
              type:'info' as const
            },
            {
              icon:'💰',
              label:'Валюта',
              value:'BYN (Br)' as string | boolean,
              type:'info' as const
            },
            {
              icon:'🌍',
              label:'Регион',
              value:'Беларусь' as string | boolean,
              type:'info' as const
            }
          ]
        },
        {
          title:'🔔 Уведомления',
          items:[
            {
              icon:'📦',
              label:'Уведомления о заказах',
              value:true as string | boolean,
              type:'toggle' as const
            },
            {
              icon:'⚠️',
              label:'Низкий остаток товара',
              value:true as string | boolean,
              type:'toggle' as const
            },
            {
              icon:'💸',
              label:'Напоминание о расходах',
              value:false as string | boolean,
              type:'toggle' as const
            }
          ]
        },
        {
          title:'🔐 Безопасность',
          items:[
            {
              icon:'📧',
              label:'Email',
              value:(currentUser?.email || '—') as string | boolean,
              type:'info' as const
            },
            {
              icon:'🔑',
              label:'Сменить пароль',
              value:'' as string | boolean,
              type:'button' as const,
              action:handleChangePassword,
              btnText:'Изменить'
            }
          ]
        }
      ].map(section=>(
        <div
          key={section.title}
          style={{
            backgroundColor:'white',
            borderRadius:'20px',
            overflow:'hidden',
            boxShadow:
              '0 4px 20px rgba(0,0,0,0.06)',
            border:'1px solid #F1F5F9',
            marginBottom:'16px'
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
                e.currentTarget.style
                  .backgroundColor='#F8FAFC';
              }}
              onMouseLeave={e=>{
                e.currentTarget.style
                  .backgroundColor='transparent';
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
                      item.value
                        ? '#6366F1'
                        : '#E2E8F0',
                    position:'relative',
                    cursor:'pointer',
                    transition:'all 0.2s',
                    flexShrink:0
                  }}
                >
                  <div style={{
                    position:'absolute',
                    top:'2px',
                    left:item.value
                      ? '22px' : '2px',
                    width:'20px',
                    height:'20px',
                    borderRadius:'50%',
                    backgroundColor:'white',
                    boxShadow:
                      '0 1px 4px rgba(0,0,0,0.2)',
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
                    e.currentTarget.style
                      .backgroundColor='#E0E7FF';
                  }}
                  onMouseLeave={e=>{
                    e.currentTarget.style
                      .backgroundColor='#EEF2FF';
                  }}
                >
                  {item.btnText}
                </button>
              )}
            </div>
          ))}
        </div>
      ))}

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
          marginTop:'8px'
        }}
        onMouseEnter={e=>{
          e.currentTarget.style
            .backgroundColor='#FEE2E2';
          e.currentTarget.style
            .transform='translateY(-1px)';
        }}
        onMouseLeave={e=>{
          e.currentTarget.style
            .backgroundColor='#FEF2F2';
          e.currentTarget.style
            .transform='translateY(0)';
        }}
      >
        🚪 Выйти из аккаунта
      </button>

    </div>
  );
};

export default Settings;
