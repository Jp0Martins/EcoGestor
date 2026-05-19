from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from . import models, schemas
import uuid
from datetime import datetime


# --- Consumo ---
async def create_consumo(db: AsyncSession, obj: schemas.ConsumoCreate):
    consumo = models.Consumo(**obj.dict())
    db.add(consumo)
    await db.commit()
    await db.refresh(consumo)
    return consumo


async def get_consumos(db: AsyncSession, empresa_id, setor_id=None):
    query = select(models.Consumo).where(models.Consumo.empresa_id == empresa_id)
    if setor_id:
        query = query.where(models.Consumo.setor_id == setor_id)
    query = query.order_by(models.Consumo.data.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_consumo(db: AsyncSession, consumo_id, obj: schemas.ConsumoCreate):
    result = await db.execute(
        select(models.Consumo).where(models.Consumo.id == consumo_id)
    )
    consumo = result.scalar_one_or_none()
    if not consumo:
        return None
    for field, value in obj.dict().items():
        setattr(consumo, field, value)
    await db.commit()
    await db.refresh(consumo)
    return consumo


async def delete_consumo(db: AsyncSession, consumo_id):
    result = await db.execute(
        select(models.Consumo).where(models.Consumo.id == consumo_id)
    )
    consumo = result.scalar_one_or_none()
    if not consumo:
        return False
    await db.delete(consumo)
    await db.commit()
    return True


# --- Meta ---
async def create_meta(db: AsyncSession, obj: schemas.MetaCreate):
    meta = models.Meta(**obj.dict())
    db.add(meta)
    await db.commit()
    await db.refresh(meta)
    return meta


async def get_metas(db: AsyncSession, empresa_id, setor_id=None):
    query = select(models.Meta).where(models.Meta.empresa_id == empresa_id)
    if setor_id:
        query = query.where(models.Meta.setor_id == setor_id)
    query = query.order_by(models.Meta.data_limite.desc())
    result = await db.execute(query)
    return result.scalars().all()


async def update_meta(db: AsyncSession, meta_id, obj: schemas.MetaCreate):
    result = await db.execute(select(models.Meta).where(models.Meta.id == meta_id))
    meta = result.scalar_one_or_none()
    if not meta:
        return None
    for field, value in obj.dict().items():
        setattr(meta, field, value)
    await db.commit()
    await db.refresh(meta)
    return meta


async def delete_meta(db: AsyncSession, meta_id):
    result = await db.execute(select(models.Meta).where(models.Meta.id == meta_id))
    meta = result.scalar_one_or_none()
    if not meta:
        return False
    await db.delete(meta)
    await db.commit()
    return True


# --- Relatorio ---
async def listar_relatorios(db: AsyncSession, empresa_id: uuid.UUID, ano: str):
    query = (
        select(models.Relatorio)
        .where(
            models.Relatorio.empresa_id == empresa_id, models.Relatorio.periodo == ano
        )
        .order_by(models.Relatorio.data.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


async def criar_relatorio(
    db: AsyncSession, obj: schemas.RelatorioBase, arquivo_pdf: str
):
    relatorio = models.Relatorio(
        id=str(uuid.uuid4()),
        empresa_id=obj.empresa_id,
        tipo=obj.tipo,
        periodo=obj.periodo,
        data=datetime.utcnow(),
        arquivo=arquivo_pdf,
    )
    db.add(relatorio)
    await db.commit()
    await db.refresh(relatorio)
    return relatorio
