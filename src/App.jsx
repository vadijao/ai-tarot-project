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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Головна картка додатка */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'rgba(14, 6, 32, 0.88)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 20px 30px rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box'
      }}>
        
        {/* Заголовок */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            margin: 0,
            fontSize: '32px',
            fontFamily: 'serif',
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '2px'
          }}>
            TARO
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'rgba(233, 213, 255, 0.7)' }}>
            Таємниці майбутнього
          </p>
        </div>

        {/* Лічильник спроб */}
        <div style={{
          backgroundColor: '#160b30',
          border: '1px solid rgba(88, 28, 135, 0.6)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          textAlign: 'center'
        }}>
          <div style={{ flex: 1, borderRight: '1px solid rgba(88, 28, 135, 0.6)', paddingRight: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24' }}>{freeAttempts} (Безкоштовно)</span>
            <div style={{ fontSize: '9px', color: 'rgba(216, 180, 254, 0.6)', textTransform: 'uppercase', marginTop: '4px' }}>ПЕРША СПРОБА</div>
          </div>
          <div style={{ flex: 1, paddingLeft: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fbbf24' }}>{bonusAttempts}</span>
            <div style={{ fontSize: '9px', color: 'rgba(216, 180, 254, 0.6)', textTransform: 'uppercase', marginTop: '4px' }}>БОНУСИ ЗА ДРУЗІВ</div>
          </div>
        </div>

        {/* Ввід питання */}
        <input
          type="text"
          placeholder="Задайте питання або залиште порожнім"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#160b30',
            border: '1px solid rgba(88, 28, 135, 0.6)',
            borderRadius: '12px',
            padding: '12px 14px',
            color: '#fff',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {/* Жовта кнопка */}
        <button
          onClick={handleGetReading}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
            border: 'none',
            color: '#000',
            fontWeight: 'bold',
            padding: '14px',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {loading ? "ГЕНЕРУЄМО РОЗКЛАД..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {/* Реферальна кнопка */}
        <button style={{
          width: '100%',
          backgroundColor: '#160b30',
          border: '1px solid rgba(88, 28, 135, 0.6)',
          color: '#e9d5ff',
          fontSize: '12px',
          padding: '12px',
          borderRadius: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>🎁</span> Запросити друга (+1 безкоштовний розклад)
        </button>

        {/* Блок "Як це працює" */}
        <div style={{
          backgroundColor: 'rgba(22, 11, 48, 0.8)',
          border: '1px solid rgba(88, 28, 135, 0.6)',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '11px',
          color: 'rgba(233, 213, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
            🔮 Як це працює?
          </div>
          <p style={{ margin: 0, lineHeight: '1.4', display: 'flex', gap: '6px' }}>
            <span style={{ color: '#fbbf24' }}>•</span>
            Задайте хвилююче питання або залиште поле порожнім для розкладу дня.
          </p>
          <p style={{ margin: 0, lineHeight: '1.4', display: 'flex', gap: '6px' }}>
            <span style={{ color: '#fbbf24' }}>•</span>
            Отримайте персональну інтерпретацію вашої ситуації.
          </p>
          <p style={{ margin: 0, lineHeight: '1.4', display: 'flex', gap: '6px' }}>
            <span style={{ color: '#fbbf24' }}>•</span>
            Миттєво дізнайтесь розшифрування та персональну пораду.
          </p>
        </div>

        {/* Повідомлення про помилку */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fcd34d',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '12px',
            lineHeight: '1.4'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Результат розкладу */}
        {result && result.reading && (
          <div style={{
            backgroundColor: '#160b30',
            border: '1px solid rgba(126, 34, 206, 0.8)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '12px', color: '#f3e8ff', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {result.reading}
            </div>

            <button
              onClick={handleShareResult}
              style={{
                width: '100%',
                backgroundColor: 'rgba(88, 28, 135, 0.6)',
                border: '1px solid rgba(126, 34, 206, 0.5)',
                color: '#fff',
                fontSize: '12px',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              📲 Надіслати результат у чат
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
