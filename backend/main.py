import json
import os
import uuid
import datetime
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, Request
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from pydantic import EmailStr
from sqlalchemy.orm import Session

import models, schemas, services
from database import engine, get_db
from services import ExternalAPIError

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Credential Leak Monitor API")

_default_origins = "http://localhost:5173,http://127.0.0.1:5173"
_cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", _default_origins).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins so laptops on the same network can access
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _apply_scan_to_account(account: models.MonitoredAccount, detail: dict) -> None:
    account.risk_score = detail["risk_score"]
    account.breaches = json.dumps(detail.get("breach_names", []))
    account.last_checked = datetime.datetime.utcnow()


@app.post("/check-password", response_model=schemas.PasswordCheckResponse)
async def check_password(body: schemas.PasswordCheckRequest):
    try:
        return await services.check_password_pwned(body.password)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/check-email", response_model=schemas.EmailCheckResponse)
async def check_email(email: EmailStr):
    try:
        return await services.check_email_breach(str(email))
    except ExternalAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/register-org", response_model=schemas.Organization)
def register_org(org: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    db_org = db.query(models.Organization).filter(models.Organization.name == org.name).first()
    if db_org:
        raise HTTPException(status_code=409, detail="Organization name already exists")

    new_org = models.Organization(name=org.name)
    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org


@app.get("/organizations", response_model=list[schemas.Organization])
def get_organizations(db: Session = Depends(get_db)):
    return db.query(models.Organization).all()


@app.post("/add-credential", response_model=schemas.MonitoredAccount)
async def add_credential(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == account.org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    existing = db.query(models.MonitoredAccount).filter(
        models.MonitoredAccount.email == str(account.email),
        models.MonitoredAccount.org_id == account.org_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account already monitored in this org")

    try:
        detail = await services.get_detailed_breach_info(str(account.email), use_cache=False)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    new_account = models.MonitoredAccount(
        email=str(account.email),
        org_id=account.org_id,
        risk_score=detail["risk_score"],
        breaches=json.dumps(detail.get("breach_names", [])),
        last_checked=datetime.datetime.utcnow(),
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


@app.post("/accounts/{account_id}/rescan", response_model=schemas.MonitoredAccount)
async def rescan_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.MonitoredAccount).filter(models.MonitoredAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        detail = await services.get_detailed_breach_info(account.email, use_cache=False)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    _apply_scan_to_account(account, detail)
    db.commit()
    db.refresh(account)
    return account


@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.MonitoredAccount).filter(models.MonitoredAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"deleted": True, "id": account_id}


@app.get("/org-dashboard/{org_id}")
def get_org_dashboard(org_id: int, db: Session = Depends(get_db)):
    org = db.query(models.Organization).filter(models.Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    accounts = db.query(models.MonitoredAccount).filter(models.MonitoredAccount.org_id == org_id).all()

    total_accounts = len(accounts)
    breached_accounts = sum(1 for a in accounts if len(json.loads(a.breaches)) > 0)
    total_score = sum(a.risk_score for a in accounts)
    avg_score = total_score / total_accounts if total_accounts > 0 else 0
    high_risk_count = sum(1 for a in accounts if a.risk_score > 50)

    accounts_data = []
    for a in accounts:
        accounts_data.append({
            "id": a.id,
            "email": a.email,
            "risk_score": a.risk_score,
            "last_checked": a.last_checked,
            "breaches": json.loads(a.breaches),
        })

    return {
        "org_name": org.name,
        "total_accounts": total_accounts,
        "breached_accounts": breached_accounts,
        "high_risk_count": high_risk_count,
        "average_risk_score": round(avg_score, 2),
        "accounts": accounts_data,
    }


@app.get("/account-detail/{account_id}", response_model=schemas.AccountDetailResponse)
async def get_account_detail(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.MonitoredAccount).filter(models.MonitoredAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    try:
        detail = await services.get_detailed_breach_info(account.email, use_cache=False)
    except ExternalAPIError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    _apply_scan_to_account(account, detail)
    db.commit()

    return {
        "email": detail["email"],
        "risk_score": detail["risk_score"],
        "breaches": detail["breaches"],
        "score_breakdowns": detail["score_breakdowns"],
        "recommendations": detail["recommendations"],
    }


