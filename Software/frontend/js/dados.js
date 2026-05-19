function renderDadosEntrada() {
    document.getElementById("app").innerHTML = `
        <div class="row">
            <div class="col-lg-5 mb-4">
                <div class="card shadow-sm">
                    <div class="card-header bg-white"><i class="fa fa-plus-circle"></i> Registrar Consumo</div>
                    <div class="card-body">
                        <form id="formConsumo">
                            <div class="mb-2">
                                <label class="form-label">Setor</label>
                                <select class="form-select" id="campoSetor" required>
                                    <option value="">Carregando setores...</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Fonte</label>
                                <select class="form-select" id="campoFonte" required>
                                    <option value="">Selecione...</option>
                                    <option value="energia">Energia</option>
                                    <option value="agua">Água</option>
                                </select>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Data</label>
                                <input type="date" class="form-control" id="campoData" required>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Valor</label>
                                <input type="number" min="0" class="form-control" id="campoValor" required placeholder="Ex: kWh ou m³">
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Custo (R$)</label>
                                <input type="number" min="0" class="form-control" id="campoCusto" required step="0.01">
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Observações</label>
                                <input type="text" class="form-control" id="campoObs" maxlength="50">
                            </div>
                            <button type="submit" class="btn btn-primary w-100 mt-2"><i class="fa fa-save"></i> Salvar</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-lg-7">
                <div class="card shadow-sm">
                    <div class="card-header bg-white"><i class="fa fa-history"></i> Histórico de Consumo</div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label class="form-label">Filtrar por Setor</label>
                            <select class="form-select" id="filtroSetor"></select>
                        </div>
                        <table class="table table-bordered align-middle">
                            <thead>
                                <tr>
                                    <th>Data</th><th>Fonte</th><th>Valor</th><th>Custo</th><th>Obs.</th><th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="historicoConsumo">
                                <tr><td colspan="6">Carregando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    carregarSetoresDados();

    document.getElementById("formConsumo").onsubmit = async function (e) {
        e.preventDefault();

        const user = getCurrentUser();
        if (!user || !user.empresa || !user.id) {
            alert("Usuário não autenticado ou sem empresa configurada!");
            return;
        }

        const setor_id = document.getElementById("campoSetor").value;
        if (!setor_id) {
            alert("Selecione um setor!");
            return;
        }

        const data = {
            fonte: document.getElementById("campoFonte").value,
            data: document.getElementById("campoData").value,
            valor: parseFloat(document.getElementById("campoValor").value),
            custo: parseFloat(document.getElementById("campoCusto").value),
            observacoes: document.getElementById("campoObs").value,
            empresa_id: user.empresa.id,
            setor_id: setor_id,
            usuario_id: user.id
        };

        try {
            await createConsumo(data);
            alert("Consumo registrado com sucesso!");
            document.getElementById("formConsumo").reset();
            carregarHistorico();
        } catch (err) {
            alert("Erro ao registrar consumo: " + err.message);
        }
    }
}

async function carregarSetoresDados() {
    const user = getCurrentUser();
    if (!user || !user.empresa || !user.empresa.id) return;

    const resp = await fetch(`${SETORES_API}?empresa_id=${user.empresa.id}`);
    const setores = resp.ok ? await resp.json() : [];
    const setorSelect = document.getElementById("campoSetor");
    const filtroSetor = document.getElementById("filtroSetor");

    if (setores.length === 0) {
        setorSelect.innerHTML = `<option value="">Nenhum setor disponível</option>`;
        filtroSetor.innerHTML = `<option value="">Nenhum setor disponível</option>`;
        return;
    }
    setorSelect.innerHTML = `<option value="">Selecione...</option>` + setores.map(setor =>
        `<option value="${setor.id}">${setor.nome}</option>`
    ).join('');

    filtroSetor.innerHTML = `<option value="">Todos os setores</option>` + setores.map(setor =>
        `<option value="${setor.id}">${setor.nome}</option>`
    ).join('');

    filtroSetor.onchange = carregarHistorico;

    carregarHistorico();
}

async function fetchConsumos() {
    const user = getCurrentUser();
    if (!user || !user.empresa || !user.empresa.id) return [];
    const setor_id = document.getElementById("filtroSetor")?.value || "";
    let url = `${API_URL}?empresa_id=${user.empresa.id}`;
    if (setor_id) url += `&setor_id=${setor_id}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Erro ao buscar consumos");
    return await resp.json();
}

async function createConsumo(data) {
    const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error("Erro ao criar consumo");
    return await resp.json();
}

async function editarConsumo(id, data) {
    const resp = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!resp.ok) throw new Error("Erro ao editar consumo");
    return await resp.json();
}

async function excluirConsumo(id) {
    const resp = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!resp.ok && resp.status !== 204) throw new Error("Erro ao excluir consumo");
}

async function carregarHistorico() {
    const tbody = document.getElementById("historicoConsumo");
    try {
        const consumos = await fetchConsumos();
        if (!consumos.length) {
            tbody.innerHTML = `<tr><td colspan="6">Nenhum consumo cadastrado ainda.</td></tr>`;
            return;
        }
        tbody.innerHTML = consumos.map(item => `
            <tr>
                <td><input type="date" value="${item.data}" class="form-control form-control-sm" onchange="onEditConsumo('${item.id}', 'data', this.value)"></td>
                <td>
                    <select class="form-select form-select-sm" onchange="onEditConsumo('${item.id}', 'fonte', this.value)">
                        <option value="energia" ${item.fonte === "energia" ? "selected" : ""}>Energia</option>
                        <option value="agua" ${item.fonte === "agua" ? "selected" : ""}>Água</option>
                    </select>
                </td>
                <td><input type="number" class="form-control form-control-sm" value="${item.valor}" onchange="onEditConsumo('${item.id}', 'valor', this.value)"></td>
                <td><input type="number" class="form-control form-control-sm" value="${item.custo}" onchange="onEditConsumo('${item.id}', 'custo', this.value)"></td>
                <td><input type="text" class="form-control form-control-sm" value="${item.observacoes || ""}" onchange="onEditConsumo('${item.id}', 'observacoes', this.value)"></td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="onExcluirConsumo('${item.id}')"><i class="fa fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6">Erro ao carregar dados.</td></tr>`;
    }
}

// Funções globais para edição/exclusão inline
window.onEditConsumo = async function(id, campo, valor) {
    const consumos = await fetchConsumos();
    const item = consumos.find(x => x.id === id);
    if (!item) return;
    item[campo] = valor;
    await editarConsumo(id, item);
    carregarHistorico();
};

window.onExcluirConsumo = async function(id) {
    if (!confirm("Excluir este registro?")) return;
    await excluirConsumo(id);
    carregarHistorico();
};

window.renderDadosEntrada = renderDadosEntrada;