import hashlib
import httpx
from typing import List, Dict, Any
import datetime

async def check_password_pwned(password: str) -> dict:
    sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]

    url = f"https://api.pwnedpasswords.com/range/{prefix}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    
    if response.status_code != 200:
        return {"leaked": False, "times_seen": 0}
        
    hashes = (line.split(':') for line in response.text.splitlines())
    for h, count in hashes:
        if h == suffix:
            return {"leaked": True, "times_seen": int(count)}
            
    return {"leaked": False, "times_seen": 0}

async def check_email_breach(email: str) -> dict:
    url = f"https://api.xposedornot.com/v1/check-email/{email}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        
    if response.status_code == 404:
        # 404 means no breaches found for this email
        return {"breached": False, "breach_list": []}
        
    if response.status_code == 200:
        data = response.json()
        if "breaches" in data and data["breaches"]:
            breaches = data["breaches"]
            # Sometimes xposedornot returns a nested list: {"breaches": [["Breach1", "Breach2"]]}
            if isinstance(breaches, list) and len(breaches) > 0 and isinstance(breaches[0], list):
                breaches = breaches[0]
            
            return {"breached": True, "breach_list": breaches}
            
    return {"breached": False, "breach_list": []}

def calculate_risk_score(breach_count: int, password_leaked: bool, most_recent_breach_year: int = 0) -> float:
    score = 0.0
    
    # Base breach count: up to 50 points
    score += min(breach_count * 10, 50)
    
    # Password leak is critical
    if password_leaked:
        score += 30
        
    # Recency (if available)
    if most_recent_breach_year > 0:
        current_year = datetime.datetime.now().year
        if current_year - most_recent_breach_year <= 1:
            score += 20
        elif current_year - most_recent_breach_year <= 3:
            score += 10
            
    return min(score, 100.0)
