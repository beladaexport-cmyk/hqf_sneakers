# 👟 HQF Sneakers — Система учета магазина кроссовок

Современное веб-приложение для управления магазином кроссовок: учет товаров, продаж и поставщиков.

## Технологии

- **React 18** + **TypeScript** — UI и типизация
- **Vite** — быстрая сборка
- **Tailwind CSS** — стилизация
- **Lucide React** — иконки
- **Firebase Firestore** — облачное хранение данных с синхронизацией в реальном времени
- **Firebase Authentication** — безопасный вход по email и паролю

## Возможности

| Раздел | Функции |
|--------|---------|
| 📊 Дашборд | Статистика, предупреждения о низком остатке, история продаж |
| 👟 Каталог | Добавление, редактирование, удаление товаров, поиск |
| 💰 Продажи | Оформление продаж, история, фильтрация по периодам |
| 💸 Расходы | Учет рекламы, доставки и других расходов |
| 📦 Поставщики | Управление поставщиками в виде карточек |
| ⚙️ Настройки | Информация об аккаунте, выход из системы |

## Установка и запуск

### Требования
- Node.js 18+
- npm 9+

### Шаги

```bash
# Клонировать репозиторий
git clone https://github.com/beladaexport-cmyk/hqf_sneakers.git
cd hqf_sneakers

# Установить зависимости
npm install

# Скопировать и настроить переменные окружения
cp .env.example .env
# Заполните .env своими Firebase credentials

# Запустить dev-сервер
npm run dev
```

Приложение откроется на http://localhost:5173

### Сборка для продакшена

```bash
npm run build
```

Готовые файлы появятся в папке `dist/`.

## 🔥 Firebase Setup

### 1. Создайте Firebase проект

1. Зайдите на https://console.firebase.google.com
2. Нажмите "Add project" / "Создать проект"
3. Введите название: `hqf-sneakers`
4. Отключите Google Analytics (не нужен)
5. Нажмите "Create project"

### 2. Настройте Authentication

1. В меню слева выберите "Authentication"
2. Нажмите "Get started"
3. Выберите "Email/Password"
4. Включите "Email/Password" (первый переключатель)
5. Нажмите "Save"
6. Перейдите на вкладку "Users"
7. Нажмите "Add user"
8. Введите:
   - Email: `admin@hqf.by` (или свой)
   - Password: ваш пароль
9. Нажмите "Add user"

### 3. Настройте Firestore Database

1. В меню слева выберите "Firestore Database"
2. Нажмите "Create database"
3. Выберите location (например, europe-west)
4. Start in **production mode**
5. Нажмите "Create"
6. Перейдите на вкладку "Rules"
7. Замените правила на:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

8. Нажмите "Publish"

### 4. Получите конфигурацию

1. В настройках проекта (шестеренка → Project settings)
2. Прокрутите вниз до "Your apps"
3. Нажмите на иконку Web `</>`
4. Введите App nickname: `HQF Sneakers Web`
5. Не включайте Firebase Hosting
6. Нажмите "Register app"
7. Скопируйте `firebaseConfig`

### 5. Настройте Netlify Environment Variables

1. Зайдите на https://app.netlify.com
2. Выберите ваш сайт
3. Site settings → Environment variables
4. Добавьте переменные из firebaseConfig:

```
VITE_FIREBASE_API_KEY=ваш_api_key
VITE_FIREBASE_AUTH_DOMAIN=ваш_проект.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ваш_project_id
VITE_FIREBASE_STORAGE_BUCKET=ваш_проект.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

5. Нажмите "Save"
6. Redeploy сайт (Deploys → Trigger deploy → Deploy site)

### 6. Готово! 🎉

Теперь данные синхронизируются между всеми устройствами!

## Деплой на Netlify

### Способ 1 — через Git (рекомендуется)

1. Зайдите на https://app.netlify.com
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите репозиторий `hqf_sneakers`
4. Настройки сборки заполнятся автоматически из `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Добавьте Firebase environment variables (см. раздел выше)
6. Нажмите "Deploy site"

После этого любой `git push` в `main` будет автоматически деплоиться.

### Способ 2 — ручной деплой

```bash
npm run build
```

Затем перетащите папку `dist/` на https://app.netlify.com/drop

## Структура проекта

```
src/
├── components/
│   ├── Dashboard.tsx    # Главная страница со статистикой
│   ├── Catalog.tsx      # Каталог товаров
│   ├── Sales.tsx        # Учет продаж
│   ├── Expenses.tsx     # Учет расходов
│   ├── Suppliers.tsx    # Поставщики
│   └── Login.tsx        # Страница входа
├── contexts/
│   └── AuthContext.tsx  # Контекст аутентификации Firebase
├── config/
│   └── firebase.ts      # Конфигурация Firebase
├── hooks/
│   └── useFirestore.ts  # Хук для работы с Firestore в реальном времени
├── types/
│   └── index.ts         # TypeScript интерфейсы
├── App.tsx              # Корневой компонент с навигацией
├── main.tsx             # Точка входа
└── index.css            # Глобальные стили
```

## Лицензия

MIT
