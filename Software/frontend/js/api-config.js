// Centraliza as URLs das APIs para evitar CORS/origin inconsistentes.
// Recomendo padronizar tudo em 127.0.0.1 (front e back) quando estiver usando Live Server.

window.API_BASE_PY = "http://127.0.0.1:8000";   // Backend Python (FastAPI)
window.API_BASE_JAVA = "http://127.0.0.1:8080"; // Backend Java (Spring)

// Backend Python - Consumos
window.API_URL = `${window.API_BASE_PY}/api/consumos`;

// Backend Java - Setores
window.SETORES_API = `${window.API_BASE_JAVA}/api/setores`;

// Backend Python - Metas
window.METAS_API = `${window.API_BASE_PY}/api/metas`;