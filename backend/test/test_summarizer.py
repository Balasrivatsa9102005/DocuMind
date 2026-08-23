from services.summarizer import summarize_text


text = """
Machine learning is a branch of artificial intelligence that enables
computers to learn patterns from data and make predictions without being
explicitly programmed for every task. It is widely used in recommendation
systems, fraud detection, computer vision, natural language processing,
healthcare, and autonomous systems.
"""


print("===== SHORT SUMMARY =====")
print(summarize_text(text, "short"))

print("\n===== MEDIUM SUMMARY =====")
print(summarize_text(text, "medium"))

print("\n===== LONG SUMMARY =====")
print(summarize_text(text, "long"))