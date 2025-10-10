from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime


class ConsumoBase(BaseModel):
    fonte: str
    data: date
    valor: float
    custo: float
    observacoes: Optional[str] = None
    empresa_id: UUID
    setor_id: UUID
    usuario_id: UUID


class ConsumoCreate(ConsumoBase):
    pass


class ConsumoOut(ConsumoBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---- METAS ----


class MetaBase(BaseModel):
    empresa_id: UUID
    setor_id: UUID
    fonte: str
    percentual_reducao: float
    data_limite: date


class MetaCreate(MetaBase):
    pass


class MetaOut(MetaBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ---- RELATORIOS ----


class RelatorioBase(BaseModel):
    empresa_id: UUID
    tipo: str
    periodo: str


class RelatorioOut(RelatorioBase):
    id: str
    data: str
    url: Optional[str] = None
