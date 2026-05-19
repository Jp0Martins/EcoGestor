const SUPABASE_URL = "https://svwljdnlfdsxutwnioch.supabase.co";
const SUPABASE_KEY = "sb_publishable_eWMUrk9abThanAHfmXE_SA_v9GmkCvE";

function renderConfig() {
    const user = getCurrentUser() || { nome: "", email: "" };
    document.getElementById("app").innerHTML = `
        <div class="row">
            <div class="col-md-7">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-white"><i class="fa fa-user-cog"></i> Dados do Usuário</div>
                    <div class="card-body">
                        <form id="formPerfil">
                            <div class="mb-2">
                                <label class="form-label">Nome</label>
                                <input class="form-control" value="${user.nome}" disabled>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">E-mail</label>
                                <input class="form-control" value="${user.email}" disabled>
                            </div>
                            <button class="btn btn-secondary mt-2" disabled><i class="fa fa-save"></i> Salvar</button>
                        </form>
                    </div>
                </div>
                <div class="card shadow-sm">
                    <div class="card-header bg-white"><i class="fa fa-key"></i> Alterar Senha</div>
                    <div class="card-body">
                        <form id="formSenha">
                            <div class="mb-2">
                                <label class="form-label">Senha atual</label>
                                <input type="password" class="form-control" required>
                            </div>
                            <div class="mb-2">
                                <label class="form-label">Nova senha</label>
                                <input type="password" class="form-control" required>
                            </div>
                            <button class="btn btn-primary mt-2" type="submit"><i class="fa fa-key"></i> Alterar</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-md-5 d-flex align-items-center justify-content-center">
                <div>
                    <button class="btn btn-outline-danger btn-lg" id="logoutBtn2"><i class="fa fa-sign-out-alt"></i> Sair da conta</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("formSenha").onsubmit = function (e) {
        e.preventDefault();
        alert("Senha alterada (mock)!");
    }
    document.getElementById("logoutBtn2").onclick = doLogout;
}

window.renderConfig = renderConfig;