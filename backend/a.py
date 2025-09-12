import os
import joblib
from text_cleaner import TextCleaner

print("Current working directory:", os.getcwd())
print("Pipeline exists:", os.path.exists("suicide_detection_pipeline.pkl"))

try:
    suicide_model = joblib.load("suicide_detection_pipeline.pkl")
    print("Model loaded successfully!")
except Exception as e:
    print("Failed to load model:", e)
