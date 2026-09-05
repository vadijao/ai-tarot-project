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
      const shareText = `🔮 Мій розклад Таро:\n\n${result.reading.slice(0, 250)}...`;
      window.Telegram.WebApp.switchInlineQuery(shareText, ['users', 'groups']);
    }
  };

  return (
    <div className="app-container min-h-screen text-white p-4 flex flex-col items-center">
      {/* Шапка */}
      <header className="text-center my-4 w-full max-w-md">
        <h1 className="text-3xl font-extrabold tracking-wider uppercase text-white m-0">TAPO</h1>
        <p className="text-xs text-purple-200/80 mt-1">Таємниці майбутнього у картах</p>

        {/* Блок лічильників */}
        <div className="flex justify-between bg-[#180f2a]/90 border border-[#3b236e] rounded-xl p-3 mt-4 text-center shadow-lg">
          <div className="flex-1 border-r border-[#3b236e]">
            <span className="text-sm font-bold text-white">{freeAttempts} (Безкоштовно)</span>
            <div className="text-[10px] text-purple-300 uppercase tracking-wider mt-1">ПЕРША СПРОБА</div>
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-white">{bonusAttempts}</span>
            <div className="text-[10px] text-purple-300 uppercase tracking-wider mt-1">БОНУСИ ЗА ДРУЗІВ</div>
          </div>
        </div>
      </header>

      {/* Основна форма */}
      <main className="w-full max-w-md flex flex-col gap-3">
        {/* Поле вводу */}
        <input
          type="text"
          placeholder="Задайте хвилююче питання або залиште поле порожнім для розкладу дня"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-3.5 bg-[#180f2a]/90 border border-[#3b236e] rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-400 text-xs transition shadow-md"
        />

        {/* Жовта кнопка */}
        <button
          onClick={handleGetReading}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-black font-bold rounded-xl shadow-lg transition uppercase tracking-wide text-xs disabled:opacity-50"
        >
          {loading ? "ГЕНЕРУЄМО РОЗКЛАД..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {/* Кнопка рефералів */}
        <button className="w-full py-3 px-4 bg-[#1e1338]/80 hover:bg-[#281a4b] border border-[#3b236e] text-purple-200 text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-md">
          <span>🎁</span> Запросити друга (+1 безкоштовний розклад)
        </button>

        {/* Інструкція */}
        <div className="bg-[#180f2a]/80 border border-[#3b236e] rounded-xl p-4 mt-1 text-xs text-purple-200/90 space-y-2 shadow-md">
          <div className="font-semibold text-center text-purple-100 flex items-center justify-center gap-1.5 mb-2">
            <span>🔮</span> Як це працює?
          </div>
          <p className="flex items-start gap-2 m-0">
            <span className="text-purple-400">•</span>
            Задайте хвилююче питання або залиште поле порожнім для розкладу дня.
          </p>
          <p className="flex items-start gap-2 m-0">
            <span className="text-purple-400">•</span>
            Штучний інтелект зробить персональну інтерпретацію.
          </p>
          <p className="flex items-start gap-2 m-0">
            <span className="text-purple-400">•</span>
            Отримайте миттєве розшифрування та персональну пораду.
          </p>
        </div>

        {/* Помилка */}
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-xs p-3.5 rounded-xl text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Текстовий результат */}
        {result && result.reading && (
          <div className="bg-[#180f2a]/95 border border-[#3b236e] rounded-xl p-5 mt-2 space-y-4 shadow-2xl">
            <div className="text-xs text-purple-100 leading-relaxed whitespace-pre-line">
              {result.reading}
            </div>

            <div className="text-center text-[11px] text-purple-300/80 italic pt-3 border-t border-[#3b236e]">
              ✨ Надішли цей розклад подрузі, щоб дізнатися її карту дня!
            </div>

            <button
              onClick={handleShareResult}
              className="w-full py-3 bg-[#3b236e] hover:bg-[#4c2d8d] text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md"
            >
              <span>📲</span> Надіслати результат у чат
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
