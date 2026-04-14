import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, Integer, Text, DateTime, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database.connection import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    anthropic_api_key = Column(Text, nullable=True)  # encrypted
    created_at = Column(DateTime, default=datetime.utcnow)

    agents = relationship("Agent", back_populates="user", cascade="all, delete-orphan")
    connectors = relationship("Connector", back_populates="user", cascade="all, delete-orphan")


class Agent(Base):
    __tablename__ = "agents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    industry = Column(String, nullable=True)
    status = Column(String, default="draft")  # active, paused, draft
    trigger_type = Column(String, nullable=True)  # email, schedule, webhook
    trigger_config = Column(JSON, default=dict)
    tools_enabled = Column(JSON, default=list)
    system_prompt = Column(Text, nullable=True)
    guardrails = Column(JSON, default=list)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="agents")
    runs = relationship("TaskRun", back_populates="agent", cascade="all, delete-orphan")
    versions = relationship("AgentVersion", back_populates="agent", cascade="all, delete-orphan")
    agent_connectors = relationship("AgentConnector", back_populates="agent", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="agent", cascade="all, delete-orphan")


class AgentVersion(Base):
    __tablename__ = "agent_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    snapshot = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="versions")


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    service = Column(String, nullable=False)  # gmail, shopify, slack, supabase
    display_name = Column(String, nullable=False)
    credentials = Column(Text, nullable=False)  # AES-encrypted JSON string
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="connectors")
    agent_connectors = relationship("AgentConnector", back_populates="connector", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("user_id", "service", name="uq_user_service"),)


class AgentConnector(Base):
    __tablename__ = "agent_connectors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False)
    connector_id = Column(UUID(as_uuid=True), ForeignKey("connectors.id"), nullable=False)

    agent = relationship("Agent", back_populates="agent_connectors")
    connector = relationship("Connector", back_populates="agent_connectors")

    __table_args__ = (UniqueConstraint("agent_id", "connector_id", name="uq_agent_connector"),)


class TaskRun(Base):
    __tablename__ = "task_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    trigger_data = Column(JSON, default=dict)
    status = Column(String, default="running")  # running, completed, escalated, failed
    intent = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    tools_called = Column(JSON, default=list)
    ai_calls = Column(JSON, default=list)
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text, nullable=True)
    output = Column(JSON, default=dict)
    cost_usd = Column(Float, default=0.0)
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="runs")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("Agent", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(384), nullable=True)  # all-MiniLM-L6-v2 dimension
    chunk_index = Column(Integer, nullable=False)

    document = relationship("Document", back_populates="chunks")
