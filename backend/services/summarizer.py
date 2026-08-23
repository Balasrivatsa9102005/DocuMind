import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

MODEL_NAME = "gemma3:4b"

# Keep chunks reasonably small for the 4096-token context
CHUNK_SIZE = 1200


def ask_ollama(prompt):
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False
        },
        timeout=600
    )

    response.raise_for_status()

    return response.json()["response"]


def split_text(text, chunk_size=CHUNK_SIZE):
    """Split document text into smaller chunks."""
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunks.append(" ".join(words[i:i + chunk_size]))

    return chunks


def summarize_chunk(chunk, length):
    instructions = {
        "short": """
Create a concise summary of this section.

Return:
- One short paragraph covering the main idea.
- 3 concise key points as bullet points.
""",

        "medium": """
Create a clear summary of this section.

Return:
- One paragraph covering the main ideas.
- 5 concise key points as bullet points.
""",

        "long": """
Create a detailed summary of this section.

Return:
- One or two paragraphs covering the major ideas and important details.
- 7 concise key points as bullet points.
"""
    }

    prompt = f"""
You are a document summarization assistant.

{instructions.get(length, instructions["medium"])}

Rules:
- Use only information present in the provided text.
- Do not invent information.
- Do not add information from outside the text.
- Preserve important facts, names, numbers, dates and conclusions.
- Do not mention that you are summarizing a section.
- Do not write headings such as "SUMMARY" or "KEY POINTS".
- Do not add unnecessary explanations.
- Use proper paragraphs and bullet points.

TEXT:

{chunk}
"""

    return ask_ollama(prompt)


def summarize_text(text, length="medium"):
    if not text or not text.strip():
        return "No text was provided."

    chunks = split_text(text)

    print(f"Document split into {len(chunks)} chunks.")

    summaries = []

    for i, chunk in enumerate(chunks):
        print(f"Summarizing chunk {i + 1}/{len(chunks)}...")

        summary = summarize_chunk(chunk, length)

        summaries.append(summary)

    # If there is only one chunk, return its summary directly
    if len(summaries) == 1:
        return summaries[0]

    combined_summaries = "\n\n".join(
        f"Section {i + 1}:\n{summary}"
        for i, summary in enumerate(summaries)
    )

    point_count = {
        "short": 3,
        "medium": 5,
        "long": 7
    }.get(length, 5)

    paragraph_instruction = {
        "short": "Write one concise paragraph.",
        "medium": "Write one or two clear paragraphs.",
        "long": "Write two or three detailed paragraphs."
    }.get(length, "Write one or two clear paragraphs.")

    final_prompt = f"""
You are a document summarization assistant.

Create the final response from the section summaries below.

The frontend already displays the heading "Summary".

Therefore, DO NOT:
- Add a "Summary" heading.
- Add a "SUMMARY:" heading.
- Add a "Key Points" heading.
- Add a "KEY POINTS:" heading.
- Say "Here is the summary".
- Mention section summaries.
- Add unnecessary commentary.

Instead, return ONLY:

1. {paragraph_instruction}
2. Then provide exactly {point_count} important points using Markdown bullet points.

Rules:
- Use only information contained in the section summaries.
- Do not invent facts.
- Do not add outside information.
- Remove repeated information.
- Preserve important facts, names, numbers, dates and conclusions.
- Keep the response clear, natural and readable.
- Use proper paragraphs.
- Use Markdown bullet points for the important points.

SECTION SUMMARIES:

{combined_summaries}
"""

    print("Generating final summary...")

    return ask_ollama(final_prompt)