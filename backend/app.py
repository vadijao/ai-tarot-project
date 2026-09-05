import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

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

    models_to_try = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"]
    
    async with httpx.AsyncClient() as client:
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{
                    "parts": [{"text": f"Зроби короткий та влучний розклад Таро українською мовою на питання: {req.question}."}]
                }]
            }
            
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"reading": text}
            except Exception:
                continue

    raise HTTPException(status_code=500, detail="Не вдалося отримати відповідь від Gemini API. Перевірте GEMINI_API_KEY у Render.")
