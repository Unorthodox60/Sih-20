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

async def get_detailed_breach_info(email: str) -> dict:
    url = f"https://api.xposedornot.com/v1/breach-analytics?email={email}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        
    breaches_data = []
    
    if response.status_code == 200:
        data = response.json()
        if data and data.get("ExposedBreaches") and "breaches_details" in data["ExposedBreaches"]:
            breaches_data = data["ExposedBreaches"]["breaches_details"]
            
    parsed_breaches = []
    password_leaked = False
    most_recent_year = 0
    
    for b in breaches_data:
        name = b.get("breach", "Unknown")
        date_str = b.get("xposed_date", "")
        exposed_data = b.get("xposed_data", "")
        
        parsed_breaches.append({
            "name": name,
            "date": date_str,
            "exposed_data": exposed_data
        })
        
        if "password" in exposed_data.lower():
            password_leaked = True
            
        try:
            year = int(date_str) if len(date_str) == 4 else int(date_str.split('-')[0])
            if year > most_recent_year:
                most_recent_year = year
        except:
            pass

    score_breakdowns = []
    score = 0
    
    # Base breach count: up to 50 points
    breach_count_score = min(len(parsed_breaches) * 10, 50)
    if breach_count_score > 0:
        score += breach_count_score
        score_breakdowns.append({
            "description": f"+{breach_count_score} for {len(parsed_breaches)} breach(es) found",
            "score_added": breach_count_score
        })
        
    if password_leaked:
        score += 30
        score_breakdowns.append({
            "description": "+30 for exposed passwords",
            "score_added": 30
        })
        
    if most_recent_year > 0:
        current_year = datetime.datetime.now().year
        if current_year - most_recent_year <= 1:
            score += 20
            score_breakdowns.append({
                "description": "+20 for very recent breach (within 1 year)",
                "score_added": 20
            })
        elif current_year - most_recent_year <= 3:
            score += 10
            score_breakdowns.append({
                "description": "+10 for recent breach (within 3 years)",
                "score_added": 10
            })

    score = min(score, 100)
    
    recommendations = []
    if password_leaked:
        recommendations.append({"action": "Change passwords immediately for affected accounts."})
    if score > 50:
        recommendations.append({"action": "Enable Two-Factor Authentication (2FA) wherever possible."})
    if len(parsed_breaches) > 0:
        recommendations.append({"action": "Review the exposed data and monitor for phishing emails."})
    if score == 0:
        recommendations.append({"action": "No breaches found. Keep up the good security habits!"})

    return {
        "email": email,
        "risk_score": float(score),
        "breaches": parsed_breaches,
        "score_breakdowns": score_breakdowns,
        "recommendations": recommendations
    }
