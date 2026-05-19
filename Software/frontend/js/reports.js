async function fetchAnosDisponiveis() {
    const user = getCurrentUser();
    if (!user || !user.empresa || !user.empresa.id) return [];
    const resp = await fetch(`http://localhost:8000/api/reports/anos?empresa_id=${user.empresa.id}`);
    if (!resp.ok) return [];
    return await resp.json();
}

function renderReports() {
    document.getElementById("app").innerHTML = `
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-white"><i class="fa fa-file-pdf"></i> Gerar Novo Relatório</div>
            <div class="card-body">
                <form id="formGerarReport" class="row g-2 align-items-end">
                    <div class="col-md-6">
                        <select class="form-select" id="anoRelatorio" required>
                            <option value="">Carregando anos...</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-success w-100" type="submit"><i class="fa fa-file-export"></i> Gerar Relatório</button>
                    </div>
                </form>
            </div>
        </div>
        <div class="card shadow-sm">
            <div class="card-header bg-white"><i class="fa fa-align-left"></i> Observações / Texto Futuro</div>
            <div class="card-body">
                <textarea class="form-control" id="caixaTextoExtra" placeholder="(Em breve: observações ou parâmetros avançados)" rows="4" disabled></textarea>
            </div>
        </div>
    `;

    carregarAnosRelatorio();

    document.getElementById("formGerarReport").onsubmit = async function (e) {
        e.preventDefault();
        const user = getCurrentUser();
        const ano = document.getElementById("anoRelatorio").value;
        if (!ano) {
            alert("Selecione o ano!");
            return;
        }
        try {
            const resp = await fetch("http://localhost:8000/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    empresa_id: user.empresa.id,
                    tipo: "completo",
                    periodo: ano
                })
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || "Erro ao gerar relatório");
            }
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `relatorio_${ano}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            alert("Relatório baixado!");
        } catch (err) {
            alert("Erro ao gerar relatório: " + err.message);
        }
    };
}

async function carregarAnosRelatorio() {
    const select = document.getElementById("anoRelatorio");
    select.innerHTML = `<option value="">Carregando anos...</option>`;
    const anos = await fetchAnosDisponiveis();
    if (!anos.length) {
        select.innerHTML = `<option value="">Nenhum ano disponível</option>`;
        return;
    }
    select.innerHTML = `<option value="">Ano</option>` + anos.map(ano => `<option value="${ano}">${ano}</option>`).join('');
}

window.renderReports = renderReports;