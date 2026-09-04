import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Збереження лічильників у пам'яті пристрою
  const [readingsDone, setReadingsDone] = useState(() => {
    return parseInt(localStorage.getItem('tarot_readings_count') || '0', 10);
  });
  
  const [bonusReadings, setBonusReadings] = useState(() => {
    return parseInt(localStorage.getItem('tarot_bonus_count') || '0', 10);
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const BOT_USERNAME = "ВАШ_BOT_USERNAME"; // Вкажіть тут username вашого бота без @

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Визначення чи розклад безкоштовний
  const isFree = readingsDone === 0 || bonusReadings > 0;
  const currentCostText = isFree ? "БЕЗКОШТОВНО" : "50 ⭐️";

  // Виклик генерації розкладу
  const executeReading = async () => {
    setIsLoading(true);
    setStatus('🔮 Звертаємося до таємниць Таро...');
    setResult('');

    try {
      const res = await fetch(`${backendUrl}/free-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question || "Загальний розклад долі" })
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data.reading);
        setStatus('✨ Доля розкрита!');

        // Оновлюємо лічильники
        if (readingsDone === 0) {
          const nextReadings = 1;
          setReadingsDone(nextReadings);
          localStorage.setItem('tarot_readings_count', nextReadings.toString());
        } else if (bonusReadings > 0) {
          const nextBonus = bonusReadings - 1;
          setBonusReadings(nextBonus);
          localStorage.setItem('tarot_bonus_count', nextBonus.toString());
        }
      } else {
        throw new Error(data.detail || 'Помилка генерації');
      }
    } catch (err) {
      setStatus(`⚠️ Помилка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Головна кнопка "Зробити розклад"
  const handleTarotAction = async () => {
    if (isFree) {
      await executeReading();
    } else {
      // Платна процедура (50 зірок)
      setIsLoading(true);
      setStatus('Створення платіжного запиту...');

      try {
        const res = await fetch(`${backendUrl}/create-invoice`, { method: 'POST' });
        const data = await res.json();

        if (data.invoice_link) {
          window.Telegram.WebApp.openInvoice(data.invoice_link, async (paymentStatus) => {
            if (paymentStatus === 'paid') {
              setStatus('✅ Оплачено успішно! Генеруємо розклад...');
              await executeReading();
            } else {
              setStatus('❌ Оплату скасовано або перервано.');
              setIsLoading(false);
            }
          });
        } else {
          throw new Error('Не вдалося отримати посилання на оплату');
        }
      } catch (err) {
        setStatus(`⚠️ Помилка: ${err.message}`);
        setIsLoading(false);
      }
    }
  };

  // Поділитися з другом
  const handleInviteFriend = () => {
    const shareUrl = `https://t.me/share/url?url=https://t.me/${BOT_USERNAME}&text=Дізнайся%20свою%20долю%20безкоштовно%20у%20магічному%20AI%20Tarot!`;
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="tarot-container">
      <h1 className="magical-title">AI TAROT</h1>
      <p className="subtitle">Дізнайтеся відповіді Всесвіту</p>

      <div className="stats-card">
        <div className="stat-item">
          <span className="stat-val">{readingsDone === 0 ? "1 (Подарунок)" : "0"}</span>
          <span className="stat-lbl">Перший спроб</span>
        </div>
        <div className="stat-item">
          <span className="stat-val">{bonusReadings}</span>
          <span className="stat-lbl">Бонуси за друзів</span>
        </div>
      </div>

      <input 
        type="text" 
        className="magical-input"
        placeholder="Задайте Ваше запитання картам..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="actions-group">
        <button 
          className="btn-primary" 
          onClick={handleTarotAction} 
          disabled={isLoading}
        >
          {isLoading ? "Магія відбувається..." : `Отримати розклад (${currentCostText})`}
        </button>

        <button 
          className="btn-secondary" 
          onClick={handleInviteFriend}
        >
          🎁 Запросити друга (+1 безкоштовно)
        </button>
      </div>

      {status && <p className="status-text">{status}</p>}

      {result && (
        <div className="result-box">
          <h3>🔮 Віщування Карт:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
