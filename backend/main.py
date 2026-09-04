import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

# Ініціалізація додатку FastAPI
app = FastAPI()

# ==========================================
# 1. НАЛАШТУВАННЯ CORS (ОБОВ'ЯЗКОВО ДЛЯ VERCEL)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Дозволяє запити з будь-яких доменів (можна вказати ваш Vercel URL)
    allow_credentials=True,
    allow_methods=["*"],  # Дозволяє всі методи (GET, POST, OPTIONS тощо)
    allow_headers=["*"],  # Дозволяє будь-які заголовки
)

# Отримання змінних середовища (Render)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Налаштування Gemini AI
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ==========================================
# 2. МОДЕЛІ ДАНИХ (Pydantic)
# ==========================================
class InvoiceRequest(BaseModel):
    chat_id: int
    # Можете додати інші поля за потреби

# ==========================================
# 3. ЕНДПОІНТИ (РОУТИ)
# ==========================================

@app.get("/")
def read_root():
    return {"status": "AI Tarot Backend is running!"}

# Ендпоінт для створення рахунку в Telegram (Stars)
@app.post("/create-invoice")
async def create_invoice(req: InvoiceRequest):
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is missing")

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendInvoice"
    
    # Спеціальні налаштування для Telegram Stars
    payload = {
        "chat_id": req.chat_id,
        "title": "Розклад Таро",
        "description": "Оплата за індивідуальний розклад від ШІ",
        "payload": "tarot_payment",  # Внутрішній ідентифікатор платежу
        "provider_token": "",        # ДЛЯ ЗІРОК (STARS) МАЄ БУТИ ПОРОЖНІМ!
        "currency": "XTR",           # Валюта Telegram Stars
        "prices": [{"label": "Розклад", "amount": 1}] # 1 зірка = 1 XTR
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        data = response.json()
        
        if not data.get("ok"):
            print(f"Помилка Telegram API: {data}")
            raise HTTPException(status_code=400, detail=data.get("description", "Payment error"))
            
        return {"status": "success", "result": data["result"]}

# Тут можете додати ваш ендпоінт для Gemini AI (/tarot-reading тощо)
