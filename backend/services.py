import hashlib
import httpx
import datetime
from urllib.parse import quote
from typing import Any

HTTP_TIMEOUT = 10.0
CACHE_TTL_SECONDS = 3600

_email_check_cache: dict[str, tuple[float, dict]] = {}
_analytics_cache: dict[str, tuple[float, dict]] = {}


class ExternalAPIError(Exception):
    def __init__(self, service: str, status_code: int | None = None):
        self.service = service
        self.status_code = status_code
        super().__init__(f"{service} request failed" + (f" ({status_code})" if status_code else ""))


def _cache_get(cache: dict[str, tuple[float, dict]], key: str) -> dict | None:
    entry = cache.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if datetime.datetime.now().timestamp() > expires_at:
        cache.pop(key, None)
        return None
    return value


def _cache_set(cache: dict[str, tuple[float, dict]], key: str, value: dict) -> None:
    cache[key] = (datetime.datetime.now().timestamp() + CACHE_TTL_SECONDS, value)


def _parse_breach_year(date_str: str) -> int:
    if not date_str:
        return 0
    try:
        if len(date_str) == 4:
            return int(date_str)
        return int(date_str.split("-")[0])
    except (ValueError, IndexError):
        return 0


def calculate_risk_score(breach_count: int, password_leaked: bool, most_recent_breach_year: int = 0) -> float:
    score = 0.0
    score += min(breach_count * 10, 50)
    if password_leaked:
        score += 30
    if most_recent_breach_year > 0:
        current_year = datetime.datetime.now().year
        if current_year - most_recent_breach_year <= 1:
            score += 20
        elif current_year - most_recent_breach_year <= 3:
            score += 10
    return min(score, 100.0)


def build_risk_assessment(parsed_breaches: list[dict[str, str]]) -> dict[str, Any]:
    password_leaked = False
    most_recent_year = 0

    for breach in parsed_breaches:
        exposed_data = breach.get("exposed_data", "")
        if "password" in exposed_data.lower():
            password_leaked = True
        year = _parse_breach_year(breach.get("date", ""))
        if year > most_recent_year:
            most_recent_year = year

    score_breakdowns = []
    score = 0.0

    breach_count_score = min(len(parsed_breaches) * 10, 50)
    if breach_count_score > 0:
        score += breach_count_score
        score_breakdowns.append({
            "description": f"+{breach_count_score} for {len(parsed_breaches)} breach(es) found",
            "score_added": breach_count_score,
        })

    if password_leaked:
        score += 30
        score_breakdowns.append({
            "description": "+30 for exposed passwords",
            "score_added": 30,
        })

    if most_recent_year > 0:
        current_year = datetime.datetime.now().year
        if current_year - most_recent_year <= 1:
            score += 20
            score_breakdowns.append({
                "description": "+20 for very recent breach (within 1 year)",
                "score_added": 20,
            })
        elif current_year - most_recent_year <= 3:
            score += 10
            score_breakdowns.append({
                "description": "+10 for recent breach (within 3 years)",
                "score_added": 10,
            })

    score = min(score, 100.0)

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
        "risk_score": float(score),
        "score_breakdowns": score_breakdowns,
        "recommendations": recommendations,
        "breach_names": [b.get("name", "Unknown") for b in parsed_breaches],
    }


async def check_password_pwned(password: str) -> dict:
    sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix = sha1_hash[:5]
    suffix = sha1_hash[5:]
    url = f"https://api.pwnedpasswords.com/range/{prefix}"

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.get(url)

    if response.status_code != 200:
        raise ExternalAPIError("Have I Been Pwned", response.status_code)

    for line in response.text.splitlines():
        h, count = line.split(":")
        if h == suffix:
            return {"leaked": True, "times_seen": int(count)}

    return {"leaked": False, "times_seen": 0}


async def check_email_breach(email: str) -> dict:
    cached = _cache_get(_email_check_cache, email.lower())
    if cached is not None:
        return cached

    url = f"https://api.xposedornot.com/v1/check-email/{quote(email, safe='')}"

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.get(url)

    if response.status_code == 404:
        result = {"breached": False, "breach_list": []}
        _cache_set(_email_check_cache, email.lower(), result)
        return result

    if response.status_code == 200:
        data = response.json()
        if "breaches" in data and data["breaches"]:
            breaches = data["breaches"]
            if isinstance(breaches, list) and len(breaches) > 0 and isinstance(breaches[0], list):
                breaches = breaches[0]
            result = {"breached": True, "breach_list": breaches}
            _cache_set(_email_check_cache, email.lower(), result)
            return result

    if response.status_code == 429:
        raise ExternalAPIError("XposedOrNot", 429)

    raise ExternalAPIError("XposedOrNot", response.status_code)


async def get_detailed_breach_info(email: str, *, use_cache: bool = True) -> dict:
    if use_cache:
        cached = _cache_get(_analytics_cache, email.lower())
        if cached is not None:
            return cached

    url = f"https://api.xposedornot.com/v1/breach-analytics?email={quote(email, safe='')}"

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        response = await client.get(url)

    breaches_data = []
    if response.status_code == 200:
        data = response.json()
        if data and data.get("ExposedBreaches") and "breaches_details" in data["ExposedBreaches"]:
            breaches_data = data["ExposedBreaches"]["breaches_details"]
    elif response.status_code == 429:
        raise ExternalAPIError("XposedOrNot", 429)
    elif response.status_code not in (404,):
        raise ExternalAPIError("XposedOrNot", response.status_code)

    parsed_breaches = []
    for breach in breaches_data:
        parsed_breaches.append({
            "name": breach.get("breach", "Unknown"),
            "date": breach.get("xposed_date", ""),
            "exposed_data": breach.get("xposed_data", ""),
        })

    assessment = build_risk_assessment(parsed_breaches)
    result = {
        "email": email,
        "risk_score": assessment["risk_score"],
        "breaches": parsed_breaches,
        "score_breakdowns": assessment["score_breakdowns"],
        "recommendations": assessment["recommendations"],
        "breach_names": assessment["breach_names"],
    }
    _cache_set(_analytics_cache, email.lower(), result)
    return result
