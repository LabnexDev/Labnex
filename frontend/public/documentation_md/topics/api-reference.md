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
1. **Register** `POST /auth/register`  → create an account.
2. **Login** `POST /auth/login`  → returns `{ token, user }` *and* sets an HttpOnly **token** cookie.
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

• Content-Type `application/json`  • Responses encoded as JSON  
• Standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)  
• Error body `{ message: "Reason" }` with appropriate status  
• Dates ISO-8601 UTC strings  
• Pagination (where applicable) uses `page`, `limit`, `nextCursor`.

---
## 4. Core Resources & Endpoints (v0)

| Category        | Path(s) (prepend `/api`)                                           | Notes |
| --------------- | ------------------------------------------------------------------- | ----- |
| **Auth**        | `/auth/register`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me` |
| **Projects**    | `/projects`, `/projects/{projectId}` |
| **Test Cases**  | `/projects/{projectId}/test-cases`, `/projects/{projectId}/test-cases/{testCaseId}` |
| **Tasks**       | `/projects/{projectId}/tasks`, `/tasks/my` |
| **Notes**       | `/notes`, `/notes/{noteId}`, `/notes/ai` |
| **Snippets**    | `/snippets`, `/snippets/{snippetId}`, `/snippets/{snippetId}/assist` |
| **AI Utilities**| `/ai/generate-test-case`, `/ai/chat`, `/ai/interpret`, etc. |
| **Search**      | `/search/projects`, `/search/test-cases` |
| **Notifications**| `/notifications` |
| **Roles**       | `/roles` |
| **Stats**       | `/stats` |
| **Support**     | `/support` |
| **Discord Integration** | `/integrations/discord/...` |

> 🔎 For cutting-edge route definitions, browse `backend/src/routes/*` and typed helpers in `frontend/src/api/*`.

---
## 5. Example - Create a Project

```bash
TOKEN="<your-jwt-or-api-key>"

curl -X POST https://labnex-backend.onrender.com/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","description":"Q3 initiative"}'
```

---
## 6. Real-time WebSockets

Live test-run output streams over WebSocket:

```
wss://labnex-backend.onrender.com/api/projects/<projectId>/test-runs/<runId>/stream?token=<JWT_OR_API_KEY>
```

---
## 7. Rate Limits & Fair Use

Each user/API-key is subject to fair-use rate limiting. Contact **labnexcontact@gmail.com** if you need a higher quota.

---
## 8. Future Roadmap

* Swagger/OpenAPI interactive docs (planned)
* OAuth2 machine-to-machine flow
* Stable versioned namespace (`/v1`, `/v2`, …)

---
## 9. Detailed Endpoint Examples

Below are canonical request/response pairs you can copy-paste into Postman or cURL scripts. Replace placeholder IDs/tokens with real values.

### 9.1 Authentication

**Login**

Request:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "Secret123!"
}
```

Successful response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64e4d7f9ecf4f0c7f1a1b234",
      "name": "Alice",
      "email": "alice@example.com",
      "avatar": null,
      "systemRole": "MEMBER"
    },
    "token": "<jwt>"
  }
}
```

Error (401 Invalid credentials):
```json
{ "message": "Invalid credentials" }
```

### 9.2 Create a Project

Request:
```http
POST /api/projects
Authorization: Bearer <JWT_OR_API_KEY>
Content-Type: application/json

{
  "name": "Website Redesign",
  "description": "Q3 marketing push",
  "projectCode": "WEB"
}
```

Successful response (201):
```json
{
  "_id": "6500aab1c0e49cfa88f4d321",
  "name": "Website Redesign",
  "description": "Q3 marketing push",
  "projectCode": "WEB",
  "owner": { "_id": "64e4d7f9ecf4f0c7f1a1b234", "name": "Alice", "email": "alice@example.com" },
  "members": [
    { "_id": "64e4d7f9ecf4f0c7f1a1b234", "name": "Alice", "email": "alice@example.com" }
  ],
  "isActive": true,
  "testCaseCount": 0,
  "createdAt": "2023-09-12T14:57:31.943Z",
  "updatedAt": "2023-09-12T14:57:31.943Z",
  "__v": 0
}
```

Possible errors:
* 400 – `Project code already exists.`
* 400 – `Project code must be 3-5 alphanumeric characters.`
* 401 – `User not authenticated` (missing/invalid token).

### 9.3 List Projects (Paginated)

Request:
```http
GET /api/projects?page=1&limit=20
Authorization: Bearer <JWT_OR_API_KEY>
```

Response:
```json
{
  "page": 1,
  "limit": 20,
  "total": 2,
  "data": [
    { "_id": "6500aab1c0e49cfa88f4d321", "name": "Website Redesign", ... },
    { "_id": "6500aa99b9db74c43d9cfc88", "name": "Mobile App", ... }
  ]
}
```

### 9.4 Generate Test Case with AI

```http
POST /api/ai/generate-test-case
Authorization: Bearer <JWT_OR_API_KEY>
Content-Type: application/json

{
  "projectId": "6500aab1c0e49cfa88f4d321",
  "feature": "User login",
  "acceptanceCriteria": [
    "User can log in with valid credentials",
    "Incorrect password shows an error"
  ]
}
```

Response (200):
```json
{
  "id": "tmp_123",
  "steps": [
    "Navigate to /login",
    "Enter email 'user@example.com'",
    "Enter password '********'",
    "Click Login",
    "Assert dashboard is visible"
  ]
}
```

---
## 10. Error Code Matrix

| Status | Meaning | Typical Causes |
| ------ | --------| -------------- |
| 400 | Bad Request | Validation failed, missing fields |
| 401 | Unauthorized | No token or invalid token/API key |
| 403 | Forbidden | Authenticated but lacking permissions |
| 404 | Not Found | Resource ID does not exist or not visible to user |
| 409 | Conflict | Duplicate resource (e.g., project code) |
| 429 | Too Many Requests | Rate-limit exceeded |
| 500 | Internal Server Error | Unhandled exception on server |

---
## 11. Pagination

Where endpoints support pagination, they accept:
* `page` (1-based) – which page to fetch.
* `limit` – items per page (max 100).

The response will include `page`, `limit`, `total`, and an array named `data`. If there are more pages, calculate `nextPage = page + 1` while `page * limit < total`.

---
## 12. Changelog for This Document

| Date | Change |
| ---- | ------ |
| 2024-06-19 | Added detailed request/response samples, error matrix, pagination docs. |

---
For questions, feature requests, or bug reports, please open a GitHub issue or email us at **labnexcontact@gmail.com**. 