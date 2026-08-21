# Credential Leak & Dark Web Exposure Monitor

Web app for monitoring organizational emails against data breaches and checking passwords via Have I Been Pwned (k-anonymity) and XposedOrNot.

## Backend Setup

1. **Clone and enter the backend directory:**
   ```bash
   git clone https://github.com/Unorthodox60/Sih-20.git
   cd "Sih-20/backend"
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the API:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Environment variables (backend)

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `DATABASE_URL` | `sqlite:///./monitor.db` | SQLAlchemy URL. Use PostgreSQL on Render for persistent storage. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated frontend origins allowed by CORS. |

## Frontend Setup

```bash
cd frontend
cp .env.example .env   # optional for local dev
npm install
npm run dev
```

Set `VITE_API_URL` in `.env` locally, or in Netlify site environment variables for production builds.

## API Endpoints

Interactive docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Check Password Leak
**POST** `/check-password`
```json
{ "password": "your-password-here" }
```
Response: `{ "leaked": true, "times_seen": 42 }`

### Check Email Breach
**GET** `/check-email?email={email}`

### Register Organization
**POST** `/register-org` — returns **409** if the name already exists.

### Add Credential
**POST** `/add-credential`
```json
{ "email": "test@example.com", "org_id": 1 }
```

### Rescan Account
**POST** `/accounts/{account_id}/rescan`

### Delete Account
**DELETE** `/accounts/{account_id}`

### Organization Dashboard
**GET** `/org-dashboard/{org_id}`

### Account Detail
**GET** `/account-detail/{account_id}` — refreshes risk score and `last_checked` in the database.

### List Organizations
**GET** `/organizations`

## Deployment notes

- **Render (backend):** Set `DATABASE_URL` to a PostgreSQL instance for persistent data. Set `CORS_ORIGINS` to your Netlify URL.
- **Netlify (frontend):** Set `VITE_API_URL` to your Render backend URL before building.

## Demo disclaimer

This project intentionally has **no authentication** for demo/hackathon use. Do not use with real sensitive data in production without adding auth and access controls.
