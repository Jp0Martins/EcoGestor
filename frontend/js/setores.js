function renderSetores() {
    document.getElementById("app").innerHTML = `
    <div class="container py-4">
        <div class="mb-3">
            <h4>Setores da Empresa</h4>
            <form id="formSetor">
                <div class="row g-2">
                    <div class="col">
                        <input type="text" class="form-control" id="nomeSetor" placeholder="Nome do setor" required>
                    </div>
                    <div class="col">
                        <input type="text" class="form-control" id="descSetor" placeholder="Descrição">
                    </div>
                    <div class="col-auto">
                        <button type="submit" class="btn btn-success"><i class="fa fa-plus"></i> Adicionar</button>
                    </div>
                </div>
            </form>
        </div>
        <table class="table table-bordered" id="tabelaSetores">
            <thead>
                <tr>
                    <th>Nome</th><th>Descrição</th><th>Ações</th>
                </tr>
            </thead>
            <tbody id="tbodySetores">
                <tr><td colspan="3">Carregando...</td></tr>
            </tbody>
        </table>
    </div>`;

    carregarSetoresTabela();

    document.getElementById("formSetor").onsubmit = async function(e) {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) return alert("Usuário não autenticado!");
        const nome = document.getElementById("nomeSetor").value;
        const descricao = document.getElementById("descSetor").value;
        await fetch(SETORES_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                descricao,
                empresa: { id: user.empresa.id }
            })
        });
        document.getElementById("formSetor").reset();
        carregarSetoresTabela();
    }
}

async function carregarSetoresTabela() {
    const user = getCurrentUser();
    const tbody = document.getElementById("tbodySetores");
    if (!user) {
        tbody.innerHTML = `<tr><td colspan="3">Usuário não autenticado!</td></tr>`;
        return;
    }
    tbody.innerHTML = `<tr><td colspan="3">Carregando...</td></tr>`;
    const resp = await fetch(`${SETORES_API}?empresa_id=${user.empresa.id}`);
    if (!resp.ok) {
        tbody.innerHTML = `<tr><td colspan="3">Erro ao carregar setores (status ${resp.status})</td></tr>`;
        return;
    }
    const setores = await resp.json();
    if (!setores.length) {
        tbody.innerHTML = `<tr><td colspan="3">Nenhum setor cadastrado.</td></tr>`;
        return;
    }
    tbody.innerHTML = setores.map(setor => `
        <tr>
            <td>
                <input type="text" class="form-control form-control-sm" value="${setor.nome}" 
                    onchange="editarSetorNome('${setor.id}', this.value)">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" value="${setor.descricao||''}" 
                    onchange="editarSetorDesc('${setor.id}', this.value)">
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="excluirSetor('${setor.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

async function editarSetorNome(id, novoNome) {
    await editarSetor(id, { nome: novoNome });
}
async function editarSetorDesc(id, novaDesc) {
    await editarSetor(id, { descricao: novaDesc });
}
async function editarSetor(id, campos) {
    const user = getCurrentUser();
    if (!user) return;
    await fetch(`${SETORES_API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...campos,
            empresa: { id: user.empresa.id }
        })
    });
    carregarSetoresTabela();
}

async function excluirSetor(id) {
    if (!confirm("Excluir setor?")) return;
    await fetch(`${SETORES_API}/${id}`, { method: "DELETE" });
    carregarSetoresTabela();
}

window.renderSetores = renderSetores;