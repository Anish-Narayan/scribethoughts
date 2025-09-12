# suicide_pipeline.py

import pandas as pd
import joblib
import re
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report


### 1. Custom Text Cleaner
class TextCleaner(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return [self.clean_text(text) for text in X]


    @staticmethod
    def clean_text(text):
        text = str(text).lower()
        text = re.sub(r"http\S+", "", text)            # Remove URLs
        text = re.sub(r"[^a-z\s]", "", text)            # Keep only letters and spaces
        text = re.sub(r"\s+", " ", text).strip()        # Normalize whitespace
        return text


### 2. Load and Prepare Dataset
df = pd.read_csv("../Suicide_Detection.csv")  # Adjust path as needed
df = df[["text", "class"]].dropna()

df["label"] = df["class"].map({
    "non-suicide": 0,
    "suicide": 1
})

X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.2, random_state=42, stratify=df["label"]
)


### 3. Build Pipeline
pipeline = Pipeline([
    ("cleaner", TextCleaner()),
    ("vectorizer", TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2)
    )),
    ("classifier", LogisticRegression(
        max_iter=500,
        class_weight="balanced"
    ))
])


### 4. Train Model
pipeline.fit(X_train, y_train)

### 5. Save Pipeline
joblib.dump(pipeline, "suicide_detection_pipeline.pkl")
print("✅ Full pipeline saved as suicide_detection_pipeline.pkl")


### 6. Evaluate
y_pred = pipeline.predict(X_test)
print("\n🧪 Evaluation:")
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred, target_names=["non-suicide", "suicide"]))


### 7. Test Custom Sentences
test_sentences = [
    "I want to die",
    "Life is good and I am happy",
    "I'm tired of everything",
    "I love spending time with my friends",
    "Nothing feels worth it anymore"
]

preds = pipeline.predict(test_sentences)
probas = pipeline.predict_proba(test_sentences)

print("\n📝 Sample Predictions:")
for text, label, prob in zip(test_sentences, preds, probas):
    confidence = prob[label]
    print(f"{text} → {'suicide' if label == 1 else 'non-suicide'} (confidence: {confidence:.2f})")
