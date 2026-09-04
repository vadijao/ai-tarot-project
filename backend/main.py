import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

# ==========================================
# 1. НАЛАШТУВАННЯ CORS ДЛЯ VERCEL
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

class ReadingRequest(BaseModel):
    question: str = "Загальний розклад"

@app.get("/")
def read_root():
    return {"status": "AI Tarot Backend is running!"}

# ==========================================
# 2. БЕЗКОШТОВНИЙ РОЗКЛАД (GEMINI AI)
# ==========================================
@app.post("/free-reading")
async def free_reading(req: ReadingRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY не налаштовано на сервері")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Зроби короткий та влучний безкоштовний розклад Таро українською мовою на питання: {req.question}. Використай 1 карту."
        response = model.generate_content(prompt)
        return {"reading": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 3. ПЛАТНИЙ РОЗКЛАД (TELEGRAM STARS)
# ==========================================
@app.post("/create-invoice")
async def create_invoice():
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN відсутній у Environment Variables")

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/createInvoiceLink"
    payload = {
        "title": "Детальний розклад Таро",
        "description": "Повний деталізований розклад від ШІ на 3 карти",
        "payload": "paid_tarot_reading",
        "provider_token": "",  # Порожній рядок для Telegram Stars
        "currency": "XTR",     # Валюта Telegram Stars
        "prices": [{"label": "Розклад", "amount": 50}]
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload)
        data = res.json()
        if not data.get("ok"):
            raise HTTPException(status_code=400, detail=data.get("description", "Помилка Telegram API"))
        return {"invoice_link": data["result"]}
