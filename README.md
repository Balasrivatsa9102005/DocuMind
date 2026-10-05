# 📄 DocuMind — AI-Powered Document Intelligence & RAG Assistant

> **AI-powered document summarization and grounded question answering using React, Flask, Sentence Transformers, FAISS, Gemini, and Ollama.**

DocuMind is an AI-powered document intelligence application that helps users understand lengthy documents through **AI summarization** and **Retrieval-Augmented Generation (RAG)** based question answering.

Users can upload documents, generate summaries of different lengths, extract important key points, and ask questions about the uploaded document. For questions, DocuMind retrieves the most relevant document sections using semantic similarity and provides them to the LLM as context, helping produce more grounded and traceable answers.

---

## 📌 About the Project

Reading long documents manually can be time-consuming, especially when users only need specific information.

DocuMind provides two complementary ways to interact with a document:

* **Summarize Document** — Generate a concise AI-powered summary with important key points.
* **Ask Questions** — Ask natural-language questions and receive answers based only on relevant information retrieved from the uploaded document.

The application supports multiple AI providers:

* **Google Gemini** — used for cloud/deployed inference.
* **Ollama** — used for local development with models such as `gemma3:4b`.

The AI provider can be selected through environment variables, allowing the same application to work in both local and cloud environments.

---

# ✨ Features

### 📄 Document Processing

* Upload PDF documents
* Upload DOCX documents
* Upload PNG, JPG, and JPEG images
* OCR support for image-based documents
* Page-aware PDF text extraction
* Chunk-based processing for large documents

### 🤖 AI Summarization

* AI-powered document summarization
* Short, Medium, and Long summary lengths
* Important key-point extraction
* Multi-chunk summarization
* Final synthesis for coherent document-level summaries

### 🔎 RAG-Based Question Answering

* Ask natural-language questions about uploaded documents
* Semantic document retrieval
* Sentence Transformer embeddings
* FAISS vector similarity search
* Similarity threshold filtering
* Context-grounded LLM responses
* Source and page information for retrieved content
* Reduced hallucination through retrieval-based grounding

### 🧠 AI Provider Support

* Google Gemini API
* Ollama
* Gemma 3 4B
* Environment-based provider selection
* Local AI inference support

### 🌐 Application

* Modern responsive React interface
* Chat-style document Q&A
* Conversation history during the current session
* Source references for answers
* Document information and page metadata
* Cloud deployment support

---

# 🏗️ Architecture

```text
                         ┌────────────────────────────┐
                         │       React Frontend       │
                         │      Vite + Tailwind       │
                         │                            │
                         │  ┌──────────┐ ┌─────────┐ │
                         │  │ Summary  │ │   Q&A   │ │
                         │  └──────────┘ └─────────┘ │
                         └──────────────┬─────────────┘
                                        │
                                        │ REST API
                                        ▼
                         ┌────────────────────────────┐
                         │       Flask Backend        │
                         │          REST API          │
                         └──────────────┬─────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 │                      │                      │
                 ▼                      ▼                      ▼
        ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐
        │    Document    │    │   Summarization  │    │      RAG       │
        │   Extraction  │    │     Pipeline     │    │    Pipeline    │
        └───────┬────────┘    └────────┬─────────┘    └───────┬────────┘
                │                      │                      │
        ┌───────┴────────┐             │              ┌───────┴────────┐
        │                │             │              │                │
        ▼                ▼             ▼              ▼                ▼
     PyMuPDF        python-docx      AI Model    Sentence         FAISS
        │                │                           Transformers    Index
        │                │                              │              │
        └────────┬───────┘                              │              │
                 │                                      │              │
                 ▼                                      ▼              │
          Tesseract OCR                           Embeddings ──────────┘
                 │
                 ▼
          Extracted Text
                                                        │
                                                        ▼
                                               Relevant Chunks
                                                        │
                                                        ▼
                                                  Grounded Prompt
                                                        │
                                                        ▼
                                                  ┌───────────┐
                                                  │ LLM       │
                                                  │ Gemini /  │
                                                  │ Ollama    │
                                                  └─────┬─────┘
                                                        │
                                                        ▼
                                               Answer + Sources
```

