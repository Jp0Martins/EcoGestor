const SUPABASE_URL = "https://odvhobbmablnweeejrvg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdmhvYmJtYWJsbndlZWVqcnZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NjAyOTQsImV4cCI6MjA3NTMzNjI5NH0.sPE4Xr58JbGpJZbX0EsqOWhry08w3UUEU8zCewW-Y6o";

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