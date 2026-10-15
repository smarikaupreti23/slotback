from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

TimeSlot = Literal["9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM"]
Service = Literal["Physio", "Podiatry", "Chiro", "Speech Pathology"]


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RegisterIn(LoginIn):
    full_name: str = Field(min_length=2, max_length=80)


class CancellationIn(BaseModel):
    practitioner_id: str
    appointment_date: date
    time_slot: TimeSlot
    patient_name: str = Field(min_length=1, max_length=100)
    reason: str = Field(min_length=1, max_length=300)

    @field_validator("patient_name", "reason")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v


class PatientIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=6, max_length=20, pattern=r"^[0-9+()\s-]+$")
    service: Service = "Physio"

    @field_validator("name", "phone")
    @classmethod
    def strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v
