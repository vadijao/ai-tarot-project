import React, { useState, useEffect } from 'react';
import './App.css';

const BACKEND_URL = "https://ai-tarot-backend.onrender.com";

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Тестовий баланс спроб
  const [freeAttempts, setFreeAttempts] = useState(10);
  const [bonusAttempts, setBonusAttempts] = useState(5);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handleGetReading = async () => {
    if (freeAttempts <= 0 && bonusAttempts <= 0) {
      setError("У вас закінчилися спроби!");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_URL}/free-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question || "Загальний розклад" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Помилка при отриманні розкладу");
      }

      setResult(data);

      if (freeAttempts > 0) {
        setFreeAttempts((prev) => prev - 1);
      } else if (bonusAttempts > 0) {
        setBonusAttempts((prev) => prev - 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareResult = () => {
    if (window.Telegram?.WebApp && result?.reading) {
      const shareText = `🔮 Мій розклад:\n\n${result.reading.slice(0, 250)}...`;
      window.Telegram.WebApp.switchInlineQuery(shareText, ['users', 'groups']);
    }
  };

  return (
    <div className="min-h-screen bg-[#05010d] text-white flex items-center justify-center p-4 font-sans">
      {/* Головна картка додатка */}
      <div className="w-full max-w-sm bg-[#0e0620]/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-md flex flex-col gap-4">
        
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 tracking-wider m-0">
            TARO
          </h1>
          <p className="text-[11px] text-purple-200/70 mt-1 m-0">
            Таємниці майбутнього
          </p>
        </div>

        {/* Лічильник спроб */}
        <div className="bg-[#160b30] border border-purple-900/60 rounded-xl p-3 flex justify-between text-center">
          <div className="flex-1 border-r border-purple-900/60 pr-2">
            <span className="text-sm font-bold text-amber-400">{freeAttempts} (Безкоштовно)</span>
            <div className="text-[9px] text-purple-300/60 uppercase tracking-wider mt-1">ПЕРША СПРОБА</div>
          </div>
          <div className="flex-1 pl-2">
            <span className="text-sm font-bold text-amber-400">{bonusAttempts}</span>
            <div className="text-[9px] text-purple-300/60 uppercase tracking-wider mt-1">БОНУСИ ЗА ДРУЗІВ</div>
          </div>
        </div>

        {/* Ввід питання */}
        <input
          type="text"
          placeholder="Задайте питання або залиште порожнім"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-[#160b30] border border-purple-900/60 rounded-xl p-3 text-white placeholder-purple-300/30 focus:outline-none focus:border-amber-500/50 text-xs transition"
        />

        {/* Жовта кнопка */}
        <button
          onClick={handleGetReading}
          disabled={loading}
          className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:brightness-110 active:scale-[0.98] text-black font-bold py-3.5 px-4 rounded-xl shadow-lg transition uppercase tracking-wide text-xs disabled:opacity-50"
        >
          {loading ? "ГЕНЕРУЄМО РОЗКЛАД..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {/* Реферальна кнопка */}
        <button className="w-full bg-[#160b30] border border-purple-900/60 hover:bg-[#1f0f44] text-purple-200 text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition">
          <span>🎁</span> Запросити друга (+1 безкоштовний розклад)
        </button>

        {/* Блок "Як це працює" під кнопками */}
        <div className="bg-[#160b30]/80 border border-purple-900/60 rounded-xl p-4 text-xs text-purple-200/90 space-y-2">
          <div className="font-semibold text-center text-purple-100 flex items-center justify-center gap-1.5 mb-2">
            <span>🔮</span> Як це працює?
          </div>
          <p className="flex items-start gap-2 m-0 text-[11px] leading-relaxed">
            <span className="text-amber-400">•</span>
            Задайте хвилююче питання або залиште поле порожнім для розкладу дня.
          </p>
          <p className="flex items-start gap-2 m-0 text-[11px] leading-relaxed">
            <span className="text-amber-400">•</span>
            Отримайте персональну інтерпретацію ситуації.
          </p>
          <p className="flex items-start gap-2 m-0 text-[11px] leading-relaxed">
            <span className="text-amber-400">•</span>
            Миттєво дізнайтесь розшифрування та персональну пораду.
          </p>
        </div>

        {/* Повідомлення про помилку */}
        {error && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
            <span className="text-base">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Текстовий результат */}
        {result && result.reading && (
          <div className="bg-[#160b30] border border-purple-900/80 rounded-xl p-4 mt-2 space-y-3">
            <div className="text-xs text-purple-100 leading-relaxed whitespace-pre-line">
              {result.reading}
            </div>

            <button
              onClick={handleShareResult}
              className="w-full bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/50 text-white text-xs py-2.5 rounded-lg transition flex items-center justify-center gap-2 mt-2"
            >
              <span>📲</span> Надіслати результат у чат
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
