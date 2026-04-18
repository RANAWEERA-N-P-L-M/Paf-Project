# 🗑️ Ticket Data Clear - Quick Reference

## Quick Commands

### 🔵 Check Data Count
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8081/admin/tickets/clear/count
```

### 🔴 Clear ALL Data (⚠️ Destructive)
```bash
curl -X DELETE \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:8081/admin/tickets/clear/all
```

### 🟠 Clear Individual Items
```bash
# Tickets only
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:8081/admin/tickets/clear/tickets

# History only
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:8081/admin/tickets/clear/history

# Tags only
curl -X DELETE -H "Authorization: Bearer TOKEN" \
  http://localhost:8081/admin/tickets/clear/tags
```

---

## 🌐 Frontend Cache Clear

### From Browser Console
```javascript
import { clearTicketDataFrontend } from './utils/ticketDataClear.js';
clearTicketDataFrontend();
```

### Or manually
```javascript
Object.keys(localStorage).forEach(k => {
  if (k.includes('ticket')) localStorage.removeItem(k);
});
Object.keys(sessionStorage).forEach(k => {
  if (k.includes('ticket')) sessionStorage.removeItem(k);
});
```

---

## 📋 MongoDB Direct Commands

```javascript
use unicore
db.tickets.deleteMany({})
db.ticketHistories.deleteMany({})
db.ticketTags.deleteMany({})
```

---

## ✅ Complete Workflow

1. **Get Count**: Check how much data exists
2. **Backup** (optional): Export important data
3. **Clear DB**: Delete from database
4. **Clear Cache**: Clear frontend storage
5. **Refresh**: Reload application
6. **Verify**: Check counts are 0

---

## Files Created/Modified

- ✅ `TicketDataClearService.java` - Backend service
- ✅ `TicketDataClearController.java` - API endpoints
- ✅ `ticketDataClear.js` - Frontend utility
- ✅ `TicketDataClearPanel.jsx` - Admin UI component
- ✅ `TICKET_DATA_CLEARING_GUIDE.md` - Full documentation

---

## Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/admin/tickets/clear/count` | Get data counts |
| GET | `/admin/tickets/clear/status` | Service status |
| DELETE | `/admin/tickets/clear/all` | Clear everything |
| DELETE | `/admin/tickets/clear/tickets` | Clear tickets |
| DELETE | `/admin/tickets/clear/history` | Clear history |
| DELETE | `/admin/tickets/clear/tags` | Clear tags |

---

## ⚠️ Important Notes

- **ADMIN ROLE REQUIRED** for all operations
- **JWT TOKEN NEEDED** in Authorization header
- **NO UNDO** - Deletions are permanent
- **LOGGED** - All operations are audited
- **DESTRUCTIVE** - Use with caution in production

---

## Test with Postman

1. Method: `DELETE`
2. URL: `http://localhost:8081/admin/tickets/clear/all`
3. Headers:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN`
4. Click Send

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token validity |
| 403 Forbidden | Verify ADMIN role |
| 404 Not Found | Check backend is running on port 8081 |
| Connection Error | Verify MongoDB Atlas connection |

---

**Last Updated**: 2025
**Version**: 1.0
