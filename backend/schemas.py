from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int

    class Config:
        from_attributes = True

class AccountCreate(BaseModel):
    email: str
    org_id: int

class MonitoredAccountBase(BaseModel):
    email: str
    risk_score: float
    last_checked: datetime
    breaches: str

class MonitoredAccount(MonitoredAccountBase):
    id: int
    org_id: int

    class Config:
        from_attributes = True

class PasswordCheckResponse(BaseModel):
    leaked: bool
    times_seen: int

class EmailCheckResponse(BaseModel):
    breached: bool
    breach_list: List[str]

class BreachDetail(BaseModel):
    name: str
    date: str
    exposed_data: str

class ScoreBreakdown(BaseModel):
    description: str
    score_added: int

class RecommendedAction(BaseModel):
    action: str

class AccountDetailResponse(BaseModel):
    email: str
    risk_score: float
    breaches: List[BreachDetail]
    score_breakdowns: List[ScoreBreakdown]
    recommendations: List[RecommendedAction]
