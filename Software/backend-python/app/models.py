import uuid
from sqlalchemy import Column, String, Date, DECIMAL, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Consumo(Base):
    __tablename__ = "consumos"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id = Column(UUID(as_uuid=True), nullable=False)
    empresa_id = Column(UUID(as_uuid=True), nullable=False)
    setor_id = Column(UUID(as_uuid=True), nullable=False)
    fonte = Column(String(10), nullable=False)  # 'agua' ou 'energia'
    data = Column(Date, nullable=False)
    valor = Column(DECIMAL, nullable=False)
    custo = Column(DECIMAL, nullable=False)
    observacoes = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)


class Meta(Base):
    __tablename__ = "metas"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    empresa_id = Column(UUID(as_uuid=True), nullable=False)
    setor_id = Column(UUID(as_uuid=True), nullable=False)
    fonte = Column(String(20), nullable=False)  # 'agua' ou 'energia'
    percentual_reducao = Column(DECIMAL, nullable=False)
    data_limite = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Relatorio(Base):
    __tablename__ = "relatorios"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    empresa_id = Column(UUID(as_uuid=True), nullable=False)
    tipo = Column(String(40), nullable=False)
    periodo = Column(String(8), nullable=False)  # Ex: "2025"
    data = Column(DateTime, default=datetime.utcnow)
    arquivo = Column(String(200))
