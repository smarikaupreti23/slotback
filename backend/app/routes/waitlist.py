from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from .. import config
from ..auth import CurrentUser, current_user
from ..db import get_db
from ..schemas import PatientIn

router = APIRouter(tags=["waitlist"])


def parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def days_waiting(added_at: str, until: datetime | None = None) -> int:
    until = until or datetime.now(timezone.utc)
    return max(0, (until - parse_ts(added_at)).days)


def serialize_patient(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "phone": row["phone"],
        "service": row["service"],
        "status": row["status"],
        "days_waiting": days_waiting(row["added_at"]),
    }


def ranked_waitlist() -> list[dict]:
    """Patients still waiting for a slot, longest wait first."""
    rows = (
        get_db()
        .table("waitlist_patients")
        .select("*")
        .in_("status", ["Pending", "Offer Sent"])
        .order("added_at")
        .execute()
        .data
    )
    return rows


@router.get("/config")
def get_config(_: CurrentUser = Depends(current_user)):
    practitioners = (
        get_db().table("practitioners").select("id,name").order("name").execute().data
    )
    return {
        "practitioners": practitioners,
        "time_slots": config.TIME_SLOTS,
        "services": config.SERVICES,
    }


@router.get("/waitlist")
def get_waitlist(_: CurrentUser = Depends(current_user)):
    return [serialize_patient(r) for r in ranked_waitlist()]


@router.post("/waitlist", status_code=201)
def add_patient(body: PatientIn, user: CurrentUser = Depends(current_user)):
    row = (
        get_db()
        .table("waitlist_patients")
        .insert(
            {
                "name": body.name,
                "phone": body.phone,
                "service": body.service,
                "added_by": user.id,
            }
        )
        .execute()
        .data[0]
    )
    return serialize_patient(row)
