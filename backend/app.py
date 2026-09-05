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
        candidate_models = []
        
        # 1. Запитуємо перелік діючих моделей для вашого ключа
        try:
            list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={clean_key}"
            list_res = await client.get(list_url, timeout=10.0)
            if list_res.status_code == 200:
                models_data = list_res.json().get("models", [])
                for m in models_data:
                    if "generateContent" in m.get("supportedGenerationMethods", []):
                        name = m.get("name", "")
                        if name:
                            candidate_models.append(name)
        except Exception:
            pass

        # 2. Резервний список, якщо Google не повернув список
        if not candidate_models:
            candidate_models = [
                "models/gemini-1.5-flash",
                "models/gemini-1.5-flash-latest",
                "models/gemini-1.5-pro",
                "models/gemini-pro"
            ]

        payload = {
            "contents": [{
                "parts": [{"text": f"Зроби короткий та влучний розклад Таро українською мовою на питання: {req.question}."}]
            }]
        }

        last_error = ""
        # 3. Перебір тільки доступних моделей
        for model_path in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/{model_path}:generateContent?key={clean_key}"
            try:
                response = await client.post(url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"reading": text}
                else:
                    data = response.json()
                    last_error = data.get("error", {}).get("message", response.text)
            except Exception as e:
                last_error = str(e)
                continue

        raise HTTPException(status_code=500, detail=f"Google API Error: {last_error}")
