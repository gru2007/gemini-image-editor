"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function AutoLoginContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [hasTriedLogin, setHasTriedLogin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Prevent multiple API calls
    if (hasTriedLogin) return;

    const performAutoLogin = async () => {
      try {
        setHasTriedLogin(true); // Mark that we've tried to login
        
        // Get token from URL parameters
        const token = searchParams.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Токен не найден в URL. Проверьте ссылку.');
          return;
        }

        setMessage('Проверка токена...');

        // Attempt to login with the token
        const success = await login(token);

        if (success) {
          setStatus('success');
          setMessage('Авторизация успешна! Перенаправляем на главную страницу...');
          
          // Redirect to main page after 2 seconds
          setTimeout(() => {
            try {
              router.push('/');
            } catch (error) {
              // Fallback to window.location if router fails
              window.location.href = '/';
            }
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Неверный или истекший токен. Пожалуйста, получите новую ссылку.');
        }

      } catch (error) {
        setStatus('error');
        setMessage('Ошибка при авторизации. Попробуйте еще раз.');
        console.error('Auto login error:', error);
      }
    };

    performAutoLogin();
  }, [searchParams, login, router, hasTriedLogin]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600 dark:text-blue-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Gemini Image Editor
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* Status Icon */}
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          {/* Status Message */}
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {message}
          </div>
          
          {/* Additional Info */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {status === 'loading' && 'Пожалуйста, подождите...'}
            {status === 'success' && (
              <div className="space-y-2">
                <p>Вы будете перенаправлены автоматически.</p>
                <button
                  onClick={() => {
                    try {
                      router.push('/');
                    } catch (error) {
                      window.location.href = '/';
                    }
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline text-sm"
                >
                  Перейти сейчас →
                </button>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <p>Что можно сделать:</p>
                <ul className="text-xs space-y-1">
                  <li>• Проверьте правильность ссылки</li>
                  <li>• Получите новую ссылку для авторизации</li>
                  <li>• Обратитесь к администратору</li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Manual redirect buttons for errors */}
          {status === 'error' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  try {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  } catch (error) {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                ← Назад
              </button>
              <button
                onClick={() => {
                  try {
                    router.push('/');
                  } catch (error) {
                    window.location.href = '/';
                  }
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Перейти на главную страницу
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Gemini Image Editor
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
          <div className="text-lg font-medium text-blue-600 dark:text-blue-400">
            Загрузка...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main export with Suspense wrapper
export default function AutoLogin() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AutoLoginContent />
    </Suspense>
  );
} 