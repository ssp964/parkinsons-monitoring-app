from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from database import get_db, engine, SessionLocal
import models, schemas
from typing import List, Union, Optional
import uuid
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import io
from fastapi.middleware.cors import CORSMiddleware

# Add these constants for JWT
SECRET_KEY = "kaCqDqiOhMEToozcCJ0WN5_eVJgVJjr3BrKe8Zx9Fw0"  # Change this to a secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Update the token creation function with Union type
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Parkinson's Tracking System API")
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.0.0.118:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/health")
async def health_check():
    db = None
    try:
        # Verify database connection
        db = SessionLocal()
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )
    finally:
        if db:
            db.close()


# Signup route for patients
@app.post("/signup/", response_model=schemas.PatientResponse)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    try:
        hashed_password = pwd_context.hash(patient.password)
        db_patient = models.Patient(
            first_name=patient.first_name,
            last_name=patient.last_name,
            doctor_id=patient.doctor_id,
            email=patient.email,
            age=patient.age,
            gender=patient.gender,
            phone=patient.phone,
            password_hash=hashed_password
        )
        db.add(db_patient)
        db.commit()
        db.refresh(db_patient)
        
        # Create access token with expiration
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_patient.email},
            expires_delta=access_token_expires
        )
        
        return schemas.PatientResponse(
            success=True,
            patient_id=str(db_patient.patient_id),
            email=db_patient.email,
            access_token=access_token
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create patient: {str(e)}"
        )

@app.get("/patients/", response_model=List[schemas.Patient])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

# Login route for patients
@app.post("/login/", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Find the patient by email
    patient = db.query(models.Patient).filter(models.Patient.email == credentials.email).first()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not pwd_context.verify(credentials.password, patient.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": patient.email},
        expires_delta=access_token_expires
    )
    
    return schemas.LoginResponse(
        success=True,
        patient_id=patient.patient_id,
        email=patient.email,
        access_token=access_token
    )

# Optional: Add a function to get current user for protected routes
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    patient = db.query(models.Patient).filter(models.Patient.email == email).first()
    if patient is None:
        raise credentials_exception
        
    return patient

# Example of a protected route
@app.get("/patients/me/", response_model=schemas.Patient)
async def read_users_me(current_user: models.Patient = Depends(get_current_user)):
    return current_user


# Profile route for patients
@app.get("/profile/", response_model=schemas.PatientProfile)
async def get_patient_profile(current_user: models.Patient = Depends(get_current_user)):
    """
    Get detailed profile information for the currently logged-in patient.
    Requires a valid JWT token.
    """
    try:
        return schemas.PatientProfile(
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            email=current_user.email,
            age=current_user.age,
            gender=current_user.gender,
            phone=current_user.phone,
            patient_id=str(current_user.patient_id)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile: {str(e)}"
        )

# Doctor signup route
@app.post("/doctors/signup/", response_model=schemas.DoctorResponse)
async def create_doctor(doctor: schemas.DoctorCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    db_doctor = db.query(models.Doctor).filter(models.Doctor.email == doctor.email).first()
    if db_doctor:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    try:
        # Create new doctor
        hashed_password = pwd_context.hash(doctor.password)
        db_doctor = models.Doctor(
            first_name=doctor.first_name,
            last_name=doctor.last_name,
            email=doctor.email,
            phone=doctor.phone,
            password_hash=hashed_password
        )
        
        db.add(db_doctor)
        db.commit()
        db.refresh(db_doctor)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_doctor.email, "role": "doctor"},
            expires_delta=access_token_expires
        )
        
        return schemas.DoctorResponse(
            success=True,
            doctor_id=db_doctor.doctor_id,
            email=db_doctor.email,
            access_token=access_token
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create doctor: {str(e)}"
        )

# Doctor login route
@app.post("/doctors/login/", response_model=schemas.DoctorResponse)
async def login_doctor(credentials: schemas.DoctorLogin, db: Session = Depends(get_db)):
    # Find doctor by email
    doctor = db.query(models.Doctor).filter(models.Doctor.email == credentials.email).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not pwd_context.verify(credentials.password, doctor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": doctor.email, "role": "doctor"},
        expires_delta=access_token_expires
    )
    
    return schemas.DoctorResponse(
        success=True,
        doctor_id=doctor.doctor_id,
        email=doctor.email,
        access_token=access_token
    )

# Get current doctor helper function
async def get_current_doctor(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None or role != "doctor":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    doctor = db.query(models.Doctor).filter(models.Doctor.email == email).first()
    if doctor is None:
        raise credentials_exception
        
    return doctor

# Protected doctor profile route
@app.get("/doctors/me/", response_model=schemas.Doctor)
async def read_doctor_profile(current_doctor: models.Doctor = Depends(get_current_doctor)):
    return current_doctor

@app.get("/patients/{patient_id}", response_model=schemas.Patient)
async def get_patient_by_id(
    patient_id: str,
    current_doctor: models.Doctor = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """
    Get patient data by patient ID.
    Only accessible by authenticated doctors.
    """
    try:
        patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
        
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
            
        return patient
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching patient data: {str(e)}"
        )

