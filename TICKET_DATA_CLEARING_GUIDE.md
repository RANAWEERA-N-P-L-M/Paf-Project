# Ticket Data Clearing Guide

This document provides comprehensive instructions for clearing ticket data from your PAF Project application.

## Overview

The ticket data clearing system allows you to remove ticket-related data from:
- **Database**: MongoDB collections (tickets, ticket history, ticket tags)
- **Cache**: Browser cache, localStorage, sessionStorage
- **Project**: Frontend state and stored data

---

## Database Clearing (Backend)

### 1. Using API Endpoints (Recommended)

All endpoints require **ADMIN role** authentication. Use the JWT token in Authorization header.

#### Get Current Ticket Data Count

```bash
GET http://localhost:8081/admin/tickets/clear/count

Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Response:**
```json
{
  "ticketCount": 150,
  "historyCount": 500,
  "tagCount": 25
}
```

#### Clear ALL Ticket Data

⚠️ **Destructive operation - Cannot be undone!**

```bash
DELETE http://localhost:8081/admin/tickets/clear/all

Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Response:**
```json
{
  "ticketsCleared": 150,
  "historiesCleared": 500,
  "tagsCleared": 25,
  "totalCleared": 675,
  "success": true,
  "message": "All ticket data cleared successfully"
}
```

#### Clear Only Tickets

```bash
DELETE http://localhost:8081/admin/tickets/clear/tickets
```

#### Clear Only Ticket History

```bash
DELETE http://localhost:8081/admin/tickets/clear/history
```

#### Clear Only Ticket Tags

```bash
DELETE http://localhost:8081/admin/tickets/clear/tags
```

### 2. Using cURL

```bash
# Check status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/admin/tickets/clear/status

# Get count
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/admin/tickets/clear/count

# Clear all data
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8081/admin/tickets/clear/all
```

### 3. Using Postman

1. Create a new request
2. Set method to `DELETE`
3. URL: `http://localhost:8081/admin/tickets/clear/all`
4. Go to **Headers** tab
5. Add header:
   - Key: `Authorization`
   - Value: `Bearer <YOUR_JWT_TOKEN>`
6. Click **Send**

### 4. Direct Java Code

If you need to call the service directly in your code:

```java
@Autowired
private TicketDataClearService ticketDataClearService;

// Clear all data
TicketDataClearService.ClearDataSummary result = 
    ticketDataClearService.clearAllTicketData();

if (result.isSuccess()) {
    System.out.println("Cleared: " + result.getTotalCleared() + " items");
}

// Clear specific data
ticketDataClearService.clearTickets();
ticketDataClearService.clearTicketHistory();
ticketDataClearService.clearTicketTags();

// Get count
TicketDataClearService.TicketDataCountSummary counts = 
    ticketDataClearService.getTicketDataCount();
```

---

## Frontend Clearing

### 1. Using Admin UI Component

1. Navigate to Admin Dashboard
2. Go to **Ticket Data Management** section (if integrated)
3. Choose the data to clear:
   - **Database Tab**: Clear backend database
   - **Frontend Tab**: Clear browser cache and storage

### 2. Using Browser Console

1. Open Developer Tools: Press **F12** (or Right-click → Inspect)
2. Go to **Console** tab
3. Run the following command:

```javascript
// Import and run the clear function
import { clearTicketDataFrontend } from './utils/ticketDataClear.js';
clearTicketDataFrontend();
```

Or directly in console:

```javascript
// Clear all ticket-related data
(() => {
  const keys = ['tickets', 'ticketData', 'ticketHistory', 'ticketDashboard'];
  keys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  console.log('✓ Frontend cache cleared');
})();
```

### 3. Specific Storage Clearing

```javascript
// Clear only localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('ticket')) localStorage.removeItem(key);
});

// Clear only sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('ticket')) sessionStorage.removeItem(key);
});
```

### 4. Check Current Stored Data

```javascript
// View all stored ticket data
const status = Object.keys(localStorage).filter(k => k.includes('ticket'));
console.log('Stored ticket keys:', status);

// Get size of stored data
const size = Object.keys(localStorage)
  .filter(k => k.includes('ticket'))
  .reduce((acc, key) => acc + localStorage[key].length, 0);
console.log('Total size:', (size / 1024).toFixed(2), 'KB');
```

---

## Complete Clear Procedure

### Step 1: Backup (Optional but Recommended)

Export ticket data before clearing:

```javascript
const backup = {
  tickets: localStorage.getItem('tickets'),
  timestamp: new Date().toISOString()
};
console.save(backup, 'ticket_backup.json');
```