---

# 🔄 How It Works

## 1. Upload a Document

The user uploads a supported PDF, DOCX, or image through the React frontend.

The frontend sends the file to the Flask backend using `multipart/form-data`.

---

## 2. Extract the Document Content

The backend identifies the file type and extracts its content.

| File Type    | Processing             |
| ------------ | ---------------------- |
| PDF          | PyMuPDF                |
| DOCX         | python-docx            |
| PNG/JPG/JPEG | Tesseract OCR + Pillow |

For PDFs, page numbers are preserved during extraction so retrieved information can later be traced back to the original document.

---

# 📝 Document Summarization

## 3. Split the Document into Chunks

Large documents are divided into smaller chunks before being sent to the AI model.

This helps:

* Stay within model context limits
* Process large documents
* Keep prompts manageable
* Generate summaries section by section

The application generates summaries for individual chunks and then performs a final synthesis to produce a coherent overall summary.

---

## 4. Generate AI Summaries

Each chunk is sent to the configured AI provider.

The model is instructed to:

* Use information from the document
* Avoid inventing facts
* Preserve important names, numbers, dates, and conclusions
* Follow the requested summary length
* Extract important key points

The individual chunk results are then combined into a final document summary.

---

# 🔎 Retrieval-Augmented Generation (RAG)

DocuMind also implements a RAG pipeline for document question answering.

Instead of sending the entire document to the LLM for every question, the application retrieves only the most relevant sections.

### RAG Pipeline

```text
Uploaded Document
       │
       ▼
Text Extraction
       │
       ▼
Document Chunking
       │
       ▼
Sentence Transformer
       │
       ▼
Text Embeddings
       │
       ▼
FAISS Vector Index
       │
       │
       │ User Question
       ▼
Question Embedding
       │
       ▼
Similarity Search
       │
       ▼
Similarity Threshold
       │
       ▼
Relevant Chunks
       │
       ▼
Grounded Prompt
       │
       ▼
Gemini / Ollama
       │
       ▼
Answer + Sources
```

---

## 🧠 How RAG Works in DocuMind

### 1. Document Chunking

The extracted document is divided into overlapping chunks.

The current implementation uses approximately:

* **500 words per chunk**
* **80-word overlap**

The overlap helps preserve context between neighboring chunks.

For PDFs, the page numbers associated with each chunk are preserved.

---

### 2. Generate Embeddings

Each chunk is converted into a numerical vector using:

```text
Sentence Transformers
all-MiniLM-L6-v2
```

These embeddings represent the semantic meaning of the document chunks.

---

### 3. Store Embeddings in FAISS

The generated embeddings are stored in a FAISS vector index.

The implementation uses:

```text
FAISS IndexFlatIP
```

The embeddings are normalized before indexing, so inner-product similarity corresponds to **cosine similarity**.

---

### 4. Embed the User's Question

When the user asks a question, the question is also converted into an embedding using the same Sentence Transformer model.

---

### 5. Retrieve Relevant Chunks

FAISS performs a similarity search between the question embedding and document chunk embeddings.

The application retrieves the most relevant chunks and applies a similarity threshold to filter out weakly related results.

This prevents unnecessarily unrelated content from being passed to the LLM.

---

### 6. Generate a Grounded Answer

The retrieved chunks are placed inside a controlled prompt and sent to the configured LLM.

The model is instructed to:

* Use only the retrieved document context
* Avoid outside knowledge
* Avoid inventing information
* State when the answer is unavailable
* Preserve important facts
* Use the provided source information

The final response includes source information such as:

* Source number
* Similarity score
* Page numbers for PDFs
* Retrieved text

---

# 📚 Source-Aware Answers

For PDF documents, DocuMind preserves page information throughout the RAG pipeline.

Example:

```text
Answer:
The RAG model retrieves relevant chunks using FAISS
and uses the LLM to generate an answer based on them.

Sources:
Source 1
Pages: 4, 5, 6
Similarity: 0.4343
```

This allows users to trace an answer back to the relevant portion of the uploaded document.

---

# 🛠️ Tech Stack

## Frontend

* React.js
* Vite
* Tailwind CSS
* Lucide React
* JavaScript

