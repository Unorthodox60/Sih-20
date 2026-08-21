from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime

from database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    accounts = relationship("MonitoredAccount", back_populates="organization")
    honey_tokens = relationship("HoneyToken", back_populates="organization")


class MonitoredAccount(Base):
    __tablename__ = "monitored_accounts"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    risk_score = Column(Float, default=0.0)
    last_checked = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Store JSON strings for simplicity in SQLite
    breaches = Column(String, default="[]") 
    
    organization = relationship("Organization", back_populates="accounts")

class HoneyToken(Base):
    __tablename__ = "honey_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    label = Column(String, default="Decoy Credential")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    trigger_ip = Column(String, nullable=True)
    trigger_user_agent = Column(String, nullable=True)

    organization = relationship("Organization", back_populates="honey_tokens")
