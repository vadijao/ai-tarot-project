import os
import json
import http.client
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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class ReadingRequest(BaseModel):
    question: str = "Загальний розклад"

@app.get("/")
@app.post("/")
def read_root():
    return {"status": "AI Tarot Backend is running!"}

@app.post("/free-reading")
def free_reading(req: ReadingRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY відсутній у Render Environment")

    clean_key = GEMINI_API_KEY.strip("'\" ").strip()

    if not clean_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY порожній")

    host = "generativelanguage.googleapis.com"
    candidate_models = []

    # Автоматичний пошук доступних моделей
    try:
        conn = http.client.HTTPSConnection(host, 443, timeout=8.0)
        conn.request("GET", f"/v1beta/models?key={clean_key}")
        res = conn.getresponse()
        if res.status == 200:
            data = json.loads(res.read().decode('utf-8'))
            for m in data.get("models", []):
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    name = m.get("name", "")
                    if name:
                        candidate_models.append(name)
        conn.close()
    except Exception:
        pass

    if not candidate_models:
        candidate_models = [
            "models/gemini-2.5-flash",
            "models/gemini-1.5-flash",
            "models/gemini-2.0-flash"
        ]

    # Промпт запитує лише текст розкладу
    prompt = f"Ти — досвідчений таролог. Зроби детальний, влучний та зрозумілий розклад Таро українською мовою на питання: \"{req.question}\"."

    payload_bytes = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode('utf-8')
    last_error = ""

    for model_path in candidate_models:
        try:
            conn = http.client.HTTPSConnection(host, 443, timeout=15.0)
            headers = {"Content-Type": "application/json"}
            url_path = f"/v1beta/{model_path}:generateContent?key={clean_key}"
            
            conn.request("POST", url_path, body=payload_bytes, headers=headers)
            res = conn.getresponse()
            data_str = res.read().decode('utf-8')
            conn.close()

            if res.status == 200:
                data = json.loads(data_str)
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"reading": text}
            else:
                try:
                    err_json = json.loads(data_str)
                    last_error = f"{model_path} (HTTP {res.status}): " + err_json.get("error", {}).get("message", data_str)
                except Exception:
                    last_error = f"{model_path} (HTTP {res.status}): {data_str}"
        except Exception as e:
            last_error = f"{model_path}: {str(e)}"
            continue

    raise HTTPException(status_code=500, detail=f"Google API Error: {last_error}")
