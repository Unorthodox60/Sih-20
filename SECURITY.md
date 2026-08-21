# Security Policy

This is a **demo project** without authentication. Do not deploy it with real organizational data or production credentials without adding proper access controls first.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |

## Reporting a Vulnerability

If you find a security issue in this repository, please open a private security advisory on GitHub or contact the maintainers directly. We aim to acknowledge reports within 7 days.

## Known demo limitations

- No user authentication or authorization (intentional for demo use)
- External breach APIs (Have I Been Pwned, XposedOrNot) are subject to third-party rate limits
- Password checks use k-anonymity via HIBP; passwords are sent to the backend over POST (never in URL query strings)

## Recommended before production use

- Add authentication and org-scoped authorization
- Use a managed database (e.g. PostgreSQL via `DATABASE_URL`) instead of ephemeral SQLite
- Configure `CORS_ORIGINS` to your deployed frontend domain only
- Set `VITE_API_URL` in Netlify (or your host) to your backend URL
