import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Collection } from "../types";
import api from "../lib/api";

export default function DashboardPage() {
  const { getUser, logout } = useAuth();
  const navigate = useNavigate();
  const user = getUser();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.get<Collection[]>("/collections");
      setCollections(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const response = await api.post<Collection>("/collections", {
        name: newName,
        description: newDescription,
      });
      setCollections([response.data, ...collections]);
      setNewName("");
      setNewDescription("");
      setShowNewCollection(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Vault</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.full_name}</span>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Collections</h2>
            <p className="text-gray-400 mt-1">
              Organize your documents into collections
            </p>
          </div>
          <button
            onClick={() => setShowNewCollection(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + New Collection
          </button>
        </div>

        {/* New Collection Form */}
        {showNewCollection && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-medium mb-4">New Collection</h3>
            <form onSubmit={createCollection} className="space-y-4">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Collection name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                required
                autoFocus
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCollection(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collections Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-800">
              <span className="text-2xl">📁</span>
            </div>
            <h3 className="text-white font-medium mb-2">No collections yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Create your first collection to start organizing your documents
            </p>
            <button
              onClick={() => setShowNewCollection(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + New Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                onClick={() => navigate(`/collections/${collection.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-gray-700 hover:bg-gray-800/50 transition-all"
              >
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-blue-400">📁</span>
                </div>
                <h3 className="text-white font-medium mb-1">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-gray-500 text-sm">
                    {collection.description}
                  </p>
                )}
                <p className="text-gray-600 text-xs mt-3">
                  {new Date(collection.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
