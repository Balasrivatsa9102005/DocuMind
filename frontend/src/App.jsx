import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  Sparkles,
  X,
  Loader2,
  Copy,
  Check,
  Zap,
  Shield,
  CheckCircle,
} from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [summaryLength, setSummaryLength] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    setError("");
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  const generateSummary = async () => {
  if (!file) {
    setError("Please select a document first.");
    return;
  }

  setLoading(true);
  setError("");
  setResult(null);
  setCopied(false);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("summary_length", summaryLength);

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/documents/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    // Read response safely first
    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Render/server returned HTML instead of JSON
      const text = await response.text();

      console.error("Non-JSON server response:", text);

      if (response.status === 429) {
        throw new Error(
          "AI service is temporarily rate-limited. Please try again in a few minutes."
        );
      }

      if (response.status >= 500) {
        throw new Error(
          "The server is temporarily unavailable. The AI service has temporarily reached its usage limit.Please try again later."
        );
      }

      throw new Error(
        "The server returned an unexpected response. Please try again."
      );
    }

    // Handle API errors returned as JSON
    if (!response.ok) {
      throw new Error(
        data?.message || "Unable to process the document.The AI service has temporarily reached its usage limit."
      );
    }

    // Successful response
    setResult(data);

  } catch (err) {
    console.error("Document processing error:", err);

    setError(
      err.message ||
      "Something went wrong while processing your document.The AI service has temporarily reached its usage limit."
    );
  } finally {
    setLoading(false);
  }
};

  const copySummary = async () => {
    if (!result?.summary) return;

    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen text-white font-sans">

      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        
        {/* Book Page Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1600&q=80")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>

        {/* Cinematic overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70"></div>
        
        {/* Subtle blue glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm px-5 py-2 rounded-full border border-blue-400/20 text-xs font-medium text-blue-200 uppercase tracking-widest mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            ai-powered document intelligence
          </div>

          {/* Main Hero Text */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight">
            <span className="block text-white">Stuck reading</span>
            <span className="block text-blue-500">
              entire document?
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed">
            Upload any PDF or DOCX file and let AI extract the key insights in seconds.
          </p>

          {/* Animated Upload Button - moves up/down with blue glow */}
          <a
            href="#upload-section"
            className="mt-10 inline-flex items-center gap-3 rounded-xl border border-blue-400/50 bg-blue-500/20 px-8 py-4 font-semibold text-blue-100 transition-all duration-300 hover:border-blue-300/70 hover:bg-blue-500/35 hover:shadow-lg hover:shadow-blue-500/30 animate-float group"
          >
            <Upload size={20} strokeWidth={1.8} className="group-hover:rotate-[-10deg] transition-transform duration-300" />
            Upload document
          </a>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 bg-gradient-to-b from-transparent via-[#020617]/20 to-[#020617]/60" />
      </section>

      <section className="relative z-10 bg-transparent px-6 py-20">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-blue-400/70 uppercase tracking-[0.2em] bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              why choose us
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 text-white">
              Don't stress out. We've got you covered.
            </h2>
            <p className="text-white/50 mt-4 text-lg max-w-2xl mx-auto">
              Transform your documents into clear, actionable insights without the headache.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="bg-black/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center hover:bg-black/60 transition-all">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Get your summary in seconds. No waiting, no delays.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center hover:bg-black/60 transition-all">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="text-emerald-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Your documents stay yours. We don't store anything.
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8 text-center hover:bg-black/60 transition-all">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-purple-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Accurate Insights</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                AI-powered extraction that actually understands context.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section id="upload-section" className="relative z-10 scroll-mt-6 bg-transparent px-6 py-16 md:py-24">

        <div className="max-w-6xl mx-auto">

          {/* Section label */}
          <div className="text-center mb-12">
            <span className="text-xs font-medium text-blue-400/70 uppercase tracking-[0.2em] bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20">
              get started
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mt-4 text-white">
              Upload your document
            </h2>
            <p className="text-white/40 mt-2 text-sm">
              Choose a file and let AI do the heavy lifting
            </p>
          </div>

          {/* Upload Card */}
          <div className="bg-slate-950/45 backdrop-blur-sm border border-blue-400/30 rounded-3xl p-6 md:p-8">

            {!file ? (
              <label
                htmlFor="file-upload"
                className="group border-2 border-dashed border-blue-400/40 bg-blue-950/25 cursor-pointer rounded-2xl p-16 flex flex-col items-center justify-center"
              >
                <div className="p-5 bg-blue-500/20 rounded-full mb-6 transition-transform duration-300 group-hover:scale-105">
                  <Upload size={40} className="text-blue-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-white/90">
                  Drop your document here
                </h3>
                <p className="text-white/40 mt-2 text-sm font-medium">
                  or click to browse
                </p>
                <p className="text-xs text-blue-100/60 mt-5 bg-blue-900/30 px-5 py-2 rounded-full border border-blue-400/25">
                  · PDF · DOCX  
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between bg-blue-950/35 rounded-2xl p-5 border border-blue-400/25">
                <div className="flex items-center gap-5">
                  <div className="p-3.5 bg-blue-500/20 rounded-2xl">
                    <FileText className="text-blue-400" size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-semibold text-white/90 text-lg">
                      {file.name}
                    </p>
                    <p className="text-sm text-white/40 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all hover:scale-105 active:scale-95"
                >
                  <X size={22} className="text-white/40 hover:text-white/80" strokeWidth={1.5} />
                </button>
              </div>
            )}

            {/* Controls */}
            {file && (
              <div className="mt-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-3 tracking-wide">
                    Summary Length
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["short", "medium", "long"].map((length) => (
                      <button
                        key={length}
                        onClick={() => setSummaryLength(length)}
                        className={`py-3.5 rounded-xl border-2 capitalize font-medium transition-all duration-150 ${
                          summaryLength === length
                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                            : "border-blue-500/20 hover:border-blue-500/40 text-white/50 hover:text-white/70 hover:bg-black/20"
                        }`}
                      >
                        {length}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateSummary}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 transition-all duration-200 rounded-xl py-4 font-semibold text-base flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={22} className="animate-spin" />
                      <span className="flex flex-col items-start text-left leading-tight">
                        <span>Your request has been received</span>
                        <span className="mt-1 text-sm font-normal text-blue-100/75">
                          Processing your document - one final moment...
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={22} />
                      <span>Generate Summary</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="mt-10 bg-black/35 backdrop-blur-sm border border-blue-400/25 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-6 pb-5 border-b border-blue-400/20">
                <div className="p-3 bg-blue-500/15 rounded-2xl">
                  <Sparkles className="text-blue-300" size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Summary
                  </h2>
                  <p className="text-sm text-blue-100/55 font-medium">
                    {result.filename}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="bg-black/30 px-4 py-1.5 rounded-full text-xs font-medium text-blue-100/60 border border-blue-400/25">
                    {summaryLength} · AI
                  </div>
                  <button
                    type="button"
                    onClick={copySummary}
                    title={copied ? "Copied" : "Copy summary"}
                    aria-label={copied ? "Summary copied" : "Copy summary"}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-400/25 bg-black/30 px-3 py-1.5 text-xs font-medium text-blue-100/70 transition hover:border-blue-300/50 hover:text-white"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="text-blue-50/80 leading-relaxed text-base bg-black/25 p-6 rounded-2xl border border-blue-400/20">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-white mb-4">
                        {children}
                      </h1>
                    ),

                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-white mt-6 mb-3">
                        {children}
                      </h2>
                    ),

                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-blue-300 mt-5 mb-2">
                        {children}
                      </h3>
                    ),

                    p: ({ children }) => (
                      <p className="mb-4 text-white/70">
                        {children}
                      </p>
                    ),

                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 space-y-2 mb-5 text-white/70">
                        {children}
                      </ul>
                    ),

                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 space-y-2 mb-5 text-white/70">
                        {children}
                      </ol>
                    ),

                    li: ({ children }) => (
                      <li className="pl-1">
                        {children}
                      </li>
                    ),

                    strong: ({ children }) => (
                      <strong className="text-white font-semibold">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {result.summary}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-400/20 bg-transparent">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-white">
              <FileText size={18} className="text-blue-400" />
              <span className="font-semibold tracking-wide">Document Assistant</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-blue-100/55">
              Clear, useful summaries for the documents that matter.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-blue-100/40 md:items-end">
            <span className="inline-flex items-center gap-2 uppercase tracking-[0.18em]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Thank you for using our service
            </span>
            <span>© 2026 · Document Assistant</span>
          </div>
        </div>
      </footer>

      {/* Gradient animation keyframes */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 4s ease infinite;
        }

        /* Floating animation for upload button */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          }
          50% {
            transform: translateY(-10px);
            box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
          }
        }
        .animate-float {
          animation: float 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default App;