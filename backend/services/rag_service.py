import uuid

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from services.summarizer import ask_ai


EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)


SIMILARITY_THRESHOLD = 0.40


DOCUMENT_STORES = {}


def create_chunks(text, chunk_size=500, overlap=80):
    """
    Split text into overlapping chunks.

    Returns:
        List of dictionaries containing:
        - text
        - start_word
        - end_word
    """

    words = text.split()

    if not words:
        return []

    chunks = []

    start = 0

    while start < len(words):

        end = min(start + chunk_size, len(words))

        chunk = " ".join(words[start:end])

        if chunk.strip():

            chunks.append({
                "text": chunk,
                "start_word": start,
                "end_word": end
            })

        if end >= len(words):
            break

        start = end - overlap

    return chunks


def get_chunk_pages(start_word, end_word, page_ranges):
    """
    Determine which PDF pages overlap with a chunk.

    page_ranges:
        [
            {
                "page": 1,
                "start_word": 0,
                "end_word": 450
            },
            ...
        ]
    """

    pages = []

    for page_info in page_ranges:

        page_start = page_info["start_word"]
        page_end = page_info["end_word"]

        if start_word < page_end and end_word > page_start:
            pages.append(page_info["page"])

    return pages


def create_embeddings(chunks):
    """
    Convert text chunks into numerical vectors.
    """

    texts = [
        chunk["text"]
        for chunk in chunks
    ]

    embeddings = embedding_model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    return embeddings.astype("float32")


def create_document(text, pages=None):

    raw_chunks = create_chunks(text)

    if not raw_chunks:
        raise ValueError("No text available for RAG.")

    page_ranges = []

    if pages:

        current_word_position = 0

        for page_number, page in enumerate(pages, start=1):

            page_text = page.get("text", "")
            page_number = page.get("page", page_number)

            page_word_count = len(page_text.split())

            page_ranges.append({
                "page": page_number,
                "start_word": current_word_position,
                "end_word": current_word_position + page_word_count
            })

            current_word_position += page_word_count

    chunks = []

    for chunk in raw_chunks:

        chunk_pages = []

        if page_ranges:

            chunk_pages = get_chunk_pages(
                chunk["start_word"],
                chunk["end_word"],
                page_ranges
            )

        chunks.append({
            "text": chunk["text"],
            "pages": chunk_pages
        })

    embeddings = create_embeddings(chunks)

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatIP(dimension)

    index.add(embeddings)

    document_id = str(uuid.uuid4())

    DOCUMENT_STORES[document_id] = {
        "index": index,
        "chunks": chunks
    }

    print(
        f"RAG document created: {document_id} "
        f"with {len(chunks)} chunks."
    )

    return document_id, len(chunks)


def retrieve_chunks(document_id, question, top_k=4):

    if document_id not in DOCUMENT_STORES:
        raise ValueError("Document not found or expired.")

    document = DOCUMENT_STORES[document_id]

    index = document["index"]
    chunks = document["chunks"]

    query_embedding = embedding_model.encode(
        [question],
        convert_to_numpy=True,
        normalize_embeddings=True
    ).astype("float32")

    k = min(top_k, len(chunks))

    scores, indices = index.search(
        query_embedding,
        k
    )

    results = []
    candidates = []

    for score, index_position in zip(
        scores[0],
        indices[0]
    ):

        if index_position == -1:
            continue

        score = float(score)
        chunk = chunks[index_position]

        candidates.append({
            "chunk": chunk["text"],
            "pages": chunk["pages"],
            "score": score
        })

        if score < SIMILARITY_THRESHOLD:
            continue

        results.append(candidates[-1])

    if not results and candidates:
        results.append(candidates[0])

    return results


def answer_question(document_id, question, top_k=4):

    retrieved_chunks = retrieve_chunks(
        document_id,
        question,
        top_k
    )

    if not retrieved_chunks:

        return {
            "answer": (
                "I could not find relevant information "
                "in the document."
            ),
            "sources": []
        }

    context_parts = []

    for i, result in enumerate(
        retrieved_chunks,
        start=1
    ):

        page_info = ""

        if result["pages"]:
            page_info = (
                f"Pages: {', '.join(map(str, result['pages']))}"
            )
        else:
            page_info = "Page information unavailable"

        context_parts.append(
            f"[Source {i} | {page_info}]\n"
            f"{result['chunk']}"
        )

    context = "\n\n".join(context_parts)

    prompt = f"""
You are a document question-answering assistant.

Answer the user's question using ONLY the provided
document context.

IMPORTANT RULES:

- Do not use outside knowledge.
- Do not invent facts.
- If the answer cannot be found in the provided context,
  clearly say that the information is not available
  in the document.
- Give a concise and direct answer.
- Preserve important names, numbers, dates and facts.
- Use the source information provided in the context.
- Do not mention information that is not supported by
  the provided sources.

DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}

ANSWER:
"""

    answer = ask_ai(prompt)

    sources = []

    for i, result in enumerate(
        retrieved_chunks,
        start=1
    ):

        sources.append({
            "source": f"Source {i}",
            "similarity": round(result["score"], 4),
            "pages": result["pages"],
            "text": result["chunk"]
        })

    return {
        "answer": answer,
        "sources": sources
    }