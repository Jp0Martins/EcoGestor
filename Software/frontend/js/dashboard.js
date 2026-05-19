// NÃO defina URLs fixas aqui
const API_URL = window.API_URL;
const SETORES_API = window.SETORES_API;
const METAS_API = window.METAS_API;

// Configurações (ajustar conforme realidade)
const CONFIG = {
    fatorCO2: 0.44, // kg CO₂ por kWh (médio Brasil)
    tarifaEnergia: 0.85, // R$/kWh (médio Brasil - ajustar)
    tarifaAgua: 5.20 // R$/m³ (médio Brasil - ajustar)
};

async function fetchConsumosUltimosMeses(user, meses = 6) {
    try {
        const resp = await fetch(`${API_URL}?empresa_id=${user.empresa.id}`);
        if (!resp.ok) return { tabela: [], mesesFiltro: [] };
        const consumos = await resp.json();

        const dataAtual = new Date();
        const mesesFiltro = [];
        let dataRef = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
        
        for (let i = 0; i < meses; i++) {
            mesesFiltro.unshift(new Date(dataRef));
            dataRef.setMonth(dataRef.getMonth() - 1);
        }

        const mesesKeys = mesesFiltro.map(d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        
        const setores = await fetchSetores(user);
        
        const tabela = [];
        for (const setor of setores) {
            for (const fonte of ["energia", "agua"]) {
                const linha = { 
                    setor: setor.nome, 
                    setor_id: setor.id,
                    fonte, 
                    valores: [] 
                };
                
                for (const mesKey of mesesKeys) {
                    const consumoMes = consumos.find(x =>
                        x.setor_id === setor.id &&
                        x.fonte === fonte &&
                        x.data.startsWith(mesKey)
                    );
                    
                    linha.valores.push(consumoMes ? { 
                        valor: consumoMes.valor, 
                        custo: consumoMes.custo,
                        observacoes: consumoMes.observacoes 
                    } : { 
                        valor: 0, 
                        custo: 0, 
                        observacoes: "" 
                    });
                }
                tabela.push(linha);
            }
        }
        
        return { tabela, mesesFiltro };
    } catch (error) {
        console.error("Erro ao buscar consumos:", error);
        return { tabela: [], mesesFiltro: [] };
    }
}

async function fetchSetores(user) {
    try {
        const resp = await fetch(`${SETORES_API}?empresa_id=${user.empresa.id}`);
        return resp.ok ? await resp.json() : [];
    } catch (error) {
        console.error("Erro ao buscar setores:", error);
        return [];
    }
}

async function fetchMetas(user) {
    try {
        const resp = await fetch(`${METAS_API}?empresa_id=${user.empresa.id}`);
        return resp.ok ? await resp.json() : [];
    } catch (error) {
        console.error("Erro ao buscar metas:", error);
        return [];
    }
}

// Cálculo de CO₂ EVITADO (correto)
function calcularCO2Evitado(consumoAtual, consumoReferencia) {
    if (!consumoReferencia || consumoReferencia === 0) return 0;
    
    const reducaoConsumo = Math.max(0, consumoReferencia - consumoAtual);
    return Math.round(reducaoConsumo * CONFIG.fatorCO2);
}

// Cálculo de economia financeira
function calcularEconomia(consumoAtual, consumoReferencia, tarifa) {
    if (!consumoReferencia || consumoReferencia === 0) return 0;
    
    const reducaoConsumo = Math.max(0, consumoReferencia - consumoAtual);
    return reducaoConsumo * tarifa;
}

// Buscar consumo de referência (mês anterior ou período equivalente)
function buscarConsumoReferencia(tabela, fonte, mesesFiltro, mesAtualIndex = 5) {
    if (mesAtualIndex <= 0) return 0;
    
    return tabela
        .filter(l => l.fonte === fonte)
        .reduce((soma, l) => soma + (l.valores[mesAtualIndex - 1]?.valor || 0), 0);
}

// Calcular progresso das metas
async function calcularProgressoMetas(metas, tabela, mesesFiltro) {
    const mesAtualIndex = mesesFiltro.length - 1; // Último mês
    
    return await Promise.all(
        metas.map(meta => {
            const consumoAtual = tabela
                .filter(l => l.setor_id === meta.setor_id && l.fonte === meta.fonte)
                .reduce((soma, l) => soma + (l.valores[mesAtualIndex]?.valor || 0), 0);
            
            const consumoReferencia = buscarConsumoReferencia(
                tabela.filter(l => l.setor_id === meta.setor_id), 
                meta.fonte, 
                mesesFiltro, 
                mesAtualIndex
            );
            
            if (!consumoReferencia || consumoReferencia === 0) {
                return { ...meta, progresso: 0, atingida: false };
            }
            
            const reducaoPercentual = ((consumoReferencia - consumoAtual) / consumoReferencia) * 100;
            const progresso = Math.min(1, Math.max(0, reducaoPercentual / meta.percentual_reducao));
            const atingida = reducaoPercentual >= meta.percentual_reducao;
            
            return {
                ...meta,
                progresso,
                atingida,
                reducaoPercentual: Math.round(reducaoPercentual * 10) / 10
            };
        })
    );
}

function formatMonthShort(date) {
    return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
}

function formatPercent(p) {
    return Math.round(p * 100) + "%";
}

function formatKWh(v) {
    return typeof v === 'number' ? v.toLocaleString('pt-BR') + " kWh" : v;
}

function formatM3(v) {
    return typeof v === 'number' ? v.toLocaleString('pt-BR') + " m³" : v;
}

function formatCurrency(v) {
    return typeof v === 'number' ? "R$ " + v.toFixed(2) : v;
}

function calcularDiferencaPercentual(atual, anterior) {
    if (!anterior || anterior === 0) return "0%";
    const diff = ((atual - anterior) / anterior) * 100;
    return (diff > 0 ? "+" : "") + diff.toFixed(1) + "%";
}

function getVariacaoClass(diff) {
    if (diff.startsWith('-')) return 'text-success'; // Redução = bom
    if (diff.startsWith('+')) return 'text-danger';  // Aumento = ruim
    return 'text-muted';
}

async function renderDashboard() {
    const user = getCurrentUser();
    if (!user || !user.empresa || !user.id) {
        document.getElementById("app").innerHTML = `<div class="alert alert-danger">Usuário não autenticado!</div>`;
        return;
    }

    try {
        const { tabela, mesesFiltro } = await fetchConsumosUltimosMeses(user, 6);
        const metas = await fetchMetas(user);
        const metasComProgresso = await calcularProgressoMetas(metas, tabela, mesesFiltro);

        const mesAtualIndex = mesesFiltro.length - 1; // Último mês (mais recente)
        const mesAnteriorIndex = mesesFiltro.length - 2;

        // CÁLCULOS PRINCIPAIS
        // Consumos totais (últimos 6 meses)
        const energiaTotal = tabela
            .filter(l => l.fonte === "energia")
            .reduce((soma, l) => soma + l.valores.reduce((ss, v) => ss + (v.valor || 0), 0), 0);
            
        const aguaTotal = tabela
            .filter(l => l.fonte === "agua")
            .reduce((soma, l) => soma + l.valores.reduce((ss, v) => ss + (v.valor || 0), 0), 0);

        // Consumos mês atual vs anterior
        const energiaMesAtual = tabela
            .filter(l => l.fonte === "energia")
            .reduce((soma, l) => soma + (l.valores[mesAtualIndex]?.valor || 0), 0);
            
        const energiaMesAnterior = tabela
            .filter(l => l.fonte === "energia")
            .reduce((soma, l) => soma + (l.valores[mesAnteriorIndex]?.valor || 0), 0);
            
        const aguaMesAtual = tabela
            .filter(l => l.fonte === "agua")
            .reduce((soma, l) => soma + (l.valores[mesAtualIndex]?.valor || 0), 0);
            
        const aguaMesAnterior = tabela
            .filter(l => l.fonte === "agua")
            .reduce((soma, l) => soma + (l.valores[mesAnteriorIndex]?.valor || 0), 0);

        // Custos totais
        const custoEnergiaMesAtual = energiaMesAtual * CONFIG.tarifaEnergia;
        const custoAguaMesAtual = aguaMesAtual * CONFIG.tarifaAgua;
        const custoTotalMesAtual = custoEnergiaMesAtual + custoAguaMesAtual;

        // Cálculos ambientais e econômicos
        const co2EvitadoEnergia = calcularCO2Evitado(energiaMesAtual, energiaMesAnterior);
        const economiaEnergia = calcularEconomia(energiaMesAtual, energiaMesAnterior, CONFIG.tarifaEnergia);
        const economiaAgua = calcularEconomia(aguaMesAtual, aguaMesAnterior, CONFIG.tarifaAgua);
        const economiaTotal = economiaEnergia + economiaAgua;

        // Métricas de comparação
        const diffEnergia = calcularDiferencaPercentual(energiaMesAtual, energiaMesAnterior);
        const diffAgua = calcularDiferencaPercentual(aguaMesAtual, aguaMesAnterior);
        const diffCusto = calcularDiferencaPercentual(custoTotalMesAtual, 
            (energiaMesAnterior * CONFIG.tarifaEnergia) + (aguaMesAnterior * CONFIG.tarifaAgua));

        // Metas atingidas
        const metasAtingidas = metasComProgresso.filter(m => m.atingida).length;

        // KPIs PRINCIPAIS
        const kpis = [
            { 
                icon: "fa-bolt", 
                label: "Consumo Energia", 
                value: formatKWh(energiaMesAtual),
                comparativo: diffEnergia,
                comparativoClass: getVariacaoClass(diffEnergia),
                color: "primary",
                detalhe: `Mês anterior: ${formatKWh(energiaMesAnterior)}`
            },
            { 
                icon: "fa-tint", 
                label: "Consumo Água", 
                value: formatM3(aguaMesAtual),
                comparativo: diffAgua,
                comparativoClass: getVariacaoClass(diffAgua),
                color: "info",
                detalhe: `Mês anterior: ${formatM3(aguaMesAnterior)}`
            },
            { 
                icon: "fa-leaf", 
                label: "CO₂ Evitado", 
                value: co2EvitadoEnergia.toLocaleString('pt-BR') + " kg",
                comparativo: co2EvitadoEnergia > 0 ? "Redução" : "Estável",
                comparativoClass: co2EvitadoEnergia > 0 ? "text-success" : "text-muted",
                color: "success",
                detalhe: `Baseado na redução de energia`
            },
            { 
                icon: "fa-wallet", 
                label: "Economia Estimada", 
                value: formatCurrency(economiaTotal),
                comparativo: economiaTotal > 0 ? "Economia" : "Sem economia",
                comparativoClass: economiaTotal > 0 ? "text-success" : "text-muted",
                color: "warning",
                detalhe: `vs mês anterior`
            }
        ];

        // RENDERIZAÇÃO
        document.getElementById("app").innerHTML = `
            <div class="row mb-4">
                <div class="col-12 col-lg-8">
                    <div class="card shadow-sm mb-3">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <span><i class="fa fa-chart-area text-primary"></i> Consumo dos Últimos 6 Meses</span>
                            <small class="text-muted">Comparativo Energia vs Água</small>
                        </div>
                        <div class="card-body">
                            <canvas id="consumoChart" height="70"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-4">
                    <div class="row g-3">
                        ${kpis.map(kpi => `
                            <div class="col-6 col-md-12">
                                <div class="card card-kpi shadow-sm border-${kpi.color}">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center mb-2">
                                            <i class="fa ${kpi.icon} fa-2x text-${kpi.color} me-3"></i>
                                            <div class="flex-grow-1">
                                                <div class="h5 mb-0">${kpi.value}</div>
                                                <small class="text-muted">${kpi.label}</small>
                                            </div>
                                            <span class="${kpi.comparativoClass} small fw-bold">${kpi.comparativo}</span>
                                        </div>
                                        <small class="text-muted">${kpi.detalhe}</small>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Tabela de consumos detalhada -->
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-white">
                    <i class="fa fa-table text-info"></i> Consumos por Setor e Fonte (últimos 6 meses)
                </div>
                <div class="card-body p-0">
                    <div style="overflow-x:auto;">
                        <table class="table table-bordered align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>Setor</th>
                                    <th>Fonte</th>
                                    ${mesesFiltro.map(m => `<th class="text-center">${formatMonthShort(m)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${tabela.map(linha => `
                                    <tr>
                                        <td><strong>${linha.setor}</strong></td>
                                        <td>${linha.fonte === "energia" ? "⚡ Energia" : "💧 Água"}</td>
                                        ${linha.valores.map(v => `
                                            <td class="text-center" title="${v.observacoes || 'Sem observações'}">
                                                <div>${linha.fonte === "energia" ? formatKWh(v.valor) : formatM3(v.valor)}</div>
                                                ${v.custo > 0 ? `<small class="text-muted">${formatCurrency(v.custo)}</small>` : ""}
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Cards de análise comparativa -->
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <span><i class="fa fa-bolt text-primary"></i> Análise de Energia</span>
                            <span class="${getVariacaoClass(diffEnergia)} small fw-bold">${diffEnergia}</span>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="h5 text-primary">${formatKWh(energiaMesAtual)}</div>
                                    <small class="text-muted">Mês Atual</small>
                                </div>
                                <div class="col-4">
                                    <div class="h5 text-secondary">${formatKWh(energiaMesAnterior)}</div>
                                    <small class="text-muted">Mês Anterior</small>
                                </div>
                                <div class="col-4">
                                    <div class="h5 ${economiaEnergia > 0 ? 'text-success' : 'text-muted'}">
                                        ${formatCurrency(economiaEnergia)}
                                    </div>
                                    <small class="text-muted">Economia</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white d-flex justify-content-between align-items-center">
                            <span><i class="fa fa-tint text-info"></i> Análise de Água</span>
                            <span class="${getVariacaoClass(diffAgua)} small fw-bold">${diffAgua}</span>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-4">
                                    <div class="h5 text-info">${formatM3(aguaMesAtual)}</div>
                                    <small class="text-muted">Mês Atual</small>
                                </div>
                                <div class="col-4">
                                    <div class="h5 text-secondary">${formatM3(aguaMesAnterior)}</div>
                                    <small class="text-muted">Mês Anterior</small>
                                </div>
                                <div class="col-4">
                                    <div class="h5 ${economiaAgua > 0 ? 'text-success' : 'text-muted'}">
                                        ${formatCurrency(economiaAgua)}
                                    </div>
                                    <small class="text-muted">Economia</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Metas e Progresso -->
            <div class="row mt-4 g-3">
                <div class="col-md-8">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white">
                            <i class="fa fa-bullseye text-success"></i> Progresso das Metas
                        </div>
                        <div class="card-body">
                            ${metasComProgresso.length > 0 ? metasComProgresso.map(meta => `
                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="fw-bold">${meta.fonte === 'energia' ? '⚡' : '💧'} ${meta.descricao || 'Meta ' + meta.fonte}</span>
                                        <span class="${meta.atingida ? 'text-success' : 'text-warning'}">
                                            ${meta.atingida ? '✅ Atingida' : `${meta.reducaoPercentual}% / ${meta.percentual_reducao}%`}
                                        </span>
                                    </div>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar ${meta.atingida ? 'bg-success' : 'bg-warning'}" 
                                             role="progressbar" 
                                             style="width: ${meta.progresso * 100}%"
                                             aria-valuenow="${meta.progresso * 100}" 
                                             aria-valuemin="0" 
                                             aria-valuemax="100">
                                            ${formatPercent(meta.progresso)}
                                        </div>
                                    </div>
                                    <small class="text-muted">Redução de ${meta.percentual_reducao}% até ${new Date(meta.data_limite).toLocaleDateString('pt-BR')}</small>
                                </div>
                            `).join('') : `
                                <div class="text-center text-muted py-3">
                                    <i class="fa fa-bullseye fa-2x mb-2"></i>
                                    <p>Nenhuma meta cadastrada</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card shadow-sm">
                        <div class="card-header bg-white">
                            <i class="fa fa-chart-pie text-primary"></i> Resumo Financeiro
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Custo Energia:</span>
                                    <strong>${formatCurrency(custoEnergiaMesAtual)}</strong>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Custo Água:</span>
                                    <strong>${formatCurrency(custoAguaMesAtual)}</strong>
                                </div>
                                <hr>
                                <div class="d-flex justify-content-between">
                                    <span class="fw-bold">Total:</span>
                                    <strong class="text-primary">${formatCurrency(custoTotalMesAtual)}</strong>
                                </div>
                            </div>
                            <div class="text-center">
                                <div class="h4 ${getVariacaoClass(diffCusto)}">${diffCusto}</div>
                                <small class="text-muted">Variação vs mês anterior</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Gráfico de Consumo
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                new Chart(document.getElementById('consumoChart'), {
                    type: 'line',
                    data: {
                        labels: mesesFiltro.map(formatMonthShort),
                        datasets: [
                            {
                                label: 'Energia (kWh)',
                                data: mesesFiltro.map((_, idx) =>
                                    tabela.filter(l => l.fonte === "energia")
                                        .reduce((soma, l) => soma + (l.valores[idx]?.valor || 0), 0)
                                ),
                                fill: true,
                                backgroundColor: 'rgba(63,137,255,0.1)',
                                borderColor: '#3f89ff',
                                tension: 0.4,
                                borderWidth: 2
                            },
                            {
                                label: 'Água (m³)',
                                data: mesesFiltro.map((_, idx) =>
                                    tabela.filter(l => l.fonte === "agua")
                                        .reduce((soma, l) => soma + (l.valores[idx]?.valor || 0), 0)
                                ),
                                fill: false,
                                borderColor: '#00b8d9',
                                backgroundColor: '#00b8d9',
                                tension: 0.4,
                                borderWidth: 2
                            }
                        ]
                    },
                    options: {
                        plugins: { 
                            legend: { 
                                position: 'bottom',
                                labels: {
                                    usePointStyle: true,
                                }
                            } 
                        },
                        scales: { 
                            y: { 
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Consumo'
                                }
                            } 
                        },
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        }
                    }
                });
            }
        }, 100);

    } catch (error) {
        console.error("Erro ao renderizar dashboard:", error);
        document.getElementById("app").innerHTML = `
            <div class="alert alert-danger">
                <h5>Erro ao carregar dashboard</h5>
                <p>${error.message}</p>
                <button class="btn btn-primary mt-2" onclick="renderDashboard()">Tentar Novamente</button>
            </div>
        `;
    }
}

window.renderDashboard = renderDashboard;