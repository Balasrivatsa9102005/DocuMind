# 📄 Document Summary Assistant

> **AI-powered document summarization using React, Flask, Gemini, and local Ollama support.**



---

## 📌 About the Project

Document Summary Assistant is an AI-powered web application that helps users quickly understand lengthy documents without reading every page manually.

Users can upload supported documents such as **PDF, DOCX, PNG, JPG, and JPEG** files. The backend extracts the document content, processes it, and generates a concise AI-powered summary along with important key points.

The application supports two AI providers:

- **Google Gemini** — used for the deployed/cloud version.
- **Ollama** — used for local development with a locally running model such as `gemma3:4b`.

The AI provider can be selected through environment variables, allowing the same codebase to work both locally and in production.

---

## ✨ Features

- 📄 Upload PDF documents
- 📝 Upload DOCX documents
- 🖼️ Upload PNG, JPG, and JPEG images
- 🔍 OCR support for image-based documents
- 🤖 AI-powered document summarization
- 📏 Three summary lengths:
  - Short
  - Medium
  - Long
- 💡 Important key-point extraction
- 🌐 Responsive modern web interface
- ⚡ Chunk-based processing for large documents
- 🔐 API keys stored through environment variables
- 🔄 Switch between Gemini and Ollama using configuration
- ☁️ Cloud deployment support
- 🏠 Local AI inference support through Ollama

---

## 🏗️ Architecture

```text
                    ┌─────────────────────────┐
                    │      React Frontend     │
                    │   Vite + Tailwind CSS   │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP POST
                                 │ Multipart Form Data
                                 ▼
                    ┌─────────────────────────┐
                    │      Flask Backend      │
                    │       REST API          │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌──────────────┐          ┌──────────────┐
             │  Extraction  │          │ AI Provider  │
             │              │          │   Selector   │
             │ PyMuPDF      │          └──────┬───────┘
             │ python-docx  │                 │
             │ Tesseract    │          ┌──────┴───────┐
             │ Pillow       │          │              │
             └──────┬───────┘          ▼              ▼
                    │              ┌────────┐    ┌──────────┐
                    │              │ Gemini │    │  Ollama  │
                    │              │  API   │    │ gemma3:4b│
                    │              └────────┘    └──────────┘
                    │
                    └──────────────► Summary
                                      +
                                  Key Points
```

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- Lucide React
- JavaScript

### Backend

- Python
- Flask
- Flask-CORS
- Gunicorn

### Document Processing

- PyMuPDF — PDF text extraction
- python-docx — DOCX text extraction
- Tesseract OCR — image text extraction
- Pillow — image processing

### AI

- Google Gemini API
- Ollama
- Gemma 3 4B

### Deployment

- Render
- Gunicorn

### Development Tools

- Git
- GitHub
- Postman
- VS Code
- Conda

---

## 🔄 How It Works

### 1. Upload a document

The user uploads a PDF, DOCX, or supported image through the React frontend.

### 2. Send the file to Flask

The frontend sends the selected file and requested summary length to the Flask API using `multipart/form-data`.

### 3. Extract the content

The backend determines the file type and extracts its content.

- PDF → PyMuPDF
- DOCX → python-docx
- Images → Tesseract OCR + Pillow

### 4. Split large documents

Large extracted text is divided into smaller chunks so that the AI model can process the document efficiently within its context limits.

### 5. Generate section summaries

Each chunk is sent to the configured AI provider.

The AI is instructed to:

- Use only information from the provided document.
- Avoid inventing facts.
- Preserve important names, numbers, dates, and conclusions.
- Generate a summary according to the selected length.
- Extract important key points.

### 6. Combine the results

When a document contains multiple chunks, the individual results are combined and sent through a final summarization step to create a coherent overall response.

### 7. Display the result

The frontend displays the generated summary and important points in a clean, readable interface.

---

## 🤖 AI Provider Configuration

The project supports both local and cloud AI inference.

### Local Development — Ollama

For local development, configure:

```env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=gemma3:4b
```

