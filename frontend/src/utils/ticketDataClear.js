/**
 * Frontend Ticket Data Clear Utility
 * Clears ticket-related data from:
 * - localStorage
 * - sessionStorage
 * - Browser cache (IndexedDB, if used)
 * - Application state
 */

export const clearTicketDataFrontend = () => {
  console.warn(
    "🧹 Starting to clear ticket data from frontend cache and storage..."
  );

  const itemsToRemove = [
    // Ticket data
    "tickets",
    "ticketData",
    "allTickets",
    "myTickets",
    "raisedTickets",
    "ticketHistory",
    "ticketTags",

    // Dashboard data
    "ticketDashboard",
    "adminDashboard",
    "technicianDashboard",

    // Filter/Search data
    "ticketFilters",
    "ticketSearch",
    "selectedTicket",

    // Cache keys
    "cache_tickets",
    "cache_ticket_list",
    "cache_ticket_details",

    // Form data
    "createTicketForm",
    "ticketFormData",
    "ticketDraft",
  ];

  // Clear localStorage
  console.log("📦 Clearing localStorage...");
  itemsToRemove.forEach((item) => {
    if (localStorage.getItem(item)) {
      localStorage.removeItem(item);
      console.log(`  ✓ Removed: ${item}`);
    }
  });

  // Clear sessionStorage
  console.log("📦 Clearing sessionStorage...");
  itemsToRemove.forEach((item) => {
    if (sessionStorage.getItem(item)) {
      sessionStorage.removeItem(item);
      console.log(`  ✓ Removed: ${item}`);
    }
  });

  // Clear all localStorage and sessionStorage
  console.log("🗑️  Clearing all storage items...");
  Object.keys(localStorage).forEach((key) => {
    if (
      key.toLowerCase().includes("ticket") ||
      key.toLowerCase().includes("dashboard")
    ) {
      localStorage.removeItem(key);
      console.log(`  ✓ Removed localStorage: ${key}`);
    }
  });

  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.toLowerCase().includes("ticket") ||
      key.toLowerCase().includes("dashboard")
    ) {
      sessionStorage.removeItem(key);
      console.log(`  ✓ Removed sessionStorage: ${key}`);
    }
  });

  // Clear IndexedDB if it has ticket data
  console.log("💾 Clearing IndexedDB...");
  indexedDB.databases().then((databases) => {
    databases.forEach((db) => {
      const dbRequest = indexedDB.deleteDatabase(db.name);
      dbRequest.onsuccess = () => {
        console.log(`  ✓ Deleted IndexedDB: ${db.name}`);
      };
    });
  });

  // Clear Service Worker cache
  console.log("🔄 Clearing Service Worker caches...");
  if ("caches" in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        if (
          cacheName.toLowerCase().includes("ticket") ||
          cacheName.toLowerCase().includes("data")
        ) {
          caches.delete(cacheName).then(() => {
            console.log(`  ✓ Cleared cache: ${cacheName}`);
          });
        }
      });
    });
  }

  console.log("✅ Frontend ticket data cleanup completed!");
  console.log("Note: Page will need to refresh to reload fresh data from API");

  return {
    success: true,
    message: "Frontend ticket data cleared successfully",
    itemsCleared: itemsToRemove.length,
  };
};

/**
 * Call this function from browser console to clear data:
 * clearTicketDataFrontend()
 */

/**
 * Alternative: Clear specific storage items
 */
export const clearSpecificTicketData = (storageType = "all") => {
  console.log(`Clearing ${storageType} ticket data...`);

  const ticketKeys = [
    "tickets",
    "ticketData",
    "ticketHistory",
    "ticketTags",
    "ticketDashboard",
  ];

  if (storageType === "local" || storageType === "all") {
    ticketKeys.forEach((key) => localStorage.removeItem(key));
    console.log("✓ localStorage cleared");
  }

  if (storageType === "session" || storageType === "all") {
    ticketKeys.forEach((key) => sessionStorage.removeItem(key));
    console.log("✓ sessionStorage cleared");
  }

  return { success: true, storageType, itemsCleared: ticketKeys.length };
};

/**
 * Get current ticket data stored in frontend
 */
export const getTicketDataStatus = () => {
  const localStorageItems = {};
  const sessionStorageItems = {};

  // Get localStorage items
  Object.keys(localStorage).forEach((key) => {
    if (
      key.toLowerCase().includes("ticket") ||
      key.toLowerCase().includes("dashboard")
    ) {
      localStorageItems[key] = localStorage.getItem(key);
    }
  });

  // Get sessionStorage items
  Object.keys(sessionStorage).forEach((key) => {
    if (
      key.toLowerCase().includes("ticket") ||
      key.toLowerCase().includes("dashboard")
    ) {
      sessionStorageItems[key] = sessionStorage.getItem(key);
    }
  });

  return {
    localStorage: localStorageItems,
    sessionStorage: sessionStorageItems,
    totalItems:
      Object.keys(localStorageItems).length +
      Object.keys(sessionStorageItems).length,
  };
};

export default {
  clearTicketDataFrontend,
  clearSpecificTicketData,
  getTicketDataStatus,
};
