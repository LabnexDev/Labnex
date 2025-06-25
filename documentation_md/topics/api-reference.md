# Labnex API Reference (Developer Preview)

Welcome to the **Labnex** REST API. This document helps developers integrate external tools, CI pipelines, and custom clients with the Labnex platform.

---
## 1. Base URLs

Environment | URL
----------- | --------------------------------------------
Production  | `https://labnex-backend.onrender.com/api`
Development | `http://localhost:5000/api`

All examples below use the **production** base URL. Substitute the development URL when running the backend locally.

---
## 2. Authentication

Labnex offers two complementary mechanisms:

### 2.1 JSON Web Tokens (JWT)
1. **Register** `POST /auth/register`  → create an account.
2. **Login** `POST /auth/login`  → returns `{ token, user }` *and* sets an HttpOnly **token** cookie.
3. Supply the token on subsequent requests via **either**:
   * Cookie `token` (automatic in browsers), **or**
   * Header `Authorization: Bearer <JWT>`

### 2.2 Permanent API Keys (best for CI / CLI)
1. **Create** `POST /api-keys` `{ "label": "My CI Job" }` (requires JWT auth once).
2. **List** `GET /api-keys`
3. **Revoke** `DELETE /api-keys/:id`

Use the key exactly like a JWT:
```
Authorization: Bearer lab_rk_abcdef123456...
```
The middleware auto-detects whether the bearer token is a JWT or an API key.

---
## 3. Common Conventions

• Content-Type `application/json`  • Responses encoded as JSON  
• Standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)  
• Error body `{ message: "Reason" }` with appropriate status  
• Dates ISO-8601 UTC strings  
• Pagination (where applicable) uses `page`, `limit`, `nextCursor`.

---
## 4. Core Resources & Endpoints (v0)

| Category        | Path(s) (prepend `/api`)                                           | Notes |
| --------------- | ------------------------------------------------------------------- | ----- |
| **Authentication** | `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me` | User authentication |
| **API Keys**    | `/api-keys`, `/api-keys/:id` | Permanent API key management |
| **Projects**    | `/projects`, `/projects/{projectId}`, `/projects/{projectId}/test-runs` | Project and test run management |
| **Test Cases**  | `/projects/{projectId}/test-cases`, `/projects/{projectId}/test-cases/{testCaseId}` | Test case CRUD |
| **Tasks**       | `/projects/{projectId}/tasks`, `/tasks/my`, `/tasks/{taskId}` | Task management and personal tasks |
| **Notes**       | `/notes`, `/notes/{noteId}`, `/notes/ai` | Personal notes with AI generation |
| **Snippets**    | `/snippets`, `/snippets/{snippetId}`, `/snippets/{snippetId}/assist` | Code snippet management with AI |
| **AI Services** | `/ai/generate-test-case`, `/ai/chat`, `/ai/tts`, `/ai/sessions`, `/ai/messages` | AI-powered features |
| **Discord**     | `/integrations/discord/link`, `/integrations/discord/notes`, `/integrations/discord/tasks` | Discord bot integration |
| **Search**      | `/search/projects`, `/search/test-cases` | Cross-platform search |
| **Notifications** | `/notifications` | User notifications |
| **Roles**       | `/roles` | Role-based access control |
| **Stats**       | `/stats`, `/stats/waitlist` | Platform statistics |
| **Support**     | `/support/contact` | Support system |
| **Users**       | `/users/search`, `/users/profile` | User management |
| **Test Runners** | `/test-runs/{runId}`, `/test-runs/claim` | Test execution infrastructure |
| **Bot Management** | `/bots/{botId}/status` | Discord bot status and control |
| **Admin**       | `/admin/waitlist`, `/admin/users` | Administrative functions |

> 🔎 For cutting-edge route definitions, browse `backend/src/routes/*` and typed helpers in `frontend/src/api/*`.

---
## 5. Enhanced Authentication Endpoints

### Register Account
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Developer",
  "email": "john@company.com",
  "password": "SecurePass123!"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@company.com", 
  "password": "SecurePass123!"
}
```

### Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@company.com"
}
```

### Reset Password (with token)
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

---
## 6. Project Management

### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "E-commerce Platform",
  "description": "Testing suite for online store",
  "projectCode": "ECOM"
}
```

### Get Project Details
```http
GET /api/projects/64e4d7f9ecf4f0c7f1a1b234
Authorization: Bearer <token>
```

### Create Test Run
```http
POST /api/projects/64e4d7f9ecf4f0c7f1a1b234/test-runs
Authorization: Bearer <token>
Content-Type: application/json