## Backend

* Python
* Flask
* Flask-CORS
* Gunicorn

## Document Processing

* PyMuPDF
* python-docx
* Tesseract OCR
* Pillow

## RAG

* Sentence Transformers
* `all-MiniLM-L6-v2`
* FAISS
* NumPy

## AI

* Google Gemini API
* Ollama
* Gemma 3 4B

## Deployment

* Render
* Gunicorn

## Development Tools

* Git
* GitHub
* Postman
* VS Code
* Conda

---

# 🤖 AI Provider Configuration

DocuMind supports both local and cloud AI inference.

## Local Development — Ollama

Configure:

```env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gemma3:4b
```

Make sure Ollama is installed and the model is available locally.

```bash
ollama run gemma3:4b
```

---

## Cloud Deployment — Gemini

Configure:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_supported_gemini_model
```

The Gemini API key should **never be committed to GitHub**.

---

# 🔐 Environment Variables

Example `.env`:

```env
AI_PROVIDER=ollama

GEMINI_API_KEY=
GEMINI_MODEL=your_supported_gemini_model

OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gemma3:4b

CORS_ORIGINS=http://localhost:5173

HOST=127.0.0.1
PORT=5000
FLASK_DEBUG=false
```

For production, configure environment variables through the hosting provider rather than committing `.env`.

---

# 📁 Project Structure

```text
DocuMind/
│
├── backend/
│   ├── app.py
│   │
│   ├── routes/
│   │   └── document_routes.py
│   │
│   └── services/
│       ├── document_extractor.py
│       ├── pdf_extractor.py
│       ├── summarizer.py
│       └── rag_service.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

> File and folder names may vary slightly depending on the final repository structure.

---

# ⚙️ Backend Setup

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Create and activate a Python environment:

```bash
conda create -n docsum python=3.12
conda activate docsum
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file and configure the required environment variables.

Start the Flask backend:

```bash
python backend/app.py
```

For production-style execution:

```bash
gunicorn backend.app:app
```

If the Render service uses the backend directory as its working directory:

```bash
gunicorn app:app
```

---

# 💻 Frontend Setup

Move into the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a frontend environment file:

```env
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

For production, configure `VITE_API_BASE_URL` with the deployed Flask backend URL.

---

# 🔌 API Endpoints

## Health Check

```http
GET /api/health
```

Example response:

```json
{
  "status": "success",
  "message": "Document Summary Assistant backend is running"
}
```

---

## Document Upload

```http
POST /api/documents/upload
```

Form data:

```text
file=<document>
summary_length=short|medium|long
```

The endpoint:

1. Receives the document
2. Extracts its content
3. Generates the document summary
4. Creates the RAG vector index
5. Returns the document ID and summary information

---

## Ask a Question

```http
POST /api/documents/question
```

Example request:

```json
{
  "document_id": "document-id",
  "question": "What is the main purpose of the proposed system?"
}
```

The backend:

1. Converts the question into an embedding
2. Searches the FAISS index
3. Retrieves relevant chunks
4. Applies the similarity threshold
5. Builds a grounded prompt
6. Sends the retrieved context to the LLM
7. Returns the answer and sources

Example response structure:

```json
{
  "answer": "The proposed system aims to...",
  "sources": [
    {
      "source": "Source 1",
      "similarity": 0.4343,
      "pages": [4, 5, 6],
      "text": "Relevant document content..."
    }
  ]
}
```

---

# 📊 Summary Lengths

| Length | Output                          |
| ------ | ------------------------------- |
| Short  | Concise summary + 3 key points  |
| Medium | Clear summary + 5 key points    |
| Long   | Detailed summary + 7 key points |

The selected summary length is sent from the frontend to the backend during document processing.

---

# 🌐 Multilingual Documents

DocuMind can process multilingual content when the underlying OCR, document extraction tools, and configured AI model support the language.

For example, a Telugu document image can be processed using OCR and subsequently passed to the AI provider for summarization.

OCR quality depends on:

* Image quality
* Text clarity
* Installed Tesseract language data
* Document layout

---

# 🧠 Key Design Decisions

## Why use RAG?

