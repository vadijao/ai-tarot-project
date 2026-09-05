import os
import json
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

    prompt = f"""
    Ти — досвідчений таролог. Зроби розклад з 3 карт на питання: "{req.question}".
    
    Поверни відповідь СТРOГО у форматі JSON (без маркдауну, без ```json, лише чистий JSON).
    Формат:
    {{
      "cards": ["назва_файлу1.jpg", "назва_файлу2.jpg", "назва_файлу3.jpg"],
      "reading": "Твій детальний текст розкладу українською мовою..."
    }}
    
    Для масиву "cards" вибери 3 випадкові карти, використовуючи ТІЛЬКИ назви з цього списку:
    Старші аркани: ar00.jpg, ar01.jpg, ar02.jpg, ar03.jpg, ar04.jpg, ar05.jpg, ar06.jpg, ar07.jpg, ar08.jpg, ar09.jpg, ar10.jpg, ar11.jpg, ar12.jpg, ar13.jpg, ar14.jpg, ar15.jpg, ar16.jpg, ar17.jpg, ar18.jpg, ar19.jpg, ar20.jpg, ar21.jpg
    Кубки: cu01.jpg, cu02.jpg, cu03.jpg, cu04.jpg, cu05.jpg, cu06.jpg, cu07.jpg, cu08.jpg, cu09.jpg, cu10.jpg, cu11.jpg, cu12.jpg, cu13.jpg, cu14.jpg
    Пентаклі: pe01.jpg, pe02.jpg, pe03.jpg, pe04.jpg, pe05.jpg, pe06.jpg, pe07.jpg, pe08.jpg, pe09.jpg, pe10.jpg, pe11.jpg, pe12.jpg, pe13.jpg, pe14.jpg
    Мечі: sw01.jpg, sw02.jpg, sw03.jpg, sw04.jpg, sw05.jpg, sw06.jpg, sw07.jpg, sw08.jpg, sw09.jpg, sw10.jpg, sw11.jpg, sw12.jpg, sw13.jpg, sw14.jpg
    Жезли: wa01.jpg, wa02.jpg, wa03.jpg, wa04.jpg, wa05.jpg, wa06.jpg, wa07.jpg, wa08.jpg, wa09.jpg, wa10.jpg, wa11.jpg, wa12.jpg, wa13.jpg, wa14.jpg
    """

    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    
    # Список підтримуваних моделей з явним протоколом HTTPS
    models_to_try = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"]
    last_error = ""

    async with httpx.AsyncClient() as client:
        for model_name in models_to_try:
            target_url = f"[https://generativelanguage.googleapis.com/v1beta/models/](https://generativelanguage.googleapis.com/v1beta/models/){model_name}:generateContent?key={clean_key}"
            try:
                response = await client.post(target_url, json=payload, timeout=30.0)
                if response.status_code == 200:
                    data = response.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_json = text.replace("```json", "").replace("```", "").strip()
                    return json.loads(clean_json)
                else:
                    err_detail = response.json().get("error", {}).get("message", response.text)
                    last_error = f"{model_name}: {err_detail}"
            except Exception as e:
                last_error = f"{model_name}: {str(e)}"
                continue

        raise HTTPException(status_code=500, detail=f"Google API Error: {last_error}")
