import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-indigo-600 p-3.5 rounded-2xl">
            <LogIn className="w-7 h-7 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1 tracking-tight">HQF<span className="text-indigo-600">.</span>Sneakers</h1>
        <p className="text-gray-400 text-center mb-6 text-sm font-medium">Вход в систему учета</p>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-transparent text-sm transition-all"
              placeholder="admin@hqf.by"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:border-transparent text-sm transition-all"
              placeholder="&&bull;&&bull;&&bull;&&bull;&&bull;&&bull;&&bull;&&bull;"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 transition-colors text-sm font-semibold shadow-sm"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-gray-500">Для настройки:</span><br/>
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
