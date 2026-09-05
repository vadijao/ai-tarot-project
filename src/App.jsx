import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [readingsDone, setReadingsDone] = useState(() => {
    return parseInt(localStorage.getItem('tarot_done') || '0', 10);
  });
  
  const [bonusCount, setBonusCount] = useState(() => {
    return parseInt(localStorage.getItem('tarot_bonus') || '0', 10);
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://ai-tarot-backend-07zy.onrender.com";
  const BOT_USERNAME = "MyTarotBot";

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const isFree = readingsDone === 0 || bonusCount > 0;

  const fetchReading = async () => {
    setIsLoading(true);
    setStatus('🔮 Звертаємося до Всесвіту...');
    setResult('');

    try {
      const res = await fetch(`${backendUrl}/free-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question || "Загальний розклад" })
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data.reading);
        setStatus('✨ Розклад готовий!');
        if (readingsDone === 0) {
          setReadingsDone(1);
          localStorage.setItem('tarot_done', '1');
        } else if (bonusCount > 0) {
          const nextBonus = bonusCount - 1;
          setBonusCount(nextBonus);
          localStorage.setItem('tarot_bonus', nextBonus.toString());
        }
      } else {
        throw new Error(data.detail || 'Помилка');
      }
    } catch (err) {
      setStatus(`⚠️ ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (isFree) {
      await fetchReading();
    } else {
      setIsLoading(true);
      setStatus('Створення рахунку Stars...');

      try {
        const res = await fetch(`${backendUrl}/create-invoice`, { method: 'POST' });
        const data = await res.json();

        if (data.invoice_link) {
          window.Telegram.WebApp.openInvoice(data.invoice_link, async (paymentStatus) => {
            if (paymentStatus === 'paid') {
              await fetchReading();
            } else {
              setStatus('❌ Оплату скасовано.');
              setIsLoading(false);
            }
          });
        } else {
          throw new Error('Помилка генерації рахунку');
        }
      } catch (err) {
        setStatus(`⚠️ ${err.message}`);
        setIsLoading(false);
      }
    }
  };

  const handleInvite = () => {
    const link = `https://t.me/share/url?url=https://t.me/${BOT_USERNAME}&text=Отримай%20безкоштовний%20розклад%20Таро!`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(link);
    } else {
      window.open(link, '_blank');
    }
  };

  return (
    <div className="app-container">
      {/* 🔮 МАГІЧНА КУЛЯ НА ФОНІ */}
      <div className="magic-bg">
        <div className="crystal-ball"></div>
      </div>

      {/* 🃏 ОСНОВНА КАРТКА ИНТЕРФЕЙСУ */}
      <div className="tarot-card-box">
        <h1 className="title">AI TAROT</h1>
        <p className="subtitle">Таємниці майбутнього у картах</p>

        <div className="stats-grid">
          <div>
            <div className="stat-num">{readingsDone === 0 ? "1 (Безкоштовно)" : "Використано"}</div>
            <div className="stat-desc">Перша спроба</div>
          </div>
          <div>
            <div className="stat-num">{bonusCount}</div>
            <div className="stat-desc">Бонуси за друзів</div>
          </div>
        </div>

        <input 
          className="magical-input" 
          type="text" 
          placeholder="Напишіть своє запитання..." 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
        />

        <button className="btn-main" onClick={handleAction} disabled={isLoading}>
          {isLoading ? "Магія працює..." : `Отримати розклад (${isFree ? 'БЕЗКОШТОВНО' : '50 ⭐️'})`}
        </button>

        <button className="btn-share" onClick={handleInvite}>
          🎁 Запросити друга (+1 безкоштовний розклад)
        </button>

        {status && <p style={{ fontSize: '0.85rem', color: '#ffd700', marginTop: '12px', textAlign: 'center' }}>{status}</p>}
        {result && <div className="result-area"><p>{result}</p></div>}
      </div>
    </div>
  );
}

export default App;
