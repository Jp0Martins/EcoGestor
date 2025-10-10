from fastapi import FastAPI, Depends, Query, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from . import models, schemas, crud
from .db import get_db
from .reports import pdf_generator, logic
from uuid import UUID
import os

app = FastAPI(title="EcoGestor Consumos API")

# --- CORS ---
from .cors import setup_cors

setup_cors(app)


# -------- CONSUMOS --------
@app.post("/api/consumos", response_model=schemas.ConsumoOut)
async def create_consumo(
    consumo: schemas.ConsumoCreate, db: AsyncSession = Depends(get_db)
):
    result = await crud.create_consumo(db, consumo)
    return result


@app.get("/api/consumos", response_model=list[schemas.ConsumoOut])
async def list_consumos(
    empresa_id: UUID, setor_id: UUID = Query(None), db: AsyncSession = Depends(get_db)
):
    result = await crud.get_consumos(db, empresa_id, setor_id)
    return result


@app.put("/api/consumos/{consumo_id}", response_model=schemas.ConsumoOut)
async def update_consumo(
    consumo_id: UUID, consumo: schemas.ConsumoCreate, db: AsyncSession = Depends(get_db)
):
    result = await crud.update_consumo(db, consumo_id, consumo)
    if not result:
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    return result


@app.delete("/api/consumos/{consumo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consumo(consumo_id: UUID, db: AsyncSession = Depends(get_db)):
    ok = await crud.delete_consumo(db, consumo_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Consumo não encontrado")
    return


# -------- METAS --------
@app.post("/api/metas", response_model=schemas.MetaOut)
async def create_meta(meta: schemas.MetaCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_meta(db, meta)


@app.get("/api/metas", response_model=list[schemas.MetaOut])
async def list_metas(
    empresa_id: UUID, setor_id: UUID = Query(None), db: AsyncSession = Depends(get_db)
):
    return await crud.get_metas(db, empresa_id, setor_id)


@app.put("/api/metas/{meta_id}", response_model=schemas.MetaOut)
async def update_meta(
    meta_id: UUID, meta: schemas.MetaCreate, db: AsyncSession = Depends(get_db)
):
    result = await crud.update_meta(db, meta_id, meta)
    if not result:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    return result


@app.delete("/api/metas/{meta_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_meta(meta_id: UUID, db: AsyncSession = Depends(get_db)):
    ok = await crud.delete_meta(db, meta_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    return


# -------- RELATORIOS --------
@app.get("/api/reports/anos", response_model=list)
async def listar_anos_disponiveis(empresa_id: UUID, db: AsyncSession = Depends(get_db)):
    consumos = await crud.get_consumos(db, empresa_id)
    anos = logic.anos_disponiveis_para_empresa(consumos)
    return anos


@app.post("/api/reports")
async def gerar_relatorio(
    body: schemas.RelatorioBase, db: AsyncSession = Depends(get_db)
):
    consumos = await crud.get_consumos(db, body.empresa_id)
    empresa_nome = "Empresa"  # Troque por busca real se quiser
    dados = logic.resumo_sumario(consumos)
    pdf_bytes = pdf_generator.gerar_relatorio_pdf(dados, body.periodo, empresa_nome)
    filename = f"relatorio_{body.periodo}.pdf"
    headers = {"Content-Disposition": f"attachment; filename={filename}"}
    return Response(pdf_bytes, media_type="application/pdf", headers=headers)
