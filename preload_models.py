import os
import sys

def preload_models():
    print("Pre-downloading ML models to prevent cold-start timeouts...")

    print("1/2: Downloading sentence-transformers model...")
    try:
        from sentence_transformers import SentenceTransformer
        # This will download the model weights to ~/.cache/huggingface/hub/
        model = SentenceTransformer("all-MiniLM-L6-v2")
        print("[OK] sentence-transformers model loaded successfully.")
    except Exception as e:
        print(f"Error loading sentence-transformers model: {e}")
        sys.exit(1)

    print("2/2: Downloading toxicity classifier model...")
    try:
        from transformers import pipeline
        # This will download the model weights for the toxicity classifier
        classifier = pipeline("text-classification", model="martin-ha/toxic-comment-model", truncation=True, max_length=512)
        print("[OK] toxicity model loaded successfully.")
    except Exception as e:
        print(f"Error loading toxicity model: {e}")
        sys.exit(1)

    print("3/3: Downloading bias classifier model...")
    try:
        from transformers import pipeline
        # This will download the model weights for the bias classifier
        bias_classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-3")
        print("[OK] bias model loaded successfully.")
    except Exception as e:
        print(f"Error loading bias model: {e}")
        sys.exit(1)

    print("All models successfully pre-downloaded!")

if __name__ == "__main__":
    preload_models()
