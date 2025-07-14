# Система автоматической авторизации

## Описание

Система позволяет отправлять пользователей на автоматическую авторизацию через специальную ссылку с токеном. Пользователь переходит по ссылке и автоматически авторизуется без необходимости вводить токен вручную.

## Компоненты

### 1. Страница автоматической авторизации
**URL:** `/auth/login?token=USER_TOKEN`

### 2. API для генерации ссылок
**Endpoint:** `POST /api/auth/generate-link`

## Использование

### Генерация ссылки авторизации

```bash
curl -X POST http://localhost:3000/api/auth/generate-link \
  -H "Content-Type: application/json" \
  -d '{"token": "user_token_here"}'
```

**Ответ:**
```json
{
  "success": true,
  "link": "http://localhost:3000/auth/login?token=user_token_here",
  "user": {
    "id": 11,
    "name": "admin",
    "email": "admin@admin.com",
    "balance": "9884.00"
  }
}
```

### Прямое использование

Отправьте пользователя на ссылку:
```
http://localhost:3000/auth/login?token=USER_TOKEN
```

## Процесс авторизации

1. **Пользователь переходит по ссылке** с токеном в параметрах
2. **Страница извлекает токен** из URL параметров
3. **Токен валидируется** через Laravel backend
4. **Токен сохраняется** в localStorage браузера
5. **Пользователь перенаправляется** на главную страницу `/`
6. **Главная страница загружается** с уже авторизованным пользователем

## Статусы авторизации

### ✅ Успешная авторизация
- Показывается зеленая галочка
- Сообщение: "Авторизация успешна! Перенаправляем на главную страницу..."
- Автоматическое перенаправление через 2 секунды

### ❌ Ошибка авторизации
- Показывается красный крестик
- Возможные сообщения ошибок:
  - "Токен не найден в URL. Проверьте ссылку."
  - "Неверный или истекший токен. Пожалуйста, получите новую ссылку."
  - "Ошибка при авторизации. Попробуйте еще раз."
- Кнопка для ручного перехода на главную страницу

### ⏳ Процесс авторизации
- Показывается спиннер
- Сообщение: "Проверка токена..."

## Интеграция с существующими системами

### Telegram Bot
```javascript
const loginLink = `https://your-domain.com/auth/login?token=${userToken}`;
bot.sendMessage(chatId, `🔐 Авторизация в Gemini Image Editor:\n${loginLink}`);
```

### Email уведомления
```html
<p>Для авторизации в Gemini Image Editor перейдите по ссылке:</p>
<a href="https://your-domain.com/auth/login?token={{user_token}}">
  Войти в систему
</a>
```

### Мобильные приложения
```javascript
// React Native
const openAutoLogin = (token) => {
  const url = `https://your-domain.com/auth/login?token=${token}`;
  Linking.openURL(url);
};
```

## Безопасность

### ✅ Безопасные практики
- Токены валидируются на сервере
- Используется HTTPS для передачи токенов
- Токены имеют ограниченный срок действия
- Валидация происходит через защищенный Laravel API

### ⚠️ Важные замечания
- Не передавайте токены в открытом виде
- Используйте короткие ссылки для скрытия токенов
- Токены должны быть одноразовыми (если требуется)
- Логируйте все попытки авторизации

## Примеры использования

### 1. Отправка пользователю в Telegram
```php
// Laravel Controller
$token = $user->createToken('auto-login')->plainTextToken;
$loginUrl = "https://gemini-editor.com/auth/login?token={$token}";

// Отправка в Telegram
$telegram->sendMessage([
    'chat_id' => $user->telegram_id,
    'text' => "🎨 Войдите в Gemini Image Editor:\n{$loginUrl}"
]);
```

### 2. Email с авторизацией
```php
// Laravel Mail
Mail::to($user->email)->send(new AutoLoginMail($user, $loginUrl));
```

### 3. QR код для авторизации
```javascript
// Генерация QR кода
import QRCode from 'qrcode';

const generateQR = async (token) => {
  const loginUrl = `https://gemini-editor.com/auth/login?token=${token}`;
  const qr = await QRCode.toDataURL(loginUrl);
  return qr;
};
```

## Мониторинг и отладка

### Логи авторизации
Все попытки авторизации логируются в консоль браузера:
```
Auto login error: [детали ошибки]
```

### Проверка токена
```bash
# Проверка валидности токена
curl -X POST https://api.chatall.ru/api/v1/bot/validate-token \
  -H "Authorization: Bearer YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token": "user_token_here"}'
```

## Настройка

### Переменные окружения
```env
LARAVEL_API_URL=https://api.chatall.ru
BOT_TOKEN=your_bot_token_here
```

### Кастомизация времени перенаправления
В файле `app/auth/login/page.tsx` измените значение в `setTimeout`:
```javascript
setTimeout(() => {
  router.push('/');
}, 2000); // 2 секунды
```

## Troubleshooting

### Проблема: "Токен не найден в URL"
- Проверьте правильность ссылки
- Убедитесь, что токен присутствует в query параметрах

### Проблема: "Неверный или истекший токен"
- Токен может быть истекшим
- Сгенерируйте новый токен
- Проверьте правильность токена в Laravel backend

### Проблема: "Ошибка при авторизации"
- Проверьте доступность Laravel API
- Убедитесь в правильности BOT_TOKEN
- Проверьте настройки CORS

## Обновления

### Версия 1.0
- Базовая функциональность автоматической авторизации
- Поддержка токенов Laravel Sanctum
- Интеграция с useAuth hook
- Адаптивный дизайн страницы авторизации 