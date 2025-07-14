"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles, Download, RefreshCw, Moon, Sun, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/hooks/useAuth";
import { parseBalance } from "@/lib/types";

interface EditHistory {
  instruction: string;
  timestamp: string;
  result: string;
}

export default function GeminiEditor() {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [editInstructions, setEditInstructions] = useState("");
  const [editStyle, setEditStyle] = useState("natural");
  const [editStrength, setEditStrength] = useState("moderate");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  
  // Use the new auth system
  const { user, isAuthenticated, login, logout, balance, isLoading: authLoading } = useAuth();

  // Safe balance display
  const displayBalance = parseBalance(balance);
  const geminiCost = parseFloat(process.env.NEXT_PUBLIC_GEMINI_EDITOR_COST || '10');

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setApiToken(savedToken);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCurrentImage(e.target?.result as string);
        setResultImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTokenLogin = async () => {
    if (!apiToken.trim()) {
      setError('Введите токен для авторизации');
      return;
    }

    const success = await login(apiToken);
    if (!success) {
      setError('Неверный токен авторизации');
    } else {
      setError(null);
      setShowTokenInput(false);
    }
  };

  const processImage = async () => {
    if (!currentImage || !editInstructions.trim()) return;

    if (!isAuthenticated || !user) {
      setError('Необходимо авторизоваться для редактирования изображений');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('API токен не найден. Пожалуйста, авторизуйтесь заново.');
      }

      // Check if user has enough balance
      if (displayBalance < geminiCost) {
        throw new Error('Недостаточно средств на балансе для редактирования изображения.');
      }

      // Create enhanced prompt based on style and strength
      let enhancedPrompt = editInstructions;
      
      // Add style modifiers
      switch (editStyle) {
        case 'artistic':
          enhancedPrompt += ', artistic style, creative interpretation';
          break;
        case 'professional':
          enhancedPrompt += ', professional quality, high-end result';
          break;
        case 'creative':
          enhancedPrompt += ', creative and unique approach, imaginative';
          break;
        case 'natural':
        default:
          enhancedPrompt += ', natural and realistic appearance';
          break;
      }

      // Add strength modifiers
      switch (editStrength) {
        case 'subtle':
          enhancedPrompt += ', subtle changes, minimal modification';
          break;
        case 'strong':
          enhancedPrompt += ', significant changes, bold transformation';
          break;
        case 'moderate':
        default:
          enhancedPrompt += ', moderate changes, balanced modification';
          break;
      }

      // Process image with Gemini API (now includes auth and balance deduction)
      const requestData = {
        prompt: enhancedPrompt,
        image: currentImage,
        token: token, // Send token for server-side validation
      };

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обработки изображения');
      }

      if (data.success && data.image) {
        setResultImage(data.image);
        addToHistory();
        
        // Update user balance from response
        if (data.balance !== undefined) {
          // The balance is already updated in the auth hook
          // We could trigger a refresh here if needed
        }
      } else {
        throw new Error('Не удалось получить результат обработки');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = () => {
    const newEdit: EditHistory = {
      instruction: editInstructions,
      timestamp: new Date().toLocaleString('ru-RU'),
      result: resultImage || ""
    };
    setEditHistory(prev => [newEdit, ...prev.slice(0, 9)]);
  };

  const downloadResult = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = `edited-image-${Date.now()}.jpg`;
      link.click();
    }
  };

  const resetEditor = () => {
    setCurrentImage(null);
    setResultImage(null);
    setEditInstructions("");
    setError(null);
    setEditHistory([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveApiToken = (token: string) => {
    setApiToken(token);
  };

  const clearApiToken = () => {
    setApiToken("");
    logout();
  };

  const quickActions = [
    "Удали фон с изображения",
    "Сделай изображение ярче и контрастнее", 
    "Преврати в черно-белое изображение",
    "Добавь размытие заднего плана",
    "Преврати в художественную картину",
    "Улучши качество и резкость"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gemini Редактор</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Редактирование изображений с ИИ</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Баланс: {displayBalance.toFixed(2)}</p>
                  </div>
                  <Button
                    onClick={logout}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs h-8 px-3 rounded-md"
                  >
                    Выйти
                  </Button>
                </div>
              )}
              
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Редактируйте изображения с{" "}
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              Gemini Flash
            </span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Загрузите изображение и опишите, что хотите изменить. Gemini Flash поможет вам трансформировать, улучшить или отредактировать любую фотографию.
          </p>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Авторизация</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Введите ваш API токен для доступа к системе
                  </p>
                </div>
                <Button
                  onClick={() => setShowTokenInput(!showTokenInput)}
                  className="bg-blue-500 hover:bg-blue-600 text-white h-9 px-3 rounded-md"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {showTokenInput ? 'Скрыть' : 'Войти'}
                </Button>
              </div>
            </CardHeader>
            
            {showTokenInput && (
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={apiToken}
                    onChange={(e) => saveApiToken(e.target.value)}
                    placeholder="Введите ваш API токен..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleTokenLogin()}
                  />
                  <Button
                    onClick={handleTokenLogin}
                    disabled={authLoading}
                    className="bg-green-500 hover:bg-green-600 text-white h-10 px-4 rounded-md"
                  >
                    {authLoading ? 'Проверка...' : 'Войти'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Токен проверяется на сервере и сохраняется локально для удобства
                </p>
              </CardContent>
            )}
          </Card>
        )}

        {/* Image Editor Interface */}
        <Card className="p-8 mb-8">
          <CardContent className="p-0">
            {!currentImage ? (
              /* Step 1: Image Upload */
              <div className="text-center py-16">
                <div 
                  className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-12 mb-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="text-white w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Загрузите изображение
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Нажмите для выбора файла или перетащите изображение сюда
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Поддерживаются форматы: PNG, JPG, WEBP до 10MB
                  </p>
                </div>

                {/* Quick Examples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                      <Sparkles className="text-blue-600 dark:text-blue-400 w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Улучшение качества
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Повысьте резкость, уберите шум, улучшите освещение
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
                      <Sparkles className="text-green-600 dark:text-green-400 w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Изменение стиля
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Превратите фото в арт, измените цветовую схему
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                      <Sparkles className="text-purple-600 dark:text-purple-400 w-4 h-4" />
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Удаление объектов
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Уберите ненужные элементы, очистите фон
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2: Image Editor */
              <div className="space-y-6">
                {/* Current Image Display */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Original Image */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Исходное изображение
                    </h3>
                    <div className="relative">
                      <img
                        src={currentImage}
                        alt="Original"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                      />
                      <Button
                        onClick={resetEditor}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white h-9 px-3 rounded-md"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Result Image */}
                  {resultImage && (
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Результат
                      </h3>
                      <div className="relative">
                        <img
                          src={resultImage}
                          alt="Result"
                          className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <Button
                          onClick={downloadResult}
                          className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 text-white h-9 px-3 rounded-md"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit Instructions */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Что вы хотите изменить в изображении?
                    </label>
                    <textarea
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      placeholder="Например: Удали фон, сделай изображение ярче, преврати в черно-белое, добавь солнечный свет..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Быстрые действия
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          onClick={() => setEditInstructions(action)}
                          className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs h-8 px-2 rounded-md"
                        >
                          {action.split(' ').slice(0, 2).join(' ')}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <Button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                    >
                      {showAdvanced ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                      {showAdvanced ? 'Скрыть настройки' : 'Показать настройки'}
                    </Button>
                    
                    {showAdvanced && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Стиль обработки
                          </label>
                          <select
                            value={editStyle}
                            onChange={(e) => setEditStyle(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          >
                            <option value="natural">Естественный</option>
                            <option value="artistic">Художественный</option>
                            <option value="professional">Профессиональный</option>
                            <option value="creative">Креативный</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Сила изменений
                          </label>
                          <select
                            value={editStrength}
                            onChange={(e) => setEditStrength(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          >
                            <option value="subtle">Минимальные</option>
                            <option value="moderate">Умеренные</option>
                            <option value="strong">Сильные</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Auth Warning */}
                  {!isAuthenticated && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <div className="flex items-center text-yellow-700 dark:text-yellow-300 text-sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Для редактирования изображений необходимо авторизоваться.
                      </div>
                    </div>
                  )}

                  {/* Balance Warning */}
                  {isAuthenticated && displayBalance < geminiCost && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center text-red-700 dark:text-red-300 text-sm">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Недостаточно средств на балансе для редактирования изображений. Текущий баланс: {displayBalance.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      onClick={processImage}
                      disabled={!editInstructions.trim() || loading || !isAuthenticated || displayBalance < geminiCost}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Обработка...' : 'Применить изменения'}
                    </Button>

                    <Button
                      onClick={resetEditor}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Новое изображение
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center text-red-700 dark:text-red-300 text-sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {error}
                      </div>
                    </div>
                  )}

                  {/* Processing Status */}
                  {loading && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center text-blue-700 dark:text-blue-300 text-sm">
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Gemini Flash обрабатывает изображение мгновенно...
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {resultImage && !loading && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-green-700 dark:text-green-300 text-sm">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Изображение успешно обработано!
                        </div>
                        <Button
                          onClick={downloadResult}
                          className="border border-green-300 dark:border-green-600 bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300 h-8 px-3 rounded-md"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Скачать
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Edit History */}
                {editHistory.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      История изменений
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {editHistory.map((edit, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {edit.instruction}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {edit.timestamp}
                            </p>
                          </div>
                          <Button
                            onClick={() => setEditInstructions(edit.instruction)}
                            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs h-8 px-2 rounded-md"
                          >
                            Применить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                ИИ обработка
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Современные алгоритмы Gemini Flash для высококачественного редактирования
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Понимание языка
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Описывайте изменения на русском языке простыми словами
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Мгновенная обработка
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Результат мгновенно - без ожидания и polling&apos;а, используя Gemini 2.0 Flash
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Безопасность
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Проверка баланса и списание происходит на сервере, защищено от мошенничества
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
