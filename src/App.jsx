import React, { useState } from 'react';

export default function App() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Стан для лічильників спроб
  const [freeAttempts, setFreeAttempts] = useState(1);
  const [bonusAttempts, setBonusAttempts] = useState(0);

  // Ваша актуальна адреса бекенду на Render
  const backendUrl = "https://ai-tarot-backend-07rv.onrender.com";

  const handleGetReading = async () => {
    if (freeAttempts <= 0 && bonusAttempts <= 0) {
      setError("У вас закінчилися спроби! Запросіть друга, щоб отримати новий розклад.");
      return;
    }

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
        if (freeAttempts > 0) {
          setFreeAttempts(freeAttempts - 1);
        } else if (bonusAttempts > 0) {
          setBonusAttempts(bonusAttempts - 1);
        }
      } else {
        setError(data.detail || "Сталася помилка при отриманні розкладу");
      }
    } catch (err) {
      setError("⚠️ Не вдалося з'єднатися з сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const botUsername = "y_ai_tarot_bot"; // Вкажіть юзернейм вашого бота без знака @
    const shareUrl = `https://t.me/share/url?url=https://t.me/${botUsername}&text=Отримай%20безкоштовний%20розклад%20Таро%20від%20ШІ!`;
    
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f051d',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* СТИЛІ ТА АНІМАЦІЇ ДЛЯ ФОНОВОЇ МАГІЧНОЇ КУЛІ */}
      <style>
        {`
          @keyframes bgGlow {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
              opacity: 0.55;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
          }

          .bg-magic-ball-container {
            position: fixed;
            top: 38%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 260px;
            height: 260px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(187, 134, 252, 0.45) 0%, rgba(107, 33, 168, 0.25) 55%, rgba(15, 5, 29, 0) 75%);
            box-shadow: 0 0 90px rgba(187, 134, 252, 0.35), inset 0 0 50px rgba(229, 169, 60, 0.25);
            pointer-events: none;
            z-index: 0;
            animation: bgGlow 4s ease-in-out infinite;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .bg-magic-ball-emoji {
            font-size: 150px;
            opacity: 0.22;
            filter: blur(2px);
            user-select: none;
          }

          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(229, 169, 60, 0.2); }
            50% { box-shadow: 0 0 20px rgba(229, 169, 60, 0.6); }
            100% { box-shadow: 0 0 5px rgba(229, 169, 60, 0.2); }
          }
          
          .glow-btn:not(:disabled) {
            animation: glow 2s infinite;
          }
        `}
      </style>

      {/* МАГІЧНА КУЛЯ НА ЗАДНЬОМУ ФОНІ */}
      <div className="bg-magic-ball-container">
        <span className="bg-magic-ball-emoji">🔮</span>
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ (ЗВЕРХУ ФОНУ) */}
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        
        {/* Заголовок ТАРО */}
        <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '2px' }}>
          ТАРО
        </h1>
        <p style={{ color: '#b3a0d6', fontSize: '13px', marginBottom: '20px' }}>
          Таємниці майбутнього у картах
        </p>

        {/* Блок лічильників спроб */}
        <div style={{
          display: 'flex',
          justify: 'space-around',
          backgroundColor: '#1a0b36cc',
          backdropFilter: 'blur(8px)',
          border: '1px solid #3b1d6e',
          borderRadius: '12px',
          padding: '12px 8px',
          marginBottom: '16px'
        }}>
          <div>
            <div style={{ color: '#e5a93c', fontWeight: 'bold', fontSize: '16px' }}>{freeAttempts} (Безкоштовно)</div>
            <div style={{ color: '#8c73ab', fontSize: '11px', textTransform: 'uppercase', marginTop: '2px' }}>ПЕРША СПРОБА</div>
          </div>
          <div style={{ borderLeft: '1px solid #3b1d6e', height: '30px', margin: 'auto 0' }}></div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>{bonusAttempts}</div>
            <div style={{ color: '#8c73ab', fontSize: '11px', textTransform: 'uppercase', marginTop: '2px' }}>БОНУСИ ЗА ДРУЗІВ</div>
          </div>
        </div>

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
            backgroundColor: '#1a0b36cc',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            marginBottom: '12px',
            boxSizing: 'border-box',
            outline: 'none',
            fontSize: '15px'
          }}
        />

        {/* Кнопка розкладу */}
        <button
          className="glow-btn"
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
            marginBottom: '10px',
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? "Карти перемішуються..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {/* Кнопка запрошення друга */}
        <button
          onClick={handleShare}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #6b3ba7',
            backgroundColor: '#261247cc',
            backdropFilter: 'blur(8px)',
            color: '#d1b3ff',
            fontSize: '13px',
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          🎁 Запросити друга (+1 безкоштовний розклад)
        </button>

        {/* Повідомлення про помилку */}
        {error && (
          <p style={{ color: '#ff6b6b', fontSize: '14px', margin: '10px 0' }}>
            {error}
          </p>
        )}

        {/* Результат із картами та текстом */}
        {result && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#1e0e3ecc',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid #e5a93c40'
          }}>
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
                      boxShadow: '0 4px 15px rgba(229, 169, 60, 0.3)'
                    }}
                  />
                ))}
              </div>
            )}

            <p style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', whiteSpace: 'pre-line' }}>
              {result.reading}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
