import { useState, useEffect } from 'react';
import './App.css'; 

function App() {
  const [status, setStatus] = useState('Очікування дій...');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Ініціалізуємо Telegram Web App при завантаженні сторінки
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);
    setStatus('Створення рахунку...');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error("Не знайдено адресу бекенду (VITE_BACKEND_URL)!");
      }

      // 1. Робимо запит на наш FastAPI бекенд
      const res = await fetch(`${backendUrl}/create-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
        throw new Error(`Помилка сервера: код ${res.status}`);
      }
      
      const data = await res.json();

      // 2. Якщо бекенд повернув посилання на оплату
      if (data.invoice_link) {
        setStatus('Відкриття вікна оплати Telegram...');
        
        // Відкриваємо нативне спливаюче вікно оплати Stars у Telegram
        window.Telegram.WebApp.openInvoice(data.invoice_link, (paymentStatus) => {
          if (paymentStatus === "paid") {
            setStatus("✅ Оплата успішна! Готуємо розклад...");
            // TODO: Тут можна додати виклик функції генерації розкладу Таро
          } else if (paymentStatus === "cancelled") {
            setStatus("❌ Оплату скасовано користувачем.");
          } else if (paymentStatus === "failed") {
            setStatus("⚠️ Виникла помилка під час оплати.");
          }
        });
      } else {
        setStatus('Не вдалося отримати платіжне посилання.');
      }
    } catch (err) {
      console.error("Помилка:", err);
      setStatus(`Помилка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🔮 AI Tarot</h1>
      <p>Отримайте персональний розклад Таро за допомогою штучного інтелекту.</p>
      
      <div style={{ margin: '20px 0', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: 'black' }}>
        <p><strong>Статус:</strong> {status}</p>
      </div>

      <button 
        onClick={handlePayment} 
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: isLoading ? '#ccc' : '#0088cc',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer'
        }}
      >
        {isLoading ? "Завантаження..." : "Зробити розклад (1 ⭐️)"}
      </button>
    </div>
  );
}

export default App;
