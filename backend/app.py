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

    clean_key = GEMINI_API_KEY.strip("'\" ")

    async with httpx.AsyncClient() as client:
        working_model = "gemini-1.5-flash"
        
        # Крок 1: Отримуємо доступні моделі для вашого ключа
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
            list_res = await client.get(list_url, timeout=10.0)
            if list_res.status_code == 200:
                models_data = list_res.json().get("models", [])
                for m in models_data:
                    if "generateContent" in m.get("supportedGenerationMethods", []):
                        name = m.get("name", "").replace("models/", "")
                        if "flash" in name or "pro" in name:
                            working_model = name
                            break
        except Exception:
            pass

        # Крок 2: Формуємо список варіантів запиту (v1 та v1beta)
        endpoints_to_try = [
            f"https://generativelanguage.googleapis.com/v1beta/models/{working_model}:generateContent?key={clean_key}",
            f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={clean_key}",
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={clean_key}",
        ]

        payload = {
            "contents": [{
                "parts": [{"text": f"Зроби короткий та влучний розклад Таро українською мовою на питання: {req.question}."}]
            }]
        }

        last_error = ""
        for url in endpoints_to_try:
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                data = response.json()
                if response.status_code == 200:
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"reading": text}
                else:
                    last_error = data.get("error", {}).get("message", response.text)
            except Exception as e:
                last_error = str(e)
                continue

        raise HTTPException(status_code=500, detail=f"Google API Error: {last_error}")
