from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import yake
import joblib
import sys

from text_cleaner import TextCleaner  # Must import for pickle to find the class
import text_cleaner

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

suicide_model = None

@app.on_event("startup")
async def startup_event():
    global suicide_model
    sys.modules['__main__'].TextCleaner = text_cleaner.TextCleaner
    suicide_model = joblib.load("/home/anish/tailwind-init/backend/suicide_detection_pipeline.pkl")
    print("Suicide detection model loaded.")

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
emotion_model = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
kw_extractor = yake.KeywordExtractor(top=5, n=2)

class JournalEntry(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_journal(entry: JournalEntry):
    text = entry.text

    summary = summarizer(text, max_length=50, min_length=10, do_sample=False)[0]["summary_text"]
    emotion = emotion_model(text)[0]["label"]
    suicide_pred = suicide_model.predict([text])[0]
    suicide_prob = suicide_model.predict_proba([text])[0][1]
    alert = bool(suicide_pred == 1 and suicide_prob > 0.7)
    keywords_with_scores = kw_extractor.extract_keywords(text)
    keywords = [kw[0] for kw in keywords_with_scores]

    return {
        "summary": summary,
        "emotion": emotion,
        "alert": alert,
        "keywords": keywords
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
