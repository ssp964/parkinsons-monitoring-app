from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

# Doctor Schemas
class DoctorBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None

class DoctorCreate(DoctorBase):
    password: str

class DoctorLogin(BaseModel):
    email: EmailStr
    password: str

class DoctorResponse(BaseModel):
    success: bool
    doctor_id: str
    email: str
    access_token: str
    token_type: str = "bearer"

class Doctor(BaseModel):
    doctor_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PatientBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    age: int
    gender: str
    phone: str

class PatientCreate(PatientBase):
    password: str

class PatientResponse(BaseModel):
    success: bool
    patient_id: str
    email: str
    access_token: str

class Patient(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    age: int
    gender: str
    phone: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class PatientProfile(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    age: int
    gender: str
    phone: str
    patient_id: str

    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    patient_id: str
    email: str
    access_token: str
    token_type: str = "bearer"

