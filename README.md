# Gemini Image Editor - Интеграция с ChatAll.ru

Современный веб-интерфейс для редактирования изображений с помощью Google Gemini 2.0 Flash, интегрированный с системой биллинга Laravel backend.

## Основные возможности

- **Редактирование изображений с ИИ**: Используйте Gemini 2.0 Flash для мгновенного редактирования изображений
- **Безопасная система биллинга**: Автоматическое списание средств происходит на сервере
- **Токенная авторизация**: Проверка токенов через Laravel backend с валидацией на сервере
- **Современный дизайн**: Адаптивный интерфейс с поддержкой темной/светлой темы
- **История изменений**: Сохранение и возврат к предыдущим версиям редактирования
- **Защита от мошенничества**: Все операции с балансом происходят на сервере

## Как это работает

1. **Авторизация**: Пользователь вводит токен, который проверяется на сервере
2. **Проверка баланса**: Система проверяет достаточность средств на балансе
3. **Загрузка изображения**: Поддержка drag & drop, форматы PNG, JPG, WEBP
4. **Безопасное списание**: Автоматическое списание стоимости обработки на сервере
5. **Редактирование**: Описание изменений на русском языке с улучшением промпта
6. **Результат**: Мгновенная обработка через Gemini 2.0 Flash и скачивание

## Архитектура системы

### Frontend (Next.js)
- **Интерфейс**: Современный React UI с Tailwind CSS
- **Аутентификация**: React хук для управления состоянием пользователя
- **Обработка изображений**: Отправка запросов к внутреннему API

### Backend API Routes
- **`/api/auth/validate-token`**: Проверка токенов пользователей
- **`/api/auth/user`**: Авторизация пользователей
- **`/api/image`**: Обработка изображений с встроенной проверкой баланса

### Laravel Backend
- **Авторизация**: JWT токены и валидация пользователей
- **Биллинг**: Управление балансом пользователей
- **API**: Bot endpoints для серверного взаимодействия

### Система безопасности
- **Токенная авторизация**: Проверка токенов на каждый запрос
- **Серверное списание**: Невозможность обхода системы оплаты
- **Валидация баланса**: Проверка средств перед обработкой

## Установка и настройка

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd gemini-image-editor
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Настройка переменных окружения
Создайте файл `.env.local` в корне проекта:

```env
# Gemini API Key для генерации изображений
GEMINI_API_KEY=your_gemini_api_key_here

# Конфигурация Laravel Backend
LARAVEL_API_URL=http://localhost:8000
BOT_TOKEN=your_bot_token_here

# Настройки стоимости редактирования
GEMINI_EDITOR_COST=10.0
NEXT_PUBLIC_GEMINI_EDITOR_COST=10.0
```

Подробную документацию по переменным окружения см. в [ENVIRONMENT.md](./ENVIRONMENT.md).

### 4. Запуск проекта
```bash
npm run dev
```

## Использование

### Основной интерфейс
Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### API Endpoints

#### Авторизация пользователя
```
POST /api/auth/user
Body: { "token": "user_token" }
Response: { "success": true, "user": {...}, "token_info": {...} }
```

#### Валидация токена
```
POST /api/auth/validate-token
Body: { "token": "user_token" }
Response: { "valid": true, "user": {...}, "token_info": {...} }
```

#### Редактирование изображения (с встроенной проверкой и списанием)
```
POST /api/image
Body: {
  "prompt": "Удали фон с изображения",
  "image": "data:image/jpeg;base64,...",
  "token": "user_token"
}
Response: { 
  "success": true, 
  "image": "data:image/jpeg;base64,...",
  "balance": 90.0,
  "user": { "id": 123, "name": "User", "balance": 90.0 }
}
```

## Интеграция с Laravel Backend

Проект интегрирован с существующим Laravel backend, который предоставляет:

### Требуемые endpoints:

#### Валидация токена
```
POST /api/v1/bot/validate-token
Authorization: Bearer {BOT_TOKEN}
Body: { "token": "user_token" }
Response: {
  "valid": true,
  "user": {
    "id": 123,
    "name": "User Name",
    "email": "user@example.com",
    "balance": 100.0,
    "telegram_id": null,
    "is_active": true,
    "email_verified_at": "2023-01-01T00:00:00Z"
  },
  "token_info": {
    "id": 456,
    "name": "API Token",
    "abilities": ["*"],
    "created_at": "2023-01-01T00:00:00Z",
    "last_used_at": "2023-01-01T12:00:00Z"
  }
}
```

#### Списание баланса
```
POST /api/v1/bot/users/{user_id}/balance
Authorization: Bearer {BOT_TOKEN}
Body: {
  "amount": 10.0,
  "type": "debit",
  "description": "Gemini Image Editor: описание операции"
}
Response: { "balance": 90.0 }
```

## Безопасность

### Серверная проверка
- Все токены проверяются на сервере перед обработкой
- Баланс проверяется и списывается только на сервере
- Невозможность обхода системы оплаты через клиент

### Защита от мошенничества
- Bot token используется только для серверного взаимодействия
- Пользовательские токены не передаются в открытом виде
- Вся логика биллинга изолирована на сервере

## Технологии

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **ИИ**: Google Gemini 2.0 Flash API
- **Авторизация**: JWT токены через Laravel backend
- **Состояние**: React hooks для управления аутентификацией

## React Hook для аутентификации

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    balance, 
    login, 
    logout 
  } = useAuth();

  const handleLogin = async () => {
    const success = await login('user-token');
    if (success) {
      console.log('Авторизация успешна');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Привет, {user.name}!</p>
          <p>Баланс: {balance}</p>
          <button onClick={logout}>Выйти</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Войти</button>
      )}
    </div>
  );
}
```

## Деплой

### Vercel
1. Загрузите проект на Vercel
2. Настройте переменные окружения
3. Убедитесь, что Laravel backend доступен

### Docker
```bash
# Сборка образа
docker build -t gemini-image-editor .

# Запуск контейнера
docker run -p 3000:3000 --env-file .env gemini-image-editor
```

## Лицензия

Этот проект лицензирован под Apache License 2.0 - смотрите [LICENSE](./LICENSE) файл для деталей.
