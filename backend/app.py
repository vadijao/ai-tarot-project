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
@app.post("/")
def read_root():
    return {"status": "AI Tarot Backend is running!"}

@app.post("/free-reading")
async def free_reading(req: ReadingRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY відсутній у Render Environment")
    
    # Перелік актуальних моделей Gemini для автоматичної перевірки
    available_models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
    
    last_error = None
    for model_name in available_models:
        try:
            model = genai.GenerativeModel(model_name)
            prompt = f"Зроби короткий та влучний розклад Таро українською мовою на питання: {req.question}."
            response = model.generate_content(prompt)
            if response and response.text:
                return {"reading": response.text}
        except Exception as e:
            last_error = e
            continue

    raise HTTPException(status_code=500, detail=f"Помилка Gemini API: {str(last_error)}")
