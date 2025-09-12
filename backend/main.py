from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_headers=["*"],
)

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")

class JournalEntry(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_journal(entry: JournalEntry):
    text = entry.text

    summary = summarizer(text, max_length=50, min_length=10, do_sample=False)[0]['summary_text']
    emotion = emotion_model(text)[0]['label']

    return {
        "summary": summary,
        "emotion": emotion
    }
