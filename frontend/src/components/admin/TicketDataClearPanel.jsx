import React, { useState, useEffect } from "react";
import { AlertCircle, Trash2, RefreshCw, Check } from "lucide-react";

/**
 * Admin component for clearing ticket data
 * Provides UI to clear database, cache, and project data
 */
const TicketDataClearPanel = () => {
  const [ticketCounts, setTicketCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const API_BASE = "http://localhost:8081/admin/tickets/clear";

  // Fetch current ticket data counts
  const fetchTicketCounts = async () => {
    try {
      const response = await fetch(`${API_BASE}/count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setTicketCounts(data);
    } catch (error) {
      console.error("Error fetching counts:", error);
      showMessage("Error fetching data counts", "error");
    }
  };

  useEffect(() => {
    fetchTicketCounts();
  }, []);

  const showMessage = (msg, type = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Clear all data
  const handleClearAll = async () => {
    if (!window.confirm("⚠️  This will DELETE ALL ticket data! Are you sure?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/all`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        showMessage(
          `✓ Cleared: ${data.ticketsCleared} tickets, ${data.historiesCleared} histories, ${data.tagsCleared} tags`,
          "success"
        );
        fetchTicketCounts();
      } else {
        showMessage(`Error: ${data.message}`, "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("Failed to clear data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Clear only tickets
  const handleClearTickets = async () => {
    if (!window.confirm("⚠️  This will DELETE all tickets! Continue?")) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tickets`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showMessage(`✓ Cleared ${data.ticketsCleared} tickets`, "success");
        fetchTicketCounts();
      } else {
        showMessage(data.message, "error");
      }
    } catch (error) {
      showMessage("Error clearing tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  // Clear only history
  const handleClearHistory = async () => {
    if (
      !window.confirm("⚠️  This will DELETE all ticket history! Continue?")
    )
      return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/history`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showMessage(`✓ Cleared ${data.historiesCleared} history records`, "success");
        fetchTicketCounts();
      } else {
        showMessage(data.message, "error");
      }
    } catch (error) {
      showMessage("Error clearing history", "error");
    } finally {
      setLoading(false);
    }
  };

  // Clear only tags
  const handleClearTags = async () => {
    if (!window.confirm("⚠️  This will DELETE all ticket tags! Continue?"))
      return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        showMessage(`✓ Cleared ${data.tagsCleared} tags`, "success");
        fetchTicketCounts();
      } else {
        showMessage(data.message, "error");
      }
    } catch (error) {
      showMessage("Error clearing tags", "error");
    } finally {
      setLoading(false);
    }
  };

  // Clear frontend data
  const handleClearFrontend = () => {
    try {
      // Clear localStorage
      Object.keys(localStorage).forEach((key) => {
        if (
          key.toLowerCase().includes("ticket") ||
          key.toLowerCase().includes("dashboard")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.toLowerCase().includes("ticket") ||
          key.toLowerCase().includes("dashboard")
        ) {
          sessionStorage.removeItem(key);
        }
      });

      showMessage("✓ Frontend cache cleared successfully", "success");
    } catch (error) {
      showMessage("Error clearing frontend cache", "error");
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🗑️ Ticket Data Management
          </h2>
          <p className="text-gray-600">
            Clear ticket data from database, cache, and project storage
          </p>
        </div>

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={
                message.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "database"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Database
          </button>
          <button
            onClick={() => setActiveTab("frontend")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "frontend"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Frontend
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Tickets</p>
                <p className="text-3xl font-bold text-blue-600">
                  {ticketCounts?.ticketCount || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">History Records</p>
                <p className="text-3xl font-bold text-purple-600">
                  {ticketCounts?.historyCount || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Tags</p>
                <p className="text-3xl font-bold text-green-600">
                  {ticketCounts?.tagCount || 0}
                </p>
              </div>
            </div>

            <button
              onClick={fetchTicketCounts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Counts
            </button>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">
                  ⚠️ Destructive Operations
                </p>
                <p className="text-sm text-red-800 mt-1">
                  These actions cannot be undone. Please backup data first if
                  needed.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Clear ALL Ticket Data
                </span>
                {loading && <span className="animate-spin">⟳</span>}
              </button>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleClearTickets}
                  disabled={loading}
                  className="flex items-center justify-between px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Tickets
                  </span>
                </button>

                <button
                  onClick={handleClearHistory}
                  disabled={loading}
                  className="flex items-center justify-between px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    History
                  </span>
                </button>

                <button
                  onClick={handleClearTags}
                  disabled={loading}
                  className="flex items-center justify-between px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Tags
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Frontend Tab */}
        {activeTab === "frontend" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Frontend Cache</p>
                <p className="text-sm text-blue-800 mt-1">
                  Clears localStorage, sessionStorage, and browser cache
                </p>
              </div>
            </div>

            <button
              onClick={handleClearFrontend}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Clear Frontend Cache
              </span>
            </button>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="font-semibold text-gray-900 mb-2">
                Browser Console Method:
              </p>
              <code className="block bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                clearTicketDataFrontend()
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Open Developer Tools (F12), go to Console tab, and paste the
                above command
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDataClearPanel;
