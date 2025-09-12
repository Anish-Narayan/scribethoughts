from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://10.121.112.7:5173"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load Models ---
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
suicide_model = pipeline("text-classification", model="vibhorag101/roberta-base-suicide-prediction-phr")

# --- Data Schema ---
class JournalEntry(BaseModel):
    text: str

# --- API Route ---
@app.post("/analyze")
async def analyze_journal(entry: JournalEntry):
    text = entry.text

    # Summarization
    summary = summarizer(text, max_length=50, min_length=10, do_sample=False)[0]["summary_text"]

    # Emotion detection
    emotion = emotion_model(text)[0]["label"]

    # Suicide/self-harm detection
    suicide_pred = suicide_model(text)[0]
    alert = True if suicide_pred["label"].lower() == "suicide" and suicide_pred["score"] > 0.7 else False

    return {
        "summary": summary,
        "emotion": emotion,
        "alert": alert
    }
