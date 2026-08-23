import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

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
        "model": "gemma3:4b",
        "prompt": prompt,
        "stream": False
    }
)

print("Status:", response.status_code)
print("Response:")
print(response.json()["response"])