# Labnex API Key – Quick Start

This temporary guide explains how users will generate an API key in the Labnex dashboard and authenticate the CLI / cloud-runner without touching environment variables or backend URLs.

---

## 1  Generate a key in the dashboard

1. Sign in to the Labnex web app.
2. Open **Settings → API Keys**.
3. Click **Generate new key**.
4. Copy the token that looks like:

   ```text
   lab_rk_d6f1b8f0e0754a17b6df9b30fcb1f683
   ```

   ⚠️ This string is **shown once**. Store it in a password manager.

---

## 2  Authenticate the CLI

```bash
labnex auth use-key <paste-your-token-here>
```

The command saves the key to `~/.labnex/config.json`. From now on every
CLI call automatically sends `Authorization: Bearer <token>`.

Example workflow:

```bash
labnex auth use-key lab_rk_…
labnex list projects
labnex run project MYPROJ --cloud
```

---

## 3  Running the standalone cloud runner (optional)

If you host your own runner container:

```bash
docker run -e LABNEX_API_KEY=<token> ghcr.io/labnex/runner:latest
```

or in a local shell:

```bash
set LABNEX_API_KEY=<token>
node packages/runner/dist/cloudRunner.js
```

---

## 4  Managing keys

* **List / revoke** keys in **Settings → API Keys**.
* Each key shows *label*, *created date*, and *last used* timestamp.
* Deleting a key immediately invalidates it; affected runners/CLI calls
  will receive `401 Unauthorized` and prompt you to add a new key.

---

### Notes for devs

* Keys are 32 random bytes (`64` hex) plus prefix `lab_rk_`.
* Server stores only `sha256(token)`; plain token is never persisted.
* Middleware attaches the user to the request if the hash matches. 