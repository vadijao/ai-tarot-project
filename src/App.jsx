import React, { useState } from 'react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Ваша актуальна адреса бекенду на Render
  const backendUrl = "https://ai-tarot-backend-07rv.onrender.com";

  const handleGetReading = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/free-reading`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question || "Загальний розклад" }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.detail || "Сталася помилка при отриманні розкладу");
      }
    } catch (err) {
      setError("⚠️ Не вдалося з'єднатися з сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f051d', color: '#ffffff', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Заголовок ТАРО - БІЛОГО КОЛЬОРУ */}
        <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '2px' }}>
          ТАРО
        </h1>
        <p style={{ color: '#b3a0d6', fontSize: '14px', marginBottom: '24px' }}>
          Таємниці майбутнього у картах
        </p>

        {/* Поле вводу питання */}
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Введіть ваше питання..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid #4a2e80',
            backgroundColor: '#1a0b36',
            color: '#ffffff',
            marginBottom: '16px',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />

        {/* Кнопка запуску */}
        <button
          onClick={handleGetReading}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#e5a93c',
            color: '#1a0b36',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          {loading ? "Карти перемішуються..." : "ОТРИМАТИ РОЗКЛАД"}
        </button>

        {/* Повідомлення про помилку */}
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '14px', margin: '10px 0' }}>
            {error}
          </p>
        )}

        {/* Результат із картами та білим текстом */}
        {result && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#1e0e3e',
            borderRadius: '12px',
            border: '1px solid #e5a93c40'
          }}>
            
            {/* Картинки 3 карт Таро у ряд */}
            {result.cards && result.cards.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
                {result.cards.map((cardName, idx) => (
                  <img
                    key={idx}
                    src={`/cards/${cardName}`}
                    alt="Таро карта"
                    style={{
                      width: '80px',
                      height: '140px',
                      objectFit: 'cover',
                      borderRadius: '6px',
                      border: '1px solid #e5a93c',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
                    }}
                  />
                ))}
              </div>
            )}

            {/* Текст розкладу - БІЛОГО КОЛЬОРУ */}
            <p style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', whiteSpace: 'pre-line' }}>
              {result.reading}
            </p>
            
          </div>
        )}

      </div>
    </div>
  );
}