{
  "testCases": ["testcase1", "testcase2"],
  "parallel": 4,
  "environment": "staging",
  "aiOptimization": true,
  "baseUrl": "https://staging.example.com"
}
```

---
## 7. Task Management

### Get Personal Tasks
```http
GET /api/tasks/my
Authorization: Bearer <token>
```

### Create Task
```http
POST /api/projects/64e4d7f9ecf4f0c7f1a1b234/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Implement payment gateway",
  "description": "Add Stripe integration",
  "priority": "HIGH",
  "status": "To Do",
  "assignedTo": "user_id",
  "dueDate": "2024-02-15T00:00:00.000Z"
}
```

### Update Task
```http
PUT /api/tasks/64e4d7f9ecf4f0c7f1a1b234
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "In Progress",
  "priority": "HIGH"
}
```

---
## 8. AI-Powered Features

### Generate Test Case
```http
POST /api/ai/generate-test-case
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Test user login with email validation",
  "projectId": "64e4d7f9ecf4f0c7f1a1b234"
}
```

### AI Chat
```http
POST /api/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How do I create a test case for API testing?",
  "sessionId": "session_123",
  "context": {
    "projectId": "64e4d7f9ecf4f0c7f1a1b234"
  }
}
```

### Text-to-Speech
```http
POST /api/ai/tts
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Your test run has completed successfully with 5 passed and 1 failed test.",
  "voice": "alloy",
  "speed": 1.0
}
```

### AI Session Management
```http
# Create new AI session
POST /api/ai/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Project ECOM Testing Discussion"
}

# List AI sessions
GET /api/ai/sessions
Authorization: Bearer <token>

# Delete AI session
DELETE /api/ai/sessions/session_123
Authorization: Bearer <token>
```

### AI Message History
```http
# Get messages for session
GET /api/ai/messages?sessionId=session_123
Authorization: Bearer <token>

# Save AI message
POST /api/ai/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session_123",
  "role": "user",
  "content": "Create a test for login functionality"
}
```

---
## 9. Code Snippets & Notes

### Create Note
```http
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Remember to test edge cases for payment processing",
  "projectId": "64e4d7f9ecf4f0c7f1a1b234"
}
```

### Generate Note with AI
```http
POST /api/notes/ai
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Create a note about best practices for API testing",
  "projectId": "64e4d7f9ecf4f0c7f1a1b234"
}
```

### Create Code Snippet
```http
POST /api/snippets
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "API Request Helper",
  "language": "javascript",
  "code": "const fetchAPI = async (url) => {\n  const response = await fetch(url);\n  return response.json();\n}",
  "description": "Simple API request wrapper",
  "projectId": "64e4d7f9ecf4f0c7f1a1b234"
}
```

### AI Snippet Assistance
```http
# Cleanup code snippet
POST /api/snippets/64e4d7f9ecf4f0c7f1a1b234/assist
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "cleanup"
}

# Fix errors in snippet
POST /api/snippets/64e4d7f9ecf4f0c7f1a1b234/assist
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "fix_errors"
}
```

---
## 10. Discord Integration

### Link Discord Account
```http
GET /api/integrations/discord/link?token=<link_token>&discord_id=<id>&discord_username=<username>
Authorization: Bearer <token>
```

### Create Note via Discord
```http
POST /api/integrations/discord/notes
X-Bot-Secret: <bot_secret>
Content-Type: application/json

{
  "discordUserId": "123456789",
  "title": "Meeting Notes",
  "content": "Discussed testing strategy for new features"
}
```

### Create Task via Discord
```http
POST /api/integrations/discord/tasks
X-Bot-Secret: <bot_secret>
Content-Type: application/json

{
  "discordUserId": "123456789",
  "projectId": "64e4d7f9ecf4f0c7f1a1b234",
  "title": "Fix login bug",
  "description": "Users can't log in with special characters",
  "priority": "HIGH"
}
```

### Get Task Details for Discord
```http
GET /api/integrations/discord/task-details/TASK-123
X-Bot-Secret: <bot_secret>
```

---
## 11. Test Runner Infrastructure

### Claim Next Test Run (for runners)
```http
POST /api/test-runs/claim
Authorization: Bearer <runner_token>
Content-Type: application/json

