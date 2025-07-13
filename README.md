# Gemini Image Editor - Интеграция с ChatAll.ru

Современный веб-интерфейс для редактирования изображений с помощью Google Gemini 2.0 Flash, интегрированный с системой биллинга Laravel backend.

## Основные возможности

- **Редактирование изображений с ИИ**: Используйте Gemini 2.0 Flash для мгновенного редактирования изображений
- **Интеграция с биллингом**: Автоматическое списание средств с баланса пользователя
- **Авторизация пользователей**: Проверка токенов через Laravel backend
- **Современный дизайн**: Адаптивный интерфейс с поддержкой темной/светлой темы
- **История изменений**: Сохранение и возврат к предыдущим версиям редактирования

## Как это работает

1. **Авторизация**: Пользователь вводит токен от основного сайта
2. **Проверка баланса**: Система проверяет достаточность средств на балансе
3. **Загрузка изображения**: Поддержка drag & drop, форматы PNG, JPG, WEBP
4. **Списание средств**: Автоматическое списание стоимости обработки
5. **Редактирование**: Описание изменений на русском языке с улучшением промпта
6. **Результат**: Мгновенная обработка через Gemini 2.0 Flash и скачивание

## Архитектура

- **Frontend**: Next.js с Tailwind CSS и shadcn/ui
- **Backend**: Laravel (ai-processor) с системой управления балансом
- **ИИ**: Google Gemini 2.0 Flash API
- **Авторизация**: JWT токены через Laravel backend

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

# Конфигурация Next.js
NEXTAUTH_URL=http://localhost:3000

# Настройки Gemini Editor
NEXT_PUBLIC_GEMINI_EDITOR_COST=10
```

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
GET /api/auth/user
Headers: Authorization: Bearer <token>
```

#### Списание баланса
```
POST /api/balance/deduct
Body: {
  "user_id": 123,
  "amount": 10,
  "description": "Gemini Image Editor usage"
}
```

#### Редактирование изображения
```
POST /api/image
Body: {
  "prompt": "Удали фон с изображения, natural and realistic appearance, moderate changes, balanced modification",
  "image": "data:image/jpeg;base64,..."
}
```

## Интеграция с Laravel Backend

Проект интегрирован с существующим Laravel backend (ai-processor), который предоставляет:

- Управление балансом пользователей через BotUserController
- Авторизацию через JWT токены
- Систему биллинга с автоматическим списанием средств
- Обработку изображений выполняется напрямую через Gemini API

  try {
    const response = await model.generateContent(contents);
    for (const part of response.response.candidates[0].content.parts) {
      // Based on the part type, either show the text or save the image
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync("gemini-native-image.png", buffer);
        console.log("Image saved as gemini-native-image.png");
      }
    }
  } catch (error) {
    console.error("Error generating content:", error);
  }
}
```

## Features

- 🎨 Text-to-image generation with Gemini 2.0 Flash
- 🖌️ Image editing through natural language instructions
- 💬 Conversation history for context-aware image refinements
- 📱 Responsive UI built with Next.js and shadcn/ui
- 🔄 Seamless workflow between creation and editing modes
- ⚡ Uses Gemini 2.0 Flash Javascript SDK

## Getting Started

### Local Development

First, set up your environment variables:

```bash
cp .env.example .env
```

Add your Google AI Studio API key to the `.env` file:

_Get your `GEMINI_API_KEY` key [here](https://ai.google.dev/gemini-api/docs/api-key)._

```
GEMINI_API_KEY=your_google_api_key
```

Then, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgoogle-gemini%2Fgemini-image-editing-nextjs-quickstart&env=GEMINI_API_KEY&envDescription=Create%20an%20account%20and%20generate%20an%20API%20key&envLink=https%3A%2F%2Faistudio.google.com%2Fapp%2Fu%2F0%2Fapikey&demo-url=https%3A%2F%2Fhuggingface.co%2Fspaces%2Fphilschmid%2Fimage-generation-editing)

### Docker

1. Build the Docker image:

```bash
docker build -t nextjs-gemini-image-editing .
```

2. Run the container with your Google API key:

```bash
docker run -p 3000:3000 -e GEMINI_API_KEY=your_google_api_key nextjs-gemini-image-editing
```

Or using an environment file:

```bash
# Run container with env file
docker run -p 3000:3000 --env-file .env nextjs-gemini-image-editing
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework for the web application
- [Google Gemini 2.0 Flash](https://deepmind.google/technologies/gemini/) - AI model for image generation and editing
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable components built using Radix UI and Tailwind CSS

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.