Make sure Ollama is installed and the model is available locally.

Example:

```bash
ollama run gemma3:4b
```

### Cloud Deployment — Gemini

For deployment, configure:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=your_supported_gemini_model
```

The Gemini API key should **never be committed to GitHub**.

---

## 🔐 Environment Variables

The application uses environment variables for configuration and secrets.

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

For production, set the corresponding values in the hosting provider's environment-variable settings instead of committing `.env`.

---

## 📁 Project Structure

```text
Document-Summary-Assistant/
│
├── backend/
│   ├── app.py
│   ├── routes/
│   │   └── document_routes.py
│   ├── services/
│   │   ├── document_extractor.py
│   │   └── summarizer.py
│   └── ...
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── ...
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

## ⚙️ Backend Setup

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

Create a `.env` file in the appropriate project location and configure the required variables.

Start the Flask backend:

```bash
python backend/app.py
```

For production-style execution:

```bash
gunicorn backend.app:app
```

If the Render service is configured with the backend directory as its working directory, the start command can instead be:

```bash
gunicorn app:app
```

---

## 💻 Frontend Setup

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

For production, `VITE_API_BASE_URL` should point to the deployed Flask backend URL.

---

## 🔌 API Endpoints

### Health Check

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

### Document Upload

```http
POST /api/documents/upload
```

Form data:

```text
file=<document>
summary_length=short|medium|long
```

The endpoint extracts the document content, processes it through the selected AI provider, and returns the generated result.

---

## 🌍 Deployment

The backend is deployed on **Render** and is publicly accessible through the live URL at the beginning of this README.

The deployment uses **Gunicorn** as the production WSGI server.

The cloud environment uses Gemini as the AI provider because Ollama requires a locally running model and is not intended for this deployment setup.

---

## 🔒 Security

Sensitive configuration is intentionally kept outside the source code.

The following should never be committed to GitHub:

```text
.env
API keys
private credentials
secret tokens
```

Use `.env.example` to document required environment variables without exposing actual secrets.

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

## 📊 Summary Lengths

| Length | Output |
|---|---|
| Short | Concise paragraph + 3 key points |
| Medium | Clear paragraph(s) + 5 key points |
| Long | Detailed paragraph(s) + 7 key points |

The frontend controls the selected summary length and sends it to the backend with the uploaded document.

---

## 🌐 Multilingual Documents

The application can process multilingual content when the underlying extraction/OCR and configured AI model support the language.

For example, a Telugu news image can be processed through OCR and then passed to the AI provider for summarization. OCR quality depends on the quality of the image and whether the required Tesseract language data is installed.

---

## 🧠 Design Decisions

### Why chunk the document?

Large documents can exceed an AI model's context window. Splitting the extracted text into manageable chunks allows the application to process larger documents while keeping prompts reasonably sized.

### Why support both Ollama and Gemini?

Ollama provides a convenient local-development path without sending documents to a cloud AI service. Gemini provides a practical cloud option for deployment.

The provider abstraction keeps the summarization pipeline largely independent of the selected AI service.

### Why use environment variables?

Environment variables allow development and production configurations to differ without modifying the application source code or exposing secrets.

---

## 🚧 Future Improvements

- Streaming AI responses
- Better document chunking based on tokens rather than words
- Table and layout-aware PDF extraction
- Improved OCR preprocessing
- Support for additional document formats
- Authentication and user accounts
- Summary history
- Download summaries as PDF/DOCX
- More granular key-point and topic extraction
- Background processing for very large documents
- Improved multilingual OCR support
- Rate limiting and production monitoring

---

## 👨‍💻 Author

**Bala Srivatsa Panigrahi**

B.Tech — Computer Science and Engineering (AI & ML)

VIT-AP University

---

## ⭐ Project Goal

The goal of Document Summary Assistant is simple:

> **Turn long documents into useful information without making the user fight through every page.**

Built with a combination of modern frontend development, backend APIs, document processing, OCR, and generative AI.

---

## 📜 License

This project is intended for educational and project-development purposes.

