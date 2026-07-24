from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    email: str
    name: str
    created_at: datetime

class DocumentUploadRequest(BaseModel):
    document_type: str = Field(..., description="Type of document: lab_report, prescription, discharge_summary, etc")
    description: Optional[str] = None

class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    document_type: str
    description: Optional[str] = None
    file_path: str
    status: str
    created_at: datetime
    extracted_text: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role: str  # "user" or "assistant"
    content: str
    confidence: Optional[float] = None
    sources: Optional[List[str]] = None

class ChatRequest(BaseModel):
    document_id: str
    message: str

class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    response: str
    confidence: float
    sources: List[str]
    citations: List[dict]

class LabValue(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    value: float
    unit: str
    reference_range: str
    is_abnormal: bool

class MedicineEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    indication: Optional[str] = None

class DocumentAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: str
    summary: str
    key_findings: List[str]
    lab_values: List[LabValue]
    medicines: List[MedicineEntry]
    abnormalities: List[str]
    recommendations: List[str]
    confidence_score: float

