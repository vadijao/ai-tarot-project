import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  // Безкоштовний розклад
  const handleFreeReading = async () => {
    setIsLoading(true);
    setStatus('Генеруємо безкоштовний розклад...');
    setResult('');

    try {
      const res = await fetch(`${backendUrl}/free-reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question || "Розклад дня" })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.reading);
        setStatus('✅ Безкоштовний розклад готовий!');
      } else {
        throw new Error(data.detail || 'Помилка сервера');
      }
    } catch (err) {
      setStatus(`Помилка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Платний розклад через Stars
  const handlePaidReading = async () => {
    setIsLoading(true);
    setStatus('Створення рахунку...');

    try {
      const res = await fetch(`${backendUrl}/create-invoice`, { method: 'POST' });
      const data = await res.json();

      if (data.invoice_link) {
        window.Telegram.WebApp.openInvoice(data.invoice_link, (paymentStatus) => {
          if (paymentStatus === 'paid') {
            setStatus('✅ Оплачено! Генеруємо повний розклад...');
            handleFreeReading(); // Або викликайте окремий ендпоінт для детального розкладу
          } else {
            setStatus('❌ Оплату скасовано.');
            setIsLoading(false);
          }
        });
      }
    } catch (err) {
      setStatus(`Помилка: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🔮 AI Tarot</h1>
      
      <input 
        type="text" 
        placeholder="Задайте питання картам..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        style={{ width: '80%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #ccc' }}
      />

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '15px' }}>
        <button 
          onClick={handleFreeReading} 
          disabled={isLoading}
          style={{ padding: '10px 15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          Безкоштовно (1 карта)
        </button>

        <button 
          onClick={handlePaidReading} 
          disabled={isLoading}
          style={{ padding: '10px 15px', backgroundColor: '#0088cc', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          Детальний (1 ⭐️)
        </button>
      </div>

      {status && <p style={{ fontSize: '14px', color: '#555' }}>{status}</p>}
      {result && (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', textAlign: 'left', color: '#333' }}>
          {result}
        </div>
      )}
    </div>
  );
}

export default App;
