import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const t = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err: unknown) {
      setError('Ошибка входа. Проверьте email и пароль.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: t.bgPrimary }}>
      <div className="rounded-lg shadow-lg p-8 max-w-md w-full" style={{ backgroundColor: t.bgCard }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '32px',
        }}>
          <img
            src="https://i.ibb.co/TxL4dnHM/logo.png"
            alt="HQF Sneakers"
            style={{
              height: '80px',
              width: 'auto',
              objectFit: 'contain',
              marginBottom: '12px',
              filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.3))',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <p style={{
            fontSize: '14px',
            color: t.textMuted,
            fontWeight: '500',
            margin: 0,
          }}>
            Система управления магазином
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: t.dangerBg, border: `1px solid ${t.dangerBorder}`, color: t.danger }} className="px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: t.textSecondary }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: t.bgInput, border: `1px solid ${t.border}`, color: t.textPrimary }}
              placeholder="admin@hqf.by"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: t.textSecondary }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: t.bgInput, border: `1px solid ${t.border}`, color: t.textPrimary }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg transition-colors"
            style={{ backgroundColor: loading ? t.textMuted : t.accent, color: '#FFFFFF' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: t.accentBg }}>
          <p className="text-sm" style={{ color: t.textSecondary }}>
            <strong>💡 Для настройки:</strong><br/>
            1. Создайте Firebase проект<br/>
            2. Добавьте пользователя в Authentication<br/>
            3. Настройте переменные окружения
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
