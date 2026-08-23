import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama").lower()

OLLAMA_URL = os.getenv("OLLAMA_URL")
MODEL_NAME = os.getenv("OLLAMA_MODEL")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# Keep chunks reasonably small
CHUNK_SIZE = 1200

# Delay between Gemini requests to avoid hitting RPM limits
CHUNK_REQUEST_DELAY = 2

# Maximum number of retries for temporary Gemini errors
MAX_GEMINI_RETRIES = 4


def ask_ollama(prompt):
    if not OLLAMA_URL or not MODEL_NAME:
        raise RuntimeError(
            "OLLAMA_URL and OLLAMA_MODEL must be configured"
        )

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
        },
        timeout=600,
    )

    response.raise_for_status()

    return response.json()["response"]


def ask_gemini(prompt, max_retries=MAX_GEMINI_RETRIES):
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY must be configured")

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )

    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                headers={
                    "x-goog-api-key": GEMINI_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": prompt
                                }
                            ]
                        }
                    ]
                },
                timeout=600,
            )

            # ---------------------------------------------------------
            # Gemini rate limit / quota
            # ---------------------------------------------------------
            if response.status_code == 429:

                if attempt == max_retries - 1:
                    raise RuntimeError(
                        "Gemini API rate limit or quota has been reached. "
                        "Please wait and try again later."
                    )

                # Gemini may provide Retry-After
                retry_after = response.headers.get("Retry-After")

                if retry_after:
                    try:
                        wait_time = float(retry_after)
                    except ValueError:
                        wait_time = 10 * (2 ** attempt)
                else:
                    # 5, 10, 20, 40 seconds
                    wait_time = 5 * (2 ** attempt)

                print(
                    f"Gemini rate limit reached. "
                    f"Retrying in {wait_time:.0f} seconds "
                    f"(attempt {attempt + 1}/{max_retries})..."
                )

                time.sleep(wait_time)
                continue

            # ---------------------------------------------------------
            # Temporary server errors
            # ---------------------------------------------------------
            if response.status_code in (500, 502, 503, 504):

                if attempt == max_retries - 1:
                    raise RuntimeError(
                        f"Gemini server error ({response.status_code}). "
                        "Please try again later."
                    )

                wait_time = 5 * (2 ** attempt)

                print(
                    f"Gemini server error ({response.status_code}). "
                    f"Retrying in {wait_time} seconds..."
                )

                time.sleep(wait_time)
                continue

            # ---------------------------------------------------------
            # Other HTTP errors
            # ---------------------------------------------------------
            response.raise_for_status()

            data = response.json()

            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]

            except (KeyError, IndexError, TypeError):
                raise RuntimeError(
                    "Unexpected response received from Gemini API"
                )

        except requests.exceptions.Timeout:

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "Gemini API request timed out. Please try again."
                )

            wait_time = 5 * (2 ** attempt)

            print(
                f"Gemini request timed out. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)

        except requests.exceptions.ConnectionError:

            if attempt == max_retries - 1:
                raise RuntimeError(
                    "Could not connect to Gemini API. "
                    "Please try again later."
                )

            wait_time = 5 * (2 ** attempt)

            print(
                f"Gemini connection error. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)

        except requests.exceptions.RequestException as e:
            raise RuntimeError(
                f"Gemini API request failed: {str(e)}"
            )


def ask_ai(prompt):
    if AI_PROVIDER == "ollama":
        return ask_ollama(prompt)

    elif AI_PROVIDER == "gemini":
        return ask_gemini(prompt)

    else:
        raise ValueError(
            f"Unsupported AI_PROVIDER: {AI_PROVIDER}. "
            f"Use 'ollama' or 'gemini'."
        )


def split_text(text, chunk_size=CHUNK_SIZE):
    """Split document text into smaller chunks."""

    words = text.split()

    chunks = []

    for i in range(0, len(words), chunk_size):
        chunks.append(
            " ".join(words[i:i + chunk_size])
        )

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
""",
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

    return ask_ai(prompt)


def summarize_text(text, length="medium"):

    if not text or not text.strip():
        return "No text was provided."

    chunks = split_text(text)

    print(f"Document split into {len(chunks)} chunks.")

    summaries = []

    for i, chunk in enumerate(chunks):

        print(
            f"Summarizing chunk {i + 1}/{len(chunks)}..."
        )

        summary = summarize_chunk(chunk, length)

        summaries.append(summary)

        # Small delay between Gemini requests.
        # This helps avoid RPM rate limits.
        if (
            AI_PROVIDER == "gemini"
            and i < len(chunks) - 1
        ):
            print(
                f"Waiting {CHUNK_REQUEST_DELAY} seconds "
                "before next Gemini request..."
            )

            time.sleep(CHUNK_REQUEST_DELAY)

    # If there is only one chunk,
    # no final Gemini request is necessary.
    if len(summaries) == 1:
        return summaries[0]

    combined_summaries = "\n\n".join(
        f"Section {i + 1}:\n{summary}"
        for i, summary in enumerate(summaries)
    )

    point_count = {
        "short": 3,
        "medium": 5,
        "long": 7,
    }.get(length, 5)

    paragraph_instruction = {
        "short": "Write one concise paragraph.",
        "medium": "Write one or two clear paragraphs.",
        "long": "Write two or three detailed paragraphs.",
    }.get(
        length,
        "Write one or two clear paragraphs."
    )

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

    return ask_ai(final_prompt)