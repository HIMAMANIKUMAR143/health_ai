from sqlalchemy import Column, String, DateTime, Text, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import uuid

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    documents = relationship("Document", back_populates="user", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String)
    document_type = Column(String)  # lab_report, prescription, discharge_summary, etc
    description = Column(String, nullable=True)
    file_path = Column(String)
    extracted_text = Column(Text, nullable=True)
    status = Column(String, default="processing")  # processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="documents")
    embeddings = relationship("DocumentEmbedding", back_populates="document", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="document", cascade="all, delete-orphan")
    lab_values = relationship("LabValue", back_populates="document", cascade="all, delete-orphan")
    medicines = relationship("Medicine", back_populates="document", cascade="all, delete-orphan")

class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    chunk_index = Column(Integer)
    text_chunk = Column(Text)
    embedding = Column(String)  # Stored as JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="embeddings")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    user_message = Column(Text)
    assistant_response = Column(Text)
    confidence_score = Column(Float)
    sources = Column(String)  # JSON array of source references
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="chat_history")

class LabValue(Base):
    __tablename__ = "lab_values"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    test_name = Column(String)
    value = Column(Float)
    unit = Column(String)
    reference_range = Column(String)
    is_abnormal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="lab_values")

class Medicine(Base):
    __tablename__ = "medicines"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"))
    medicine_name = Column(String)
    dosage = Column(String)
    frequency = Column(String)
    duration = Column(String, nullable=True)
    indication = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="medicines")

