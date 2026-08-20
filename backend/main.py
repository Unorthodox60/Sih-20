import json
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

import models, schemas, services
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Credential Leak Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/check-password", response_model=schemas.PasswordCheckResponse)
async def check_password(password: str):
    return await services.check_password_pwned(password)

@app.get("/check-email", response_model=schemas.EmailCheckResponse)
async def check_email(email: str):
    return await services.check_email_breach(email)

@app.post("/register-org", response_model=schemas.Organization)
def register_org(org: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    db_org = db.query(models.Organization).filter(models.Organization.name == org.name).first()
    if db_org:
        return db_org
    
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
        models.MonitoredAccount.email == account.email,
        models.MonitoredAccount.org_id == account.org_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Account already monitored in this org")

    # Perform scan on add
    email_res = await services.check_email_breach(account.email)
    breaches_list = email_res["breach_list"]
    
    # Calculate score based on breaches only (since we don't have their password here)
    score = services.calculate_risk_score(len(breaches_list), password_leaked=False, most_recent_breach_year=0)
    
    new_account = models.MonitoredAccount(
        email=account.email,
        org_id=account.org_id,
        risk_score=score,
        breaches=json.dumps(breaches_list)
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

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
    
    # Check how many high risk accounts (score > 50)
    high_risk_count = sum(1 for a in accounts if a.risk_score > 50)
    
    accounts_data = []
    for a in accounts:
        accounts_data.append({
            "id": a.id,
            "email": a.email,
            "risk_score": a.risk_score,
            "last_checked": a.last_checked,
            "breaches": json.loads(a.breaches)
        })
        
    return {
        "org_name": org.name,
        "total_accounts": total_accounts,
        "breached_accounts": breached_accounts,
        "high_risk_count": high_risk_count,
        "average_risk_score": round(avg_score, 2),
        "accounts": accounts_data
    }

@app.get("/account-detail/{account_id}", response_model=schemas.AccountDetailResponse)
async def get_account_detail(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.MonitoredAccount).filter(models.MonitoredAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    return await services.get_detailed_breach_info(account.email)

# Serve Frontend static assets
app.mount("/assets", StaticFiles(directory="../frontend/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # If the user asks for a file that exists in the root of dist (like favicon.svg), we should serve it.
    dist_path = f"../frontend/dist/{full_path}"
    if os.path.isfile(dist_path):
        return FileResponse(dist_path)
    return FileResponse("../frontend/dist/index.html")
