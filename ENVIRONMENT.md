# Environment Variables

This application requires several environment variables to be configured. Create a `.env.local` file in the root directory with the following variables:

## Required Variables

### Gemini API Configuration
```
GEMINI_API_KEY=your_gemini_api_key_here
```
- Get this from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Laravel Backend Configuration
```
LARAVEL_API_URL=https://api.chatall.ru
BOT_TOKEN=your_bot_token_here
```
- `LARAVEL_API_URL`: URL of your Laravel backend API (default: https://api.chatall.ru)
- `BOT_TOKEN`: Bot token for server-to-server authentication with Laravel

### Image Editor Configuration
```
GEMINI_EDITOR_COST=10.0
NEXT_PUBLIC_GEMINI_EDITOR_COST=10.0
```
- Cost in credits for each image editing operation
- `NEXT_PUBLIC_GEMINI_EDITOR_COST`: Client-side cost display
- `GEMINI_EDITOR_COST`: Server-side cost for actual billing

### Optional Variables
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
- Base URL of your Next.js application

## Example .env.local file
```
GEMINI_API_KEY=your_gemini_api_key_here
LARAVEL_API_URL=https://api.chatall.ru
BOT_TOKEN=test_gIi0m0iAUH7Qut_kJVOKkUxthVtj9ltCJ6ThKBGaPLU
GEMINI_EDITOR_COST=10.0
NEXT_PUBLIC_GEMINI_EDITOR_COST=10.0
```

## Security Notes

1. **Never commit `.env.local` to version control**
2. **Bot token is used for server-to-server authentication only**
3. **User tokens are validated on the server before processing**
4. **Balance checking and deduction happens on the server**

## Laravel API Endpoints Required

Your Laravel backend must implement these endpoints:

### Token Validation
```
POST /api/v1/bot/validate-token
Authorization: Bearer {BOT_TOKEN}
Body: { "token": "user_token" }
```

### Balance Deduction
```
POST /api/v1/bot/users/{user_id}/balance
Authorization: Bearer {BOT_TOKEN}
Body: { "amount": 10.0, "type": "debit", "description": "..." }
```

## Testing with curl

Test token validation:
```bash
curl -X 'POST' \
  'https://api.chatall.ru/api/v1/bot/validate-token' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer test_gIi0m0iAUH7Qut_kJVOKkUxthVtj9ltCJ6ThKBGaPLU' \
  -H 'Content-Type: application/json' \
  -d '{
    "token": "71|yIuY0HUn6W3hFIRcHcEXD6QIsfzRIX9l0IbEnnqKafbe869e"
  }'
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in all required variables
3. Restart your development server
4. Test the authentication flow

## Production Deployment

For production deployment, ensure all environment variables are properly configured in your hosting platform (Vercel, Netlify, etc.).

## Troubleshooting

### "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when the Laravel API returns HTML instead of JSON. Check:
1. LARAVEL_API_URL is correct
2. BOT_TOKEN is valid
3. Laravel API is accessible from your Next.js server 