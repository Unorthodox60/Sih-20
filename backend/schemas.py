from pydantic import BaseModel, EmailStr
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
    email: EmailStr
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


class PasswordCheckRequest(BaseModel):
    password: str


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

class HoneyTokenCreate(BaseModel):
    org_id: int
    label: Optional[str] = "Decoy Credential"

class HoneyToken(BaseModel):
    id: int
    token: str
    org_id: int
    label: str
    created_at: datetime
    triggered: bool
    triggered_at: Optional[datetime] = None
    trigger_ip: Optional[str] = None
    trigger_user_agent: Optional[str] = None

    class Config:
        from_attributes = True
