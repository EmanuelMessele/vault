import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Collection, Document } from "../types";
import api from "../lib/api";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { getUser } = useAuth();
  const user = getUser();

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    const hasPending = documents.some(
      (d) =>
        d.processing_status === "pending" ||
        d.processing_status === "processing",
    );

    if (!hasPending) return;

    const interval = setInterval(refreshDocumentStatus, 5000);
    return () => clearInterval(interval);
  }, [documents]);

  const fetchData = async () => {
    // debug
    console.log("Fetching docs for collection:", id);
    try {
      const [collectionRes, documentsRes] = await Promise.all([
        api.get<Collection>(`/collections/${id}`),
        api.get<Document[]>(`/documents?collection_id=${id}&t=${Date}`),
      ]);
      console.log("Collection ID:", id);
      console.log(
        "Documents received:",
        documentsRes.data.map((d) => ({
          file_name: d.file_name,
          collection_id: d.collection_id,
        })),
      );
      setCollection(collectionRes.data);
      setDocuments(documentsRes.data);
    } catch (err) {
      console.error("Error fetching collection data:", err);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("collection_id", id);

      const response = await api.post<Document>("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDocuments([response.data, ...documents]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: Document["processing_status"]) => {
    switch (status) {
      case "completed":
        return "text-green-400 bg-green-400/10";
      case "processing":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const deleteDocument = async (docId: string) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter((doc) => doc.id !== docId));
    } catch (err) {
      console.error("Error deleting document:", err);
    }
  };

  const refreshDocumentStatus = async () => {
    try {
      const response = await api.get<Document[]>(
        `/documents?collection_id=${id}&t=${Date.now()}`,
      );
      setDocuments(response.data);
    } catch (err) {
      console.error("Error refreshing document status:", err);
    }
  };

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !id) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setAsking(true);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/documents/ask",
        {
          query: question,
          collection_id: id,
          user_id: user?.id,
        },
      );

      const assitantMessage = {
        role: "assistant",
        content: response.data.answer,
      };
      setMessages((prev) => [...prev, assitantMessage]);
    } catch (err) {
      console.error("Error asking question:", err);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">Vault</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Collection Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">{collection?.name}</h2>
          {collection?.description && (
            <p className="text-gray-400 mt-1">{collection.description}</p>
          )}
        </div>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-800 hover:border-gray-600 rounded-2xl p-8 text-center cursor-pointer transition-colors mb-8"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />
          {uploading ? (
            <p className="text-gray-400">Uploading...</p>
          ) : (
            <>
              <p className="text-white font-medium mb-1">Upload a document</p>
              <p className="text-gray-500 text-sm">PDF, TXT, DOC up to 10MB</p>
            </>
          )}
        </div>

        {/* Documents List */}
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No documents yet. Upload your first document above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📄</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{doc.file_name}</p>
                    <p className="text-gray-500 text-sm">
                      {formatFileSize(doc.file_size)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(doc.processing_status)}`}
                >
                  {doc.processing_status}
                </span>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors text-sm"
                >
                  {" "}
                  Delete{" "}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-blue-600 hover:bg-blue-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors"
        >
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col"
          style={{ height: "500px" }}
        >
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-white font-medium">
              Ask about this collection
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">Powered by AI</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-8">
                Ask a question about your documents
              </p>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {asking && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 px-3 py-2 rounded-xl text-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={askQuestion}
            className="p-3 border-t border-gray-800 flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500"
              disabled={asking}
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
