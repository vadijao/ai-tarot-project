import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI()

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

@app.post("/free-reading")
async def free_reading(req: ReadingRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY відсутній")
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Зроби короткий, атмосферний та влучний розклад Таро українською мовою на питання: {req.question}. Використай 1-3 карти."
        response = model.generate_content(prompt)
        return {"reading": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-invoice")
async def create_invoice():
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN відсутній")

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/createInvoiceLink"
    payload = {
        "title": "Детальний розклад Таро",
        "description": "Повний магічний розклад від ШІ",
        "payload": "tarot_stars_reading",
        "provider_token": "",
        "currency": "XTR",
        "prices": [{"label": "Розклад Таро", "amount": 50}]
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload)
        data = res.json()
        if not data.get("ok"):
            raise HTTPException(status_code=400, detail=data.get("description", "Помилка API"))
        return {"invoice_link": data["result"]}
