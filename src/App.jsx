import { useEffect, useState } from 'react';
import './App.css';

const BOT_USERNAME = "y_ai_tarot_bot"; // Вкажіть юзернейм вашого бота без @

function App() {
  const [userName, setUserName] = useState('Шукач');
  const [userId, setUserId] = useState(0);
  const [question, setQuestion] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [reading, setReading] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [freeReadings, setFreeReadings] = useState(0);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      const uid = user?.id || 12345;
      setUserId(uid);
      if (user?.first_name) setUserName(user.first_name);

      // Отримання реферального ID із параметрів запуску
      const startParam = tg.initDataUnsafe?.start_param;
      const referrerId = startParam ? parseInt(startParam.replace('ref_', ''), 10) : null;

      // Авторизація/Ініціалізація користувача
      fetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: uid, referrer_id: referrerId })
      })
        .then((res) => res.json())
        .then((data) => setFreeReadings(data.free_readings || 0))
        .catch((err) => console.error(err));
    }
  }, [tg]);

  const triggerHaptic = () => tg?.HapticFeedback?.impactOccurred('medium');

  const handleShare = () => {
    triggerHaptic();
    const shareUrl = `https://t.me/${BOT_USERNAME}?startapp=ref_${userId}`;
    const text = "Отримай безкоштовний штучний інтелект-розклад Таро! 🔮";
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`);
  };

  const executeReading = async () => {
    try {
      const response = await fetch('/api/tarot-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, question })
      });
      const data = await response.json();
      if (data.success) {
        setReading(data.reading);
        setFreeReadings(data.free_readings_left);
        setStep(3);
      } else {
        alert('Помилка генерації AI');
      }
    } catch {
      alert("Помилка з'єднання");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (cardIndex) => {
    if (selectedCards.includes(cardIndex) || loading) return;
    triggerHaptic();
    const newSelected = [...selectedCards, cardIndex];
    setSelectedCards(newSelected);

    if (newSelected.length === 3) {
      setLoading(true);

      // Якщо є безкоштовні розклади — виконуємо одразу
      if (freeReadings > 0) {
        await executeReading();
        return;
      }

      // Якщо безкоштовних немає — викликаємо Telegram Stars
      try {
        const invoiceRes = await fetch('/api/create-stars-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const invoiceData = await invoiceRes.json();

        if (invoiceData.success) {
          tg.openInvoice(invoiceData.invoice_url, async (status) => {
            if (status === 'paid') {
              await executeReading();
            } else {
              alert('Оплату скасовано');
              setLoading(false);
            }
          });
        } else {
          alert('Помилка підключення платіжної системи');
          setLoading(false);
        }
      } catch {
        alert('Помилка створення рахунку');
        setLoading(false);
      }
    }
  };

  return (
    <div className="tarot-container">
      <header className="header">
        <h1>🔮 Таро Оракул AI</h1>
        <p className="description">
          Персональні розклади Таро на основі штучного інтелекту. Задайте питання та довіртеся знакам Всесвіту.
        </p>
        <div className="status-bar">
          <span className="badge">🎁 Безкоштовно: <b>{freeReadings}</b></span>
          <button className="btn-share-mini" onClick={handleShare}>
            +1 розклад за друга 🔗
          </button>
        </div>
      </header>

      {step === 1 && (
        <div className="card-box">
          <label className="label">Ваше запитання до карт:</label>
          <textarea
            className="input-textarea"
            rows="3"
            placeholder="Наприклад: Що чекає мене у кар'єрі найближчим часом?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="btn-main"
            disabled={!question.trim()}
            onClick={() => { triggerHaptic(); setStep(2); }}
          >
            Розпочати ритуал ✨
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card-box">
          <p className="instruction">Засередьтеся на питанні: <i>"{question}"</i></p>
          <p className="sub-instruction">Оберіть <b>{3 - selectedCards.length}</b> карти:</p>
          <div className="cards-grid">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`tarot-card ${selectedCards.includes(idx) ? 'active' : ''}`}
                onClick={() => handleCardClick(idx)}
              >
                {selectedCards.includes(idx) ? '🔮' : '🎴'}
              </div>
            ))}
          </div>
          {loading && <p className="loading-text">Зчитуємо енергетику карт...</p>}
        </div>
      )}

      {step === 3 && (
        <div className="card-box">
          <h2>Трактування Всесвіту</h2>
          <div className="reading-text">{reading}</div>
          <button className="btn-main" onClick={() => { setQuestion(''); setSelectedCards([]); setStep(1); }}>
            Новий розклад ↺
          </button>
        </div>
      )}
    </div>
  );
}

export default App;