import os

from dotenv import load_dotenv

# Loads backend/.env locally; on Vercel the variables come from the project settings.
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

CORS_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"]
SERVICES = ["Physio", "Podiatry", "Chiro", "Speech Pathology"]
OFFERS_PER_SLOT = 3
