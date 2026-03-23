import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { migrateProducts } from '../utils/migrateProducts';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  const handleMigrate = async () => {
    if (
      !window.confirm(
        'Выполнить миграцию данных?\n\nЭто действие:\n- Перенесет все товары в новый формат\n- Создаст предзаказы для товаров со статусом "предзаказ"\n- Удалит старые записи\n\nНельзя отменить!'
      )
    ) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const result = await migrateProducts();
      setMigrationResult(
        `✅ Успешно!\n\nМигрировано ${result.migratedCount} товаров\nСоздано ${result.modelsCount} моделей\n\nОбновите страницу для применения изменений.`
      );
    } catch (error: unknown) {
      setMigrationResult(`❌ Ошибка: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">⚙️ Настройки</h2>

      {/* Аккаунт */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 Аккаунт</h3>
        <p className="text-sm text-gray-600 mb-4">Вы вошли как: {currentUser?.email}</p>
        <button
          onClick={() => logout()}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выйти
        </button>
      </div>

      {/* Миграция данных */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🔄 Миграция данных</h3>
        <p className="text-sm text-gray-600 mb-4">
          Перенести товары из старого формата в новый формат с размерной сеткой.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Внимание:</strong> Это действие необратимо!<br />
            Рекомендуется выполнять миграцию один раз.
          </p>
        </div>

        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {migrating ? '🔄 Миграция в процессе...' : '▶️ Запустить миграцию'}
        </button>

        {migrationResult && (
          <div
            className={`mt-4 p-4 rounded-lg whitespace-pre-wrap ${
              migrationResult.startsWith('✅')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {migrationResult}
          </div>
        )}
      </div>

      {/* О системе */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ℹ️ О системе</h3>
        <p className="text-sm text-gray-600">
          HQF Sneakers — Система учета магазина кроссовок<br />
          Версия: 2.0 (с поддержкой размерной сетки)
        </p>
      </div>
    </div>
  );
};

export default Settings;
