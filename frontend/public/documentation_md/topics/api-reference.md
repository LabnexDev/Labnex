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

Each user/API-key is subject to fair-use rate limiting. Contact **support@labnex.dev** if you need a higher quota.

---
## 8. Future Roadmap

* Swagger/OpenAPI interactive docs (planned)
* OAuth2 machine-to-machine flow
* Stable versioned namespace (`/v1`, `/v2`, …)

---
For questions, feature requests, or bug reports, please open a GitHub issue or email us at **support@labnex.dev**. 