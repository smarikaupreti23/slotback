from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from .. import config
from ..auth import CurrentUser, current_user
from ..db import get_db
from ..schemas import CancellationIn
from .waitlist import days_waiting, parse_ts, ranked_waitlist, serialize_patient

router = APIRouter(prefix="/cancellations", tags=["cancellations"])

SELECT_WITH_PRACTITIONER = "*, practitioners(name)"


def _serialize(row: dict) -> dict:
    practitioner = row.pop("practitioners", None) or {}
    row["practitioner_name"] = practitioner.get("name")
    return row


def _get_cancellation(cancellation_id: str) -> dict:
    rows = (
        get_db()
        .table("cancellations")
        .select(SELECT_WITH_PRACTITIONER)
        .eq("id", cancellation_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(404, "Cancellation not found")
    return _serialize(rows[0])


def _offers_with_patients(cancellation_id: str) -> list[dict]:
    rows = (
        get_db()
        .table("offers")
        .select("*, waitlist_patients(name,phone,added_at)")
        .eq("cancellation_id", cancellation_id)
        .order("rank")
        .execute()
        .data
    )
    for r in rows:
        p = r.pop("waitlist_patients", None) or {}
        r["patient_name"] = p.get("name")
        r["patient_phone"] = p.get("phone")
        r["patient_added_at"] = p.get("added_at")
    return rows


@router.post("", status_code=201)
def create_cancellation(body: CancellationIn, user: CurrentUser = Depends(current_user)):
    db = get_db()
    if not db.table("practitioners").select("id").eq("id", body.practitioner_id).execute().data:
        raise HTTPException(422, "Unknown practitioner")
    row = (
        db.table("cancellations")
        .insert(
            {
                "practitioner_id": body.practitioner_id,
                "appointment_date": body.appointment_date.isoformat(),
                "time_slot": body.time_slot,
                "patient_name": body.patient_name,
                "reason": body.reason,
                "created_by": user.id,
            }
        )
        .execute()
        .data[0]
    )
    return _get_cancellation(row["id"])


@router.get("/{cancellation_id}")
def read_cancellation(cancellation_id: str, _: CurrentUser = Depends(current_user)):
    return _get_cancellation(cancellation_id)


@router.post("/{cancellation_id}/offers")
def send_offers(cancellation_id: str, _: CurrentUser = Depends(current_user)):
    """Sends (simulated SMS) offers to the longest-waiting patients."""
    db = get_db()
    c = _get_cancellation(cancellation_id)
    if c["status"] == "Filled":
        raise HTTPException(409, "This slot has already been filled")
    if c["status"] == "Offers Sent":
        return {"cancellation": c, "offers": _offers_with_patients(cancellation_id)}

    pending = [p for p in ranked_waitlist() if p["status"] == "Pending"]
    top = pending[: config.OFFERS_PER_SLOT]
    if not top:
        raise HTTPException(400, "There are no waitlisted patients to notify")

    db.table("offers").insert(
        [
            {"cancellation_id": cancellation_id, "patient_id": p["id"], "rank": i + 1}
            for i, p in enumerate(top)
        ]
    ).execute()
    db.table("waitlist_patients").update({"status": "Offer Sent"}).in_(
        "id", [p["id"] for p in top]
    ).execute()
    db.table("cancellations").update({"status": "Offers Sent"}).eq(
        "id", cancellation_id
    ).execute()

    return {
        "cancellation": _get_cancellation(cancellation_id),
        "offers": _offers_with_patients(cancellation_id),
        "waitlist": [serialize_patient(r) for r in ranked_waitlist()],
    }


@router.post("/{cancellation_id}/accept")
def accept_first_offer(cancellation_id: str, _: CurrentUser = Depends(current_user)):
    """Simulates the first patient replying 'YES'. First accept wins; every other
    outstanding offer is cancelled so double booking is impossible."""
    db = get_db()
    c = _get_cancellation(cancellation_id)
    if c["status"] == "Filled":
        return _summary(cancellation_id)
    if c["status"] != "Offers Sent":
        raise HTTPException(409, "Send offers before accepting")

    offers = _offers_with_patients(cancellation_id)
    winner, others = offers[0], offers[1:]
    now = datetime.now(timezone.utc).isoformat()

    db.table("offers").update({"status": "Accepted", "responded_at": now}).eq(
        "id", winner["id"]
    ).execute()
    if others:
        db.table("offers").update({"status": "Cancelled", "responded_at": now}).in_(
            "id", [o["id"] for o in others]
        ).execute()
        db.table("waitlist_patients").update({"status": "Pending"}).in_(
            "id", [o["patient_id"] for o in others]
        ).execute()
    db.table("waitlist_patients").update({"status": "Confirmed"}).eq(
        "id", winner["patient_id"]
    ).execute()
    db.table("cancellations").update(
        {"status": "Filled", "filled_by": winner["patient_id"], "filled_at": now}
    ).eq("id", cancellation_id).execute()

    return _summary(cancellation_id)


def _format_duration(seconds: float) -> str:
    seconds = max(0, int(seconds))
    if seconds < 60:
        return "< 60s"
    return f"{seconds // 60}m {seconds % 60:02d}s"


def _summary(cancellation_id: str) -> dict:
    c = _get_cancellation(cancellation_id)
    offers = _offers_with_patients(cancellation_id)
    winner = next((o for o in offers if o["status"] == "Accepted"), None)

    time_to_fill = None
    waited = None
    if winner and c.get("filled_at"):
        filled_at = parse_ts(c["filled_at"])
        time_to_fill = _format_duration((filled_at - parse_ts(c["created_at"])).total_seconds())
        waited = days_waiting(winner["patient_added_at"], filled_at)

    waitlist = ranked_waitlist()
    return {
        "cancellation": c,
        "offers": offers,
        "winner": winner and {"name": winner["patient_name"], "days_waited": waited},
        "notified": [o["patient_name"] for o in offers],
        "cancelled_offers": [o["patient_name"] for o in offers if o["status"] == "Cancelled"],
        "next_in_line": waitlist[0]["name"] if waitlist else None,
        "time_to_fill": time_to_fill,
    }


@router.get("/{cancellation_id}/summary")
def read_summary(cancellation_id: str, _: CurrentUser = Depends(current_user)):
    return _summary(cancellation_id)
