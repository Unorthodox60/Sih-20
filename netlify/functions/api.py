import sys
import os

# Ensure the backend directory is in the path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from backend.main import app
from mangum import Mangum

# Wrap the FastAPI app with Mangum to make it compatible with AWS Lambda / Netlify Functions
handler = Mangum(app, api_gateway_base_path="/.netlify/functions/api")
