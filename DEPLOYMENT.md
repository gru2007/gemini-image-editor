# Развертывание Gemini Image Editor

## Требования

- Node.js 18+ 
- Laravel 10+ (ai-processor)
- PostgreSQL или MySQL
- Gemini API ключ
- Настроенный Laravel backend с системой управления балансом

## Пошаговая инструкция

### 1. Настройка Laravel Backend (ai-processor)

Убедитесь, что в Laravel backend настроены:

```php
// routes/api.php - должны быть доступны эндпоинты:
Route::get('/user', [UserController::class, 'show'])->middleware('auth:sanctum');
Route::post('/bot/users/{user}/balance', [BotUserController::class, 'updateBalance'])->middleware('auth:bot');
Route::post('/gemini-image-editor/edit', [GeminiImageEditorController::class, 'editImage'])->middleware('auth:sanctum');
```

### 2. Настройка переменных окружения

Создайте `.env.local` в корне Next.js проекта:

```env
GEMINI_API_KEY=your_gemini_api_key_here
LARAVEL_API_URL=https://your-laravel-backend.com
BOT_TOKEN=your_bot_token_here
NEXTAUTH_URL=https://your-nextjs-app.com
GEMINI_EDITOR_COST=10
```

### 3. Установка и запуск

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build
npm start
```

### 4. Настройка CORS в Laravel

В `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_methods' => ['*'],
'allowed_origins' => ['http://localhost:3000', 'https://your-frontend-domain.com'],
'allowed_origins_patterns' => [],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => false,
```

### 5. Тестирование интеграции

1. Откройте [http://localhost:3000/gemini-editor](http://localhost:3000/gemini-editor)
2. Введите API токен пользователя
3. Загрузите изображение
4. Введите инструкцию для редактирования
5. Проверьте списание баланса в Laravel backend

## Продакшен развертывание

### Vercel/Netlify (Frontend)
```bash
# Настройте переменные окружения в панели управления
# Задеплойте из Git репозитория
```

### Docker (Full Stack)
```dockerfile
# Dockerfile для Next.js
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Мониторинг

- Логи API запросов в Next.js
- Мониторинг баланса пользователей в Laravel
- Отслеживание использования Gemini API

## Безопасность

- Используйте HTTPS для всех API запросов
- Ротируйте API ключи регулярно
- Ограничьте доступ к bot endpoints
- Валидируйте все входящие данные

## Устранение неполадок

### Проблема: "Authorization token is required"
- Проверьте настройки CORS
- Убедитесь, что токен передается в заголовке Authorization

### Проблема: "Insufficient balance"
- Проверьте баланс пользователя в Laravel
- Убедитесь, что GEMINI_EDITOR_COST настроен правильно

### Проблема: "Failed to process image"
- Проверьте GEMINI_API_KEY
- Убедитесь, что Laravel backend доступен

## Поддержка

Для получения помощи:
1. Проверьте логи Next.js и Laravel
2. Убедитесь в правильности настройки всех переменных окружения
3. Проверьте доступность всех API endpoints 