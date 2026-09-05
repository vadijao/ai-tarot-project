import React, { useState, useEffect } from 'react';
import './App.css'; // ВАЖЛИВО: Цей рядок повертає ваш задній фон та глобальні налаштування!

const BACKEND_URL = "https://ai-tarot-backend.onrender.com";

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Баланс для тестування
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
    <div className="app-container" style={{ minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* ШАПКА */}
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '28px', letterSpacing: '2px' }}>TAPO</h1>
        <p style={{ margin: '5px 0 15px 0', fontSize: '12px', color: '#b39ddb' }}>Таємниці майбутнього у картах</p>

        {/* Лічильники */}
        <div style={{ display: 'flex', backgroundColor: 'rgba(20, 10, 40, 0.8)', border: '1px solid #4a148c', borderRadius: '10px', padding: '10px' }}>
          <div style={{ flex: 1, borderRight: '1px solid #4a148c' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{freeAttempts}</div>
            <div style={{ fontSize: '10px', color: '#9575cd', marginTop: '4px' }}>1 (Безкоштовно)<br/>ПЕРША СПРОБА</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{bonusAttempts}</div>
            <div style={{ fontSize: '10px', color: '#9575cd', marginTop: '4px' }}>0<br/>БОНУСИ ЗА ДРУЗІВ</div>
          </div>
        </div>
      </header>

      {/* ОСНОВНА ЧАСТИНА */}
      <main style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Поле вводу */}
        <input
          type="text"
          placeholder="Задайте хвилююче питання або залиште поле порожнім для розкладу дня"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #4a148c',
            backgroundColor: 'rgba(20, 10, 40, 0.8)', color: '#fff', boxSizing: 'border-box', outline: 'none'
          }}
        />

        {/* Жовта кнопка */}
        <button
          onClick={handleGetReading}
          disabled={loading}
          style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            backgroundColor: '#ffca28', color: '#000', fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "ГЕНЕРУЄМО РОЗКЛАД..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {/* Кнопка запрошення */}
        <button style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #4a148c',
            backgroundColor: 'transparent', color: '#b39ddb', fontSize: '13px', cursor: 'pointer'
        }}>
          🎁 Запросити друга (+1 безкоштовний розклад)
        </button>

        {/* Блок "Як це працює" */}
        <div style={{
          backgroundColor: 'rgba(20, 10, 40, 0.6)', border: '1px solid #4a148c',
          borderRadius: '10px', padding: '15px', fontSize: '12px', color: '#d1c4e9', lineHeight: '1.6'
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>🔮 Як це працює?</div>
          <ul style={{ paddingLeft: '20px', margin: '0' }}>
            <li>Задайте хвилююче питання або залиште поле порожнім для розкладу дня.</li>
            <li>Штучний інтелект зробить персональну інтерпретацію.</li>
            <li>Отримайте миттєве розшифрування та персональну пораду.</li>
          </ul>
        </div>

        {/* Виведення помилки */}
        {error && (
          <div style={{ color: '#ef5350', textAlign: 'center', fontSize: '13px', padding: '10px' }}>
            {error}
          </div>
        )}

        {/* Блок з ТЕКСТОМ РОЗКЛАДУ (Без карт) */}
        {result && result.reading && (
          <div style={{
            backgroundColor: 'rgba(20, 10, 40, 0.9)', border: '1px solid #4a148c',
            borderRadius: '10px', padding: '20px', marginTop: '10px'
          }}>
            {/* Текст розкладу */}
            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#fff', whiteSpace: 'pre-wrap' }}>
              {result.reading}
            </div>

            {/* Заклик поділитися */}
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#b39ddb', fontStyle: 'italic', margin: '20px 0 15px 0', borderTop: '1px solid #4a148c', paddingTop: '15px' }}>
              ✨ Надішли цей розклад подрузі, щоб дізнатися її карту дня!
            </div>

            {/* Кнопка Share */}
            <button
              onClick={handleShareResult}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                backgroundColor: '#6a1b9a', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              📲 Надіслати результат у чат
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
       