### Step 2: Clear Database

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:8081/admin/tickets/clear/all
```

### Step 3: Clear Frontend Cache

```javascript
// From browser console
import { clearTicketDataFrontend } from './utils/ticketDataClear.js';
clearTicketDataFrontend();
```

### Step 4: Refresh Application

```javascript
window.location.reload();
```

---

## Clearing Specific Data Types

### Clear Tickets Only (Keep History & Tags)

```bash
DELETE http://localhost:8081/admin/tickets/clear/tickets
```

### Clear Ticket History Only

```bash
DELETE http://localhost:8081/admin/tickets/clear/history
```

### Clear Ticket Tags Only

```bash
DELETE http://localhost:8081/admin/tickets/clear/tags
```

---

## Services & Implementation Details

### Backend Service

**File**: `src/main/java/com/unicore/facility/service/TicketDataClearService.java`

Methods:
- `clearAllTicketData()` - Clear everything
- `clearTickets()` - Clear tickets only
- `clearTicketHistory()` - Clear history only
- `clearTicketTags()` - Clear tags only
- `getTicketDataCount()` - Get current counts

### Backend Controller

**File**: `src/main/java/com/unicore/facility/controller/TicketDataClearController.java`

Endpoints: `/admin/tickets/clear/*` (ADMIN role required)

### Frontend Utility

**File**: `frontend/src/utils/ticketDataClear.js`

Functions:
- `clearTicketDataFrontend()` - Clear all frontend data
- `clearSpecificTicketData(storageType)` - Clear specific storage
- `getTicketDataStatus()` - Get current stored data info

### Frontend Component

**File**: `frontend/src/components/admin/TicketDataClearPanel.jsx`

React component with UI for clearing data. Use in Admin Dashboard:

```jsx
import TicketDataClearPanel from '@/components/admin/TicketDataClearPanel';

// In your admin dashboard
<TicketDataClearPanel />
```

---

## MongoDB Collections

### Collections to be Cleared

```
tickets           - Main ticket documents
ticketHistories   - Ticket change history
ticketTags        - Ticket tags/labels
```

### MongoDB Shell Commands

If you need to clear data directly from MongoDB:

```javascript
// Connect to MongoDB Atlas
use unicore

// Clear collections
db.tickets.deleteMany({})
db.ticketHistories.deleteMany({})
db.ticketTags.deleteMany({})

// Verify
db.tickets.countDocuments()
db.ticketHistories.countDocuments()
db.ticketTags.countDocuments()
```

---

## Logging

All clear operations are logged for audit purposes:

**Log Location**: Application logs (usually `logs/` directory)

**Log Examples**:
```
WARN  - Starting to clear ALL ticket data from database...
INFO  - Cleared 150 ticket history records
INFO  - Cleared 42 tickets
INFO  - Cleared 8 ticket tags
WARN  - ADMIN: Successfully cleared ALL ticket data - Tickets: 42, History: 150, Tags: 8
```

---

## Security Notes

⚠️ **Important Security Information**:

1. **Admin-Only Access**: All clear endpoints require `ADMIN` role
2. **JWT Authentication**: Must provide valid JWT token
3. **No Batch Confirmation**: Deletes happen immediately - no undo
4. **Audit Logging**: All operations are logged with admin identity
5. **Production Warning**: Be very careful in production environments

---

## Troubleshooting

### 401 Unauthorized

- Ensure you have a valid JWT token
- Token may have expired - get a new one by logging in

### 403 Forbidden

- You don't have ADMIN role
- Only admins can clear ticket data

### 404 Not Found

- Endpoint may not exist
- Check URL spelling
- Ensure backend is running on port 8081

### Database Connection Error

- Check MongoDB Atlas connection string
- Verify network connectivity
- Check credentials in `application.properties`

---

## API Testing

### Using REST Client (VS Code Extension)

Create a file `test.http`:

```http
@base = http://localhost:8081
@token = your_jwt_token_here

### Get Count
GET {{base}}/admin/tickets/clear/count
Authorization: Bearer {{token}}

### Clear All
DELETE {{base}}/admin/tickets/clear/all
Authorization: Bearer {{token}}

### Clear Tickets
DELETE {{base}}/admin/tickets/clear/tickets
Authorization: Bearer {{token}}
```

---

## FAQ

**Q: Can I undo the clear operation?**
A: No, the clear operation is permanent. Please backup data before clearing.

**Q: Will clearing tickets affect users?**
A: Yes, all users will lose access to ticket data. Consider notifying users before clearing.

**Q: How long does it take to clear?**
A: Typically instant for small datasets. May take a few seconds for large datasets.

**Q: What happens to comments on tickets?**
A: If comments are stored separately, they won't be affected. Check your comment repository.

**Q: Can I schedule automatic clearing?**
A: Yes, add a scheduled task using `@Scheduled` annotation in a new method.

---

## Contact & Support

For issues or questions, contact the development team or check the project documentation.
