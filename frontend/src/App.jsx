import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  FileText,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

const exampleQuestions = [
  "What is the main objective of this document?",
  "Explain the methodology in simple terms.",
  "What are the key findings?",
];

async function readApiResponse(response) {
  const body = await response.text();

  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new Error(`The server returned an invalid response (${response.status}).`);
  }
}

function formatPages(pages) {
  if (!pages?.length) return "Page information unavailable";
  return pages.length > 1
    ? `Pages ${pages[0]}-${pages[pages.length - 1]}`
    : `Page ${pages[0]}`;
}

function SourceList({ sources }) {
  const [openSource, setOpenSource] = useState(null);

  if (!sources?.length) return null;

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <FileText size={14} />
        Sources ({sources.length})
      </div>
      <div className="space-y-2">
        {sources.map((source, index) => {
          const isOpen = openSource === index;
          return (
            <div
              key={`${source.source}-${index}`}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenSource(isOpen ? null : index)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ee] text-xs font-bold text-[#23635d]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-700">
                    {source.source || `Source ${index + 1}`}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {formatPages(source.pages)} · Similarity {Number(source.similarity).toFixed(4)}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {source.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarkdownContent({ children }) {
  return (
    <div className="prose prose-slate max-w-none text-[15px] leading-7 prose-headings:font-semibold prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-800 prose-li:text-slate-600">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}

function QuestionComposer({ value, onChange, onSubmit, loading, compact = false }) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(22,47,54,0.08)] ${compact ? "p-2" : "p-3"}`}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={compact ? 1 : 2}
        placeholder="Ask anything about this document..."
        className="max-h-32 min-h-12 w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
      />
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line</span>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          aria-label="Send question"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#23635d] text-white transition hover:bg-[#194c48] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

function DocumentHeader({ document, onChange }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#263136] bg-[#0b0f11]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#23635d] text-white shadow-sm">
            <FileText size={19} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{document.name}</p>
            <p className="text-xs text-slate-400">
              {document.pages ? `${document.pages} pages` : "Document ready"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChange}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#263136] bg-[#111519] px-3 py-2 text-xs font-bold text-slate-400 transition hover:border-[#6caea1] hover:text-[#9bd3c6]"
        >
          <Plus size={15} />
          New document
        </button>
      </div>
    </header>
  );
}

function UploadPanel({ file, onFileChange, onPrepare, loading, error }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[#263136] bg-[#111519]/90 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {!file ? (
        <label
          htmlFor="file-upload"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#8db4aa] bg-[#f6faf7] px-6 py-16 text-center transition hover:border-[#23635d] hover:bg-[#edf7f2]"
        >
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dceee8] text-[#23635d] transition group-hover:scale-105">
            <Upload size={28} />
          </span>
          <span className="text-lg font-bold text-slate-800">Upload a document</span>
          <span className="mt-2 text-sm text-slate-500">Drag and drop or browse your PDF or DOCX</span>
          <span className="mt-6 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#23635d] shadow-sm">
            PDF · DOCX
          </span>
          <input id="file-upload" type="file" accept=".pdf,.docx" onChange={onFileChange} className="hidden" />
        </label>
      ) : (
        <div className="rounded-[1.5rem] bg-[#f6faf7] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dceee8] text-[#23635d]">
              <FileText size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-slate-800">{file.name}</p>
              <p className="mt-1 text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={() => onFileChange({ target: { files: [] } })} aria-label="Remove selected file" className="text-slate-400 transition hover:text-slate-700">
              <X size={19} />
            </button>
          </div>
          <button
            type="button"
            onClick={onPrepare}
            disabled={loading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#23635d] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#194c48] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <ArrowRight size={17} />}
            {loading ? "Preparing your document..." : "Continue"}
          </button>
        </div>
      )}
      {error && <p className="px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

function ModeCard({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_12px_30px_rgba(22,47,54,0.06)] transition hover:-translate-y-0.5 hover:border-[#91b9ae] hover:shadow-[0_18px_40px_rgba(22,47,54,0.1)] disabled:cursor-wait disabled:opacity-60"
    >
      <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f0ee] text-[#23635d] transition group-hover:bg-[#23635d] group-hover:text-white">
        <Icon size={21} />
      </span>
      <span className="block text-base font-bold text-slate-800">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-slate-500">{description}</span>
      <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-[#23635d]">
        Open <ArrowRight size={14} />
      </span>
    </button>
  );
}

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
  const [file, setFile] = useState(null);
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLength, setSummaryLength] = useState("medium");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeMode, setActiveMode] = useState("home");
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadedDocument(null);
    setDocumentId("");
    setSummary("");
    setMessages([]);
    setError("");
    setActiveMode("home");
  };

  const changeDocument = () => {
    setFile(null);
    setUploadedDocument(null);
    setDocumentId("");
    setSummary("");
    setMessages([]);
    setQuestion("");
    setError("");
    setActiveMode("home");
  };

  const prepareDocument = async (targetMode = "home", force = false) => {
    if (!file) {
      setError("Choose a PDF or DOCX file first.");
      return false;
    }

    if (!force && documentId && uploadedDocument?.name === file.name) {
      setActiveMode(targetMode);
      return true;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("summary_length", summaryLength);

    try {
      const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to process this document.");
      }

      setDocumentId(data.document_id);
      setUploadedDocument({
        name: data.filename || file.name,
        pages: data.pages,
        size: file.size,
      });
      setSummary(data.summary || "");
      setMessages([]);
      setActiveMode(targetMode);
      return true;
    } catch (requestError) {
      setError(requestError.message || "Something went wrong while processing your document.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const regenerateSummary = async () => {
    setDocumentId("");
    setUploadedDocument(null);
    setMessages([]);
    await prepareDocument("summary", true);
  };

  const askQuestion = async (nextQuestion = question) => {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || !documentId || loading) return;

    setQuestion("");
    setError("");
    setActiveMode("chat");
    setMessages((current) => [...current, { role: "user", content: trimmedQuestion }]);
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/documents/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question: trimmedQuestion }),
      });
      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || "Unable to answer that question.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.answer, sources: data.sources || [] },
      ]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        { role: "error", content: requestError.message || "Something went wrong while processing your question." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copySummary = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const openMode = async (mode) => {
    if (mode === "summary" && !summary) {
      await prepareDocument("summary");
      return;
    }
    if (mode === "chat" && !documentId) {
      await prepareDocument("chat");
      return;
    }
    setActiveMode(mode);
  };

  const renderHome = () => (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-5 pb-20 pt-16 text-center lg:px-8 lg:pt-24">
      <div className="max-w-3xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b9d7cd] bg-[#e8f0ee] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#23635d]">
          <Sparkles size={13} /> Document intelligence
        </div>
        <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-slate-900 md:text-7xl">
          Read less. Understand more.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-500 md:text-lg">
          Turn dense documents into clear summaries and grounded answers, with every source kept close at hand.
        </p>
      </div>
      <div className="mt-12 w-full">
        <UploadPanel file={file} onFileChange={handleFileChange} onPrepare={() => prepareDocument("home")} loading={loading} error={error} />
      </div>
      <div className="mt-8 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
        {["PDF and DOCX", "Page-aware answers", "Private processing"].map((item, index) => (
          <div key={item} className="rounded-xl border border-slate-200/80 bg-white/55 px-4 py-3 text-center text-xs font-semibold text-slate-500">
            <span className="mr-1 text-[#23635d]">0{index + 1}</span> {item}
          </div>
        ))}
      </div>
    </main>
  );

  const renderHomeWithDocument = () => (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-10 lg:px-8 lg:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#23635d]">Document ready</p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight text-slate-900 md:text-5xl">What would you like to do?</h1>
        <p className="mt-4 text-slate-500">Choose a starting point. You can switch between summary and chat at any time.</p>
      </div>
      <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
        <ModeCard icon={Sparkles} title="Summarize document" description="Get the main ideas, important details, and key points in a readable format." onClick={() => openMode("summary")} disabled={loading} />
        <ModeCard icon={MessageCircle} title="Ask questions" description="Chat with your document and trace each answer back to its source pages." onClick={() => openMode("chat")} disabled={loading} />
      </div>
      {loading && <div className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[#23635d]"><Loader2 size={16} className="animate-spin" /> Preparing your document</div>}
      {error && <p className="mx-auto mt-5 max-w-xl text-center text-sm font-semibold text-rose-600">{error}</p>}
    </main>
  );

  const renderSummary = () => (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-8 lg:px-8">
      <div className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end">
        <div>
          <button type="button" onClick={() => setActiveMode("home")} className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-[#23635d] hover:text-[#194c48]">← Choose another action</button>
          <h1 className="font-serif text-4xl tracking-tight text-slate-900">Summary</h1>
          <p className="mt-2 text-sm text-slate-500">A concise view of {uploadedDocument.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {['short', 'medium', 'long'].map((length) => (
            <button key={length} type="button" onClick={() => setSummaryLength(length)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${summaryLength === length ? "bg-[#23635d] text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-[#23635d]"}`}>{length}</button>
          ))}
          <button type="button" onClick={regenerateSummary} disabled={loading} className="ml-1 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#23635d] hover:text-[#23635d] disabled:opacity-50"><Sparkles size={14} /> Regenerate</button>
        </div>
      </div>
      <article className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(22,47,54,0.06)] md:p-10">
        <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0ee] text-[#23635d]"><FileText size={19} /></div><div><p className="font-bold text-slate-800">{uploadedDocument.name}</p><p className="text-xs text-slate-400">{uploadedDocument.pages ? `${uploadedDocument.pages} pages` : "Document"} · {summaryLength} summary</p></div></div>
          <button type="button" onClick={copySummary} title="Copy summary" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-[#23635d] hover:text-[#23635d]">{copied ? <Check size={14} /> : <Clipboard size={14} />} {copied ? "Copied" : "Copy"}</button>
        </div>
        <MarkdownContent>{summary}</MarkdownContent>
      </article>
      <div className="mt-8 rounded-2xl border border-[#b9d7cd] bg-[#edf7f2] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#194c48]"><MessageCircle size={17} /> Ask a question about this document</div>
        <QuestionComposer value={question} onChange={setQuestion} onSubmit={() => askQuestion()} loading={loading} compact />
      </div>
    </main>
  );

  const renderChat = () => (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-6 pt-7 lg:px-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div><button type="button" onClick={() => setActiveMode("home")} className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#23635d] hover:text-[#194c48]">← Back to actions</button><h1 className="font-serif text-3xl tracking-tight text-slate-900">Document chat</h1></div>
        <button type="button" onClick={() => setMessages([])} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-[#23635d] hover:text-[#23635d]"><Plus size={14} /> New chat</button>
      </div>
      <div className="my-6 flex-1 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="flex min-h-[410px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f0ee] text-[#23635d]"><MessageCircle size={25} /></div>
            <h2 className="mt-5 font-serif text-3xl text-slate-800">Ask about your document</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">Ask about concepts, facts, methodology, or details. Answers stay grounded in the document.</p>
            <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2">{exampleQuestions.map((example) => <button key={example} type="button" onClick={() => setQuestion(example)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#91b9ae] hover:text-[#23635d]">{example}</button>)}</div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[88%] ${message.role === "user" ? "rounded-2xl rounded-br-md bg-[#23635d] px-5 py-3 text-white" : message.role === "error" ? "rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-700" : "w-full rounded-2xl rounded-bl-md border border-slate-200 bg-white px-5 py-4 shadow-sm"}`}>
                  {message.role === "assistant" && <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#23635d]">Assistant</p>}
                  <div className={message.role === "user" ? "text-sm leading-6" : ""}>{message.role === "user" ? message.content : <MarkdownContent>{message.content}</MarkdownContent>}</div>
                  {message.role === "assistant" && <SourceList sources={message.sources} />}
                </div>
              </div>
            ))}
            {loading && <div className="flex items-center gap-2 text-sm font-semibold text-slate-400"><span className="flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#23635d]" /><i className="h-1.5 w-1.5 rounded-full bg-[#23635d]" /><i className="h-1.5 w-1.5 rounded-full bg-[#23635d]" /></span> Assistant is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      <QuestionComposer value={question} onChange={setQuestion} onSubmit={() => askQuestion()} loading={loading} />
    </main>
  );

  const document = uploadedDocument || (file ? { name: file.name, pages: null } : null);

  return (
    <div className="min-h-screen bg-[#f5f7f3] text-slate-900">
      {document && <DocumentHeader document={document} onChange={changeDocument} />}
      <div className="flex min-h-[calc(100vh-73px)] flex-col">
        {!document ? renderHome() : activeMode === "home" ? renderHomeWithDocument() : activeMode === "summary" ? renderSummary() : renderChat()}
      </div>
      <footer className="border-t border-slate-200 px-5 py-5 text-center text-xs text-slate-400">Document Assistant · Focused answers for the documents that matter.</footer>
    </div>
  );
}

export default App;
