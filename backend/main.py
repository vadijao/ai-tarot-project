import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

app = FastAPI()

# ==========================================
# ДОЗВІЛ НА CORS ДЛЯ ФРОНТЕНДУ (VERCEL)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@app.get("/")
def read_root():
    return {"status": "AI Tarot Backend is running!"}

# ==========================================
# ЕНДПОІНТ СТВОРЕННЯ РАХУНКУ (TELEGRAM STARS)
# ==========================================
@app.post("/create-invoice")
async def create_invoice():
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is missing on server")

    # Для Mini App використовуємо createInvoiceLink замість sendInvoice
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/createInvoiceLink"
    
    payload = {
        "title": "Розклад Таро",
        "description": "Оплата за індивідуальний розклад від ШІ",
        "payload": "tarot_reading_payment",
        "provider_token": "", # ОБОВ'ЯЗКОВО порожній рядок для Telegram Stars!
        "currency": "XTR",    # Валюта - зірки
        "prices": [{"label": "Розклад", "amount": 1}] # 1 зірка = 1 XTR
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        data = response.json()
        
        if not data.get("ok"):
            print(f"Помилка Telegram API: {data}")
            raise HTTPException(status_code=400, detail=data.get("description", "Error creating invoice link"))
            
        # Повертаємо готове посилання на оплату
        return {"invoice_link": data["result"]}
