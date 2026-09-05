import React, { useState } from 'react';

// Замініть на актуальну адресу вашого бекенду на Render
const BACKEND_URL = "https://ai-tarot-backend.onrender.com";

export default function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Тестовий баланс спроб
  const [freeAttempts, setFreeAttempts] = useState(10);
  const [bonusAttempts, setBonusAttempts] = useState(5);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: question || "Загальний розклад" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Помилка при отриманні розкладу");
      }

      setResult(data);

      // Списання спроб
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

  return (
    <div className="app-container style={{ padding: '20px', color: '#fff', backgroundColor: '#0d0714', minHeight: '100vh' }}">
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>TAPO AI</h1>
        <p>Таємниці майбутнього у картах</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '10px' }}>
          <div><strong>{freeAttempts}</strong> (Безкоштовно)</div>
          <div><strong>{bonusAttempts}</strong> (Бонуси)</div>
        </div>
      </header>

      <main style={{ maxWidth: '500px', margin: '0 auto' }}>
        <input
          type="text"
          placeholder="Задайте питання або залиште порожнім"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #443366',
            backgroundColor: '#1a102a',
            color: '#fff',
            marginBottom: '15px',
            boxSizing: 'border-box'
          }}
        />

        <button
          onClick={handleGetReading}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#ffb703',
            color: '#000',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? "ГЕНЕРУЄМО РОЗКЛАД..." : "ОТРИМАТИ РОЗКЛАД (БЕЗКОШТОВНО)"}
        </button>

        {error && (
          <div style={{ color: '#ff4d4d', marginTop: '15px', textAlign: 'center', wordBreak: 'break-word' }}>
            {error}
          </div>
        )}

        {/* Блок результату — відображає тільки текст */}
        {result && result.reading && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            backgroundColor: '#1a102a',
            borderRadius: '12px',
            lineHeight: '1.6',
            border: '1px solid #332244'
          }}>
            <p style={{ whiteSpace: 'pre-line' }}>{result.reading}</p>
          </div>
        )}
      </main>
    </div>
  );
}
