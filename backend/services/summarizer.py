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
Summarize this section briefly.

Return:
SUMMARY:
One short paragraph.

KEY POINTS:
- 3 important points
- Use concise bullet points
""",

        "medium": """
Summarize this section clearly.

Return:
SUMMARY:
One clear paragraph covering the main ideas.

KEY POINTS:
- 5 important points
- Use concise bullet points
""",

        "long": """
Summarize this section in detail.

Return:
SUMMARY:
One detailed paragraph covering the major ideas and important details.

KEY POINTS:
- 7 important points
- Use concise bullet points
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
- Do not add unnecessary explanations.

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

    # If there is only one chunk
    if len(summaries) == 1:
        return summaries[0]

    combined_summaries = "\n\n".join(
        f"Section {i + 1}:\n{summary}"
        for i, summary in enumerate(summaries)
    )

    final_prompt = f"""
You are a document summarization assistant.

Create a final summary from the section summaries below.

Return exactly this structure:

SUMMARY:

Write 1-3 clear paragraphs explaining the overall document.

KEY POINTS:

- Important point 1
- Important point 2
- Important point 3
- Important point 4
- Important point 5
- Important point 6
- Important point 7

Rules:
- Use only information contained in the section summaries.
- Do not invent facts.
- Do not add outside information.
- Remove repeated information.
- Preserve important facts, names, numbers, dates and conclusions.
- Do not mention the section summaries.
- Do not add unnecessary commentary.
- Use proper paragraphs and bullet points.
- Keep the response clear and readable.

SECTION SUMMARIES:

{combined_summaries}
"""

    print("Generating final summary...")

    return ask_ollama(final_prompt)