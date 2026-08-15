# Credential Leak & Dark Web Exposure Monitor

This project is a web application designed to monitor organizational accounts for data breaches and password leaks. It utilizes the HaveIBeenPwned (k-anonymity) and XposedOrNot APIs to check credentials and computes a risk score for each monitored account.

## Backend Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Unorthodox60/Sih-20.git
   cd Sih-20/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the FastAPI server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## Frontend Developer Notes

* **Base URL:** The backend runs locally at `http://127.0.0.1:8000`.
* **CORS:** Cross-Origin Resource Sharing is already enabled for the frontend (allowed origins: `http://localhost:5173` and `http://127.0.0.1:5173`).
* **Interactive API Docs:** You can test all endpoints, view schemas, and see detailed documentation via Swagger UI at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## API Endpoints

### 1. Check Password Leak
**GET** `/check-password?password={password}`
*   **Description:** Checks if a password has been leaked using HaveIBeenPwned API.
*   **Response:**
    ```json
    {
      "leaked": true,
      "times_seen": 42
    }
    ```

### 2. Check Email Breach
**GET** `/check-email?email={email}`
*   **Description:** Checks if an email has been exposed in data breaches using XposedOrNot API.
*   **Response:**
    ```json
    {
      "breached": true,
      "breach_list": ["Breach1", "Breach2"]
    }
    ```

### 3. Register Organization
**POST** `/register-org`
*   **Description:** Registers a new organization to group monitored accounts.
*   **Request Body:**
    ```json
    {
      "name": "Hackathon Team"
    }
    ```
*   **Response:**
    ```json
    {
      "name": "Hackathon Team",
      "id": 1
    }
    ```

### 4. Add Credential to Monitor
**POST** `/add-credential`
*   **Description:** Adds an email to be monitored under a specific organization. Computes the initial risk score.
*   **Request Body:**
    ```json
    {
      "email": "test@example.com",
      "org_id": 1
    }
    ```
*   **Response:**
    ```json
    {
      "email": "test@example.com",
      "risk_score": 20.0,
      "last_checked": "2026-08-15T15:00:00.000000",
      "breaches": "[\"Breach1\"]",
      "id": 1,
      "org_id": 1
    }
    ```

### 5. Organization Dashboard
**GET** `/org-dashboard/{org_id}`
*   **Description:** Retrieves a summary of all accounts monitored by an organization, including aggregated stats.
*   **Response:**
    ```json
    {
      "org_name": "Hackathon Team",
      "total_accounts": 1,
      "breached_accounts": 1,
      "high_risk_count": 0,
      "average_risk_score": 20.0,
      "accounts": [
        {
          "id": 1,
          "email": "test@example.com",
          "risk_score": 20.0,
          "last_checked": "2026-08-15T15:00:00.000000",
          "breaches": ["Breach1"]
        }
      ]
    }
    ```