{
  "runnerId": "runner_001",
  "capabilities": ["chrome", "firefox"]
}
```

### Update Test Run Progress
```http
PATCH /api/test-runs/64e4d7f9ecf4f0c7f1a1b234/progress
Authorization: Bearer <runner_token>
Content-Type: application/json

{
  "status": "running",
  "progress": 45,
  "currentTest": "login_test",
  "logs": ["Starting login test", "Navigating to login page"]
}
```

### Complete Test Run
```http
POST /api/test-runs/64e4d7f9ecf4f0c7f1a1b234/complete
Authorization: Bearer <runner_token>
Content-Type: application/json

{
  "status": "completed",
  "results": {
    "passed": 8,
    "failed": 2,
    "skipped": 0,
    "total": 10
  },
  "screenshots": ["login_success.png", "checkout_failure.png"],
  "logs": ["Full execution log..."]
}
```

---
## 12. Bot Management

### Get Bot Status
```http
GET /api/bots/labnexAI/status
Authorization: Bearer <token>
```

### Start Bot
```http
POST /api/bots/labnexAI/start
Authorization: Bearer <token>
```

### Stop Bot
```http
POST /api/bots/labnexAI/stop
Authorization: Bearer <token>
```

---
## 13. User Management

### Search Users
```http
GET /api/users/search?q=john&limit=10
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.new@company.com"
}
```

### Update Password
```http
PUT /api/users/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

---
## 14. Platform Statistics

### Get Platform Stats
```http
GET /api/stats
```

### Join Waitlist
```http
POST /api/stats/waitlist
Content-Type: application/json

{
  "email": "waiting@company.com",
  "name": "Waiting User"
}
```

---
## 15. Administrative Endpoints

### Get Waitlist Entries (Admin)
```http
GET /api/admin/waitlist
Authorization: Bearer <admin_token>
```

### Approve Waitlist User (Admin)
```http
POST /api/admin/waitlist/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "waiting@company.com"
}
```

### Create User (Admin)
```http
POST /api/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@company.com",
  "password": "TempPass123!",
  "systemRole": "MEMBER"
}
```

---
## 16. Real-time WebSockets

Live test-run output streams over WebSocket:

```javascript
// Test run progress streaming
const ws = new WebSocket('wss://labnex-backend.onrender.com/api/projects/PROJECT_ID/test-runs/RUN_ID/stream?token=JWT_OR_API_KEY');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Test progress:', data);
};
```

---
## 17. Error Handling

### HTTP Status Codes

| Status | Meaning | Typical Causes |
| ------ | --------| -------------- |
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Validation failed, missing fields |
| 401 | Unauthorized | No token or invalid token/API key |
| 403 | Forbidden | Authenticated but lacking permissions |
| 404 | Not Found | Resource ID does not exist or not visible to user |
| 409 | Conflict | Duplicate resource (e.g., project code) |
| 422 | Unprocessable Entity | Request valid but semantically incorrect |
| 429 | Too Many Requests | Rate-limit exceeded |
| 500 | Internal Server Error | Unhandled exception on server |

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email address is required"
    }
  ]
}
```

---
## 18. Rate Limits & Fair Use

Each user/API-key is subject to fair-use rate limiting:

- **Standard Users**: 100 requests/minute, 1000 requests/hour
- **Premium Users**: 500 requests/minute, 5000 requests/hour
- **API Keys**: 1000 requests/minute, 10000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

Contact **labnexcontact@gmail.com** if you need a higher quota.

---
## 19. Pagination

Paginated endpoints support:

```http
GET /api/projects?page=1&limit=20&sort=name&order=asc
```

Response format:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---
## 20. Future Roadmap

* **OpenAPI/Swagger Documentation**: Interactive API explorer
* **OAuth2 Integration**: Third-party application access
* **GraphQL Endpoint**: Flexible data querying
* **Webhook System**: Real-time event notifications
* **API Versioning**: Stable versioned namespaces (`/v1`, `/v2`)
* **SDK Libraries**: Official client libraries for popular languages

---
## 21. Support & Resources

- **Documentation**: [https://labnexdev.github.io/Labnex](https://labnexdev.github.io/Labnex)
- **CLI Tools**: [CLI Usage Guide](./cli-usage.md)
- **Discord Community**: Get help from other developers
- **GitHub Issues**: Report bugs and request features
- **Email Support**: labnexcontact@gmail.com

---

**Ready to integrate with Labnex?** Start with authentication and project listing to get familiar with the API structure. Use the CLI alongside the API for the most powerful automation workflows! 