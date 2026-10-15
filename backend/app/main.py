from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .routes import auth, cancellations, waitlist

app = FastAPI(title="SlotBack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(waitlist.router, prefix="/api")
app.include_router(cancellations.router, prefix="/api")


@app.get("/")
@app.get("/api/health")
def health():
    return {"status": "ok", "service": "slotback-api"}