Sending an entire document to an LLM for every question can be inefficient and may exceed the model's context limits.

RAG allows the application to retrieve only the most relevant sections before generating an answer.

This provides:

* More relevant context
* Lower unnecessary context usage
* Better grounding
* Source traceability
* Reduced hallucination risk

---

## Why use Sentence Transformers?

Sentence Transformers converts text into semantic embeddings.

This allows the application to compare the meaning of the user's question with document chunks rather than relying only on exact keyword matching.

---

## Why use FAISS?

FAISS provides efficient vector similarity search.

It allows DocuMind to quickly identify document chunks that are semantically similar to the user's question.

The current implementation uses an in-memory FAISS index for the document session.

---

## Why use a Similarity Threshold?

Not every retrieved chunk is necessarily relevant enough to answer the question.

A similarity threshold filters weak matches before they are passed to the LLM.

This helps reduce irrelevant context and lowers the chance of unsupported responses.

---

## Why preserve page numbers?

Page metadata makes answers more traceable.

Instead of simply returning generated text, the application can tell the user where the retrieved information came from in the original PDF.

---

## Why support both Ollama and Gemini?

Ollama provides a local-development option where documents can be processed locally.

Gemini provides a practical cloud-based option for deployment.

The provider abstraction allows the same summarization and RAG pipeline to work with either provider.

---

## Why implement RAG directly?

The RAG pipeline was implemented directly using Sentence Transformers and FAISS rather than hiding the retrieval process behind a framework.

This makes the core workflow explicit:

```text
Chunking
   ↓
Embedding
   ↓
Vector Index
   ↓
Similarity Search
   ↓
Retrieval
   ↓
Prompt Construction
   ↓
LLM Generation
```

---

# ⚠️ Current Limitations

* FAISS indexes are currently stored in memory
* Restarting the backend removes active document indexes
* Current chunking is primarily word-based
* Advanced table/layout extraction is limited
* OCR quality depends on image quality and language configuration
* Authentication and persistent user document history are not implemented
* Retrieval currently uses dense vector similarity without a separate reranking stage

---

# 🚧 Future Improvements

* Persistent vector database or persistent FAISS indexes
* Token-aware chunking
* Hybrid keyword + semantic search
* Reranking of retrieved chunks
* Streaming AI responses
* Table and layout-aware PDF extraction
* Improved OCR preprocessing
* Authentication and user accounts
* Persistent document and conversation history
* Download summaries as PDF/DOCX
* Background processing for very large documents
* Improved multilingual OCR support
* Rate limiting and production monitoring
* Evaluation framework for retrieval quality and answer faithfulness

---

# 🌍 Deployment

The Flask backend can be deployed using **Render** with Gunicorn as the production WSGI server.

The deployed environment uses Gemini for AI inference because Ollama requires a locally running model and is not intended for this cloud deployment configuration.

Typical deployment architecture:

```text
User
 │
 ▼
React Frontend
 │
 │ HTTPS
 ▼
Flask Backend
 │
 ├── Document Extraction
 │
 ├── RAG Retrieval
 │
 └── Gemini API
       │
       ▼
    AI Response
```

---

# 🔒 Security

Sensitive configuration is intentionally kept outside the source code.

The following should never be committed:

```text
.env
API keys
Private credentials
Secret tokens
```

Use `.env.example` to document required configuration without exposing actual secrets.

Example:

```env
AI_PROVIDER=

GEMINI_API_KEY=
GEMINI_MODEL=

OLLAMA_URL=
OLLAMA_MODEL=

CORS_ORIGINS=
```

---

# 👨‍💻 Author

**Bala Srivatsa Panigrahi**

B.Tech — Computer Science and Engineering (AI & ML)

VIT-AP University

---

# ⭐ Project Goal

The goal of DocuMind is simple:

> **Turn long documents into useful information and let users ask questions about their documents without having to search through every page manually.**

The project combines:

* Modern frontend development
* Backend REST APIs
* Document processing
* OCR
* Generative AI
* Semantic embeddings
* Vector databases/search
* Retrieval-Augmented Generation
* Source-aware question answering

---

# 📜 License

This project is intended for educational and project-development purposes.
