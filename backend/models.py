from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Boolean
from sqlalchemy.orm import relationship
import datetime

from database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    accounts = relationship("MonitoredAccount", back_populates="organization")



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


