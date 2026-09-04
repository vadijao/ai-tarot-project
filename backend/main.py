import os
import sqlite3
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "tarot_bot.db"

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            free_readings INTEGER DEFAULT 1,
            invited_count INTEGER DEFAULT 0,
            referrer_id INTEGER
        )
    """)
    conn.commit()
    conn.close()

# Створення таблиці при запуску
init_db()

class UserInitRequest(BaseModel):
    user_id: int
    referrer_id: int | None = None

class TarotRequest(BaseModel):
    user_id: int
    user_name: str = "Шукач"
    question: str

class InvoiceRequest(BaseModel):
    user_id: int

@app.post("/api/init-user")
async def init_user(req: UserInitRequest):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT free_readings, invited_count FROM users WHERE user_id = ?", (req.user_id,))
    user = cursor.fetchone()
    
    if not user:
        # Створення нового користувача з 1 безкоштовним розкладом
        cursor.execute(
            "INSERT INTO users (user_id, free_readings, invited_count, referrer_id) VALUES (?, 1, 0, ?)",
            (req.user_id, req.referrer_id)
        )
        
        # Нараховуємо +1 розклад рефералу
        if req.referrer_id and req.referrer_id != req.user_id:
            cursor.execute(
                "UPDATE users SET free_readings = free_readings + 1, invited_count = invited_count + 1 WHERE user_id = ?",
                (req.referrer_id,)
            )
            
        conn.commit()
        cursor.execute("SELECT free_readings, invited_count FROM users WHERE user_id = ?", (req.user_id,))
        user = cursor.fetchone()

    conn.close()
    return {"free_readings": user["free_readings"], "invited_count": user["invited_count"]}

@app.post("/api/tarot-reading")
@app.post("/tarot-reading")
async def tarot_reading(req: TarotRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing")

    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT free_readings FROM users WHERE user_id = ?", (req.user_id,))
    user = cursor.fetchone()
    
    free_left = user["free_readings"] if user else 0
    
    # Списання безкоштовного розкладу
    if free_left > 0:
        cursor.execute("UPDATE users SET free_readings = free_readings - 1 WHERE user_id = ?", (req.user_id,))
        conn.commit()
        free_left -= 1

    conn.close()

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = (
            f"Ти професійний містичний таролог. Користувач {req.user_name} запитує: '{req.question}'. "
            f"Зроби коротке (2-3 абзаци), глибоке та атмосферне трактування розкладу з 3 карт українською мовою."
        )
        response = model.generate_content(prompt)
        return {
            "success": True, 
            "reading": response.text, 
            "free_readings_left": free_left
        }
    except Exception as e:
        print(f"--- ПОМИЛКА GEMINI ---: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/create-stars-invoice")
async def create_stars_invoice(req: InvoiceRequest):
    if not BOT_TOKEN:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN missing")
    
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/createInvoiceLink"
    payload = {
        "title": "Персональний розклад Таро",
        "description": "3 карти + глибоке трактування від AI",
        "payload": f"tarot_{req.user_id}",
        "currency": "XTR",
        "prices": [{"label": "1 розклад", "amount": 15}]
    }
    
    res = requests.post(url, json=payload).json()
    if res.get("ok"):
        return {"success": True, "invoice_url": res["result"]}
    
    return {"success": False, "error": res.get("description")}