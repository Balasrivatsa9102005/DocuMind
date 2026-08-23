import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

OLLAMA_URL = os.environ["OLLAMA_URL"]
MODEL_NAME = os.environ["OLLAMA_MODEL"]

prompt = """
Summarize the following text in 3 bullet points.

Machine learning is a field of artificial intelligence that enables
computers to learn patterns from data without being explicitly programmed
for every task. It is used in applications such as recommendation systems,
fraud detection, computer vision, and natural language processing.
"""

response = requests.post(
    OLLAMA_URL,
    json={
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }
)
print("Status:", response.status_code)
print(response.json()["response"])