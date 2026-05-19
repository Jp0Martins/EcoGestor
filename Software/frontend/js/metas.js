function renderMetas() {
    document.getElementById("app").innerHTML = `
        <div class="row g-3" id="metasCardsRow">
            <!-- Cards de metas aqui -->
        </div>
        <div class="card mt-4 shadow-sm">
            <div class="card-header bg-white"><i class="fa fa-plus"></i> Criar Nova Meta</div>
            <div class="card-body">
                <form id="formMeta">
                    <div class="row g-2 mb-2 align-items-end">
                        <div class="col-md-3">
                            <label class="form-label">Setor</label>
                            <select class="form-select" id="metaSetor" required>
                                <option value="">Carregando setores...</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Fonte</label>
                            <select class="form-select" id="metaFonte" required>
                                <option value="">Selecione...</option>
                                <option value="energia">Energia</option>
                                <option value="agua">Água</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Redução (%)</label>
                            <input type="number" min="0" max="100" class="form-control" id="metaReducao" required placeholder="Ex: 10">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Data Limite</label>
                            <input type="date" class="form-control" id="metaDataLimite" required>
                        </div>
                    </div>
                    <button class="btn btn-success" type="submit"><i class="fa fa-save"></i> Salvar Meta</button>
                </form>
            </div>
        </div>
        <div class="card mt-4 shadow-sm">
            <div class="card-header bg-white"><i class="fa fa-table"></i> Metas Cadastradas</div>
            <div class="card-body p-0">
                <table class="table table-bordered align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Setor</th>
                            <th>Fonte</th>
                            <th>Redução (%)</th>
                            <th>Data Limite</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="metasTableBody">
                        <tr><td colspan="5">Carregando...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    carregarSetoresMetas();
    carregarMetas();

    document.getElementById("formMeta").onsubmit = async function (e) {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user || !user.empresa || !user.id) {
            alert("Usuário não autenticado ou sem empresa configurada!");
            return;
        }
        const setor_id = document.getElementById("metaSetor").value;
        const fonte = document.getElementById("metaFonte").value;
        const percentual_reducao = parseFloat(document.getElementById("metaReducao").value);
        const data_limite = document.getElementById("metaDataLimite").value;

        if (!setor_id || !fonte || !percentual_reducao || !data_limite) {
            alert("Preencha todos os campos!");
            return;
        }

        try {
            await fetch(METAS_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    empresa_id: user.empresa.id,
                    setor_id,
                    fonte,
                    percentual_reducao,
                    data_limite
                })
            });
            alert("Meta cadastrada com sucesso!");
            document.getElementById("formMeta").reset();
            carregarMetas();
        } catch (err) {
            alert("Erro ao cadastrar meta: " + err.message);
        }
    }
}

async function carregarSetoresMetas() {
    const user = getCurrentUser();
    const setorSelect = document.getElementById("metaSetor");
    if (!user || !user.empresa || !user.empresa.id) {
        setorSelect.innerHTML = `<option value="">Usuário não autenticado</option>`;
        return;
    }
    const resp = await fetch(`${SETORES_API}?empresa_id=${user.empresa.id}`);
    const setores = resp.ok ? await resp.json() : [];
    if (!setores.length) {
        setorSelect.innerHTML = `<option value="">Nenhum setor disponível</option>`;
        return;
    }
    setorSelect.innerHTML = `<option value="">Selecione...</option>` + setores.map(setor =>
        `<option value="${setor.id}">${setor.nome}</option>`
    ).join('');
}

async function carregarMetas() {
    const user = getCurrentUser();
    const tbody = document.getElementById("metasTableBody");
    const cardsRow = document.getElementById("metasCardsRow");
    if (!user || !user.empresa || !user.empresa.id) {
        tbody.innerHTML = `<tr><td colspan="5">Usuário não autenticado!</td></tr>`;
        return;
    }
    tbody.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;
    cardsRow.innerHTML = ``;

    const resp = await fetch(`${METAS_API}?empresa_id=${user.empresa.id}`);
    if (!resp.ok) {
        tbody.innerHTML = `<tr><td colspan="5">Erro ao carregar metas (status ${resp.status})</td></tr>`;
        return;
    }
    const metas = await resp.json();

    const setoresResp = await fetch(`${SETORES_API}?empresa_id=${user.empresa.id}`);
    const setores = setoresResp.ok ? await setoresResp.json() : [];
    const setoresMap = {};
    setores.forEach(s => setoresMap[s.id] = s.nome);

    // Cards
    if (metas.length) {
        cardsRow.innerHTML = metas.map(meta => `
            <div class="col-md-4">
                <div class="card shadow-sm text-center mb-3">
                    <div class="card-header bg-white">
                        <i class="fa fa-bullseye text-success"></i> ${meta.fonte === "energia" ? "Energia" : "Água"}
                        <span class="badge bg-secondary float-end">${setoresMap[meta.setor_id] || ""}</span>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-3" style="height: 28px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 0%">0%</div>
                        </div>
                        <p class="mb-0">Redução de <strong>${meta.percentual_reducao}%</strong> até <strong>${meta.data_limite}</strong></p>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        cardsRow.innerHTML = `<div class="col-12 text-center text-muted">Nenhuma meta cadastrada ainda.</div>`;
    }

    // Tabela
    if (!metas.length) {
        tbody.innerHTML = `<tr><td colspan="5">Nenhuma meta cadastrada.</td></tr>`;
        return;
    }
    tbody.innerHTML = metas.map(meta => `
        <tr>
            <td>
                <select class="form-select form-select-sm" onchange="onEditMeta('${meta.id}', 'setor_id', this.value)">
                    ${setores.map(s => `
                        <option value="${s.id}" ${meta.setor_id === s.id ? 'selected' : ''}>${s.nome}</option>
                    `).join('')}
                </select>
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="onEditMeta('${meta.id}', 'fonte', this.value)">
                    <option value="energia" ${meta.fonte === "energia" ? "selected" : ""}>Energia</option>
                    <option value="agua" ${meta.fonte === "agua" ? "selected" : ""}>Água</option>
                </select>
            </td>
            <td>
                <input type="number" min="0" max="100" class="form-control form-control-sm"
                    value="${meta.percentual_reducao}"
                    onchange="onEditMeta('${meta.id}', 'percentual_reducao', this.value)">
            </td>
            <td>
                <input type="date" class="form-control form-control-sm"
                    value="${meta.data_limite}"
                    onchange="onEditMeta('${meta.id}', 'data_limite', this.value)">
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="onExcluirMeta('${meta.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

window.onEditMeta = async function(id, campo, valor) {
    const user = getCurrentUser();
    if (!user || !user.empresa || !user.empresa.id) return;
    const resp = await fetch(`${METAS_API}?empresa_id=${user.empresa.id}`);
    const metas = resp.ok ? await resp.json() : [];
    const meta = metas.find(x => x.id === id);
    if (!meta) return;
    meta[campo] = campo === "percentual_reducao" ? parseFloat(valor) : valor;
    const updated = {
        empresa_id: meta.empresa_id,
        setor_id: meta.setor_id,
        fonte: meta.fonte,
        percentual_reducao: meta.percentual_reducao,
        data_limite: meta.data_limite
    };
    await fetch(`${METAS_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
    });
    carregarMetas();
};

window.onExcluirMeta = async function(id) {
    if (!confirm("Excluir esta meta?")) return;
    await fetch(`${METAS_API}/${id}`, { method: "DELETE" });
    carregarMetas();
};

window.renderMetas = renderMetas;