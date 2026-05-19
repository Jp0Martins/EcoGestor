// NÃO redeclare "supabase"!
// Usa o global do CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* --- User State --- */
let currentUser = null;

/* --- Persistência em localStorage --- */
function saveUserSession(user) {
    localStorage.setItem("ecogestor_user", JSON.stringify(user));
    currentUser = user;
}
function loadUserSession() {
    if (currentUser) return currentUser;
    const data = localStorage.getItem("ecogestor_user");
    if (data) {
        currentUser = JSON.parse(data);
        return currentUser;
    }
    return null;
}
function clearUserSession() {
    localStorage.removeItem("ecogestor_user");
    currentUser = null;
}

/* --- Login Logic --- */
async function loginSupabase(email, senha) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email: email, 
        password: senha 
    });
    if (error) {
        throw new Error("Usuário/senha inválidos");
    }
    return data.session.access_token;
}

function showLogin() {
    var loginModal = new bootstrap.Modal(document.getElementById('loginModal'), { 
        backdrop: 'static', 
        keyboard: false 
    });
    loginModal.show();
    
    document.getElementById("loginForm").onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const senha = document.getElementById("loginSenha").value;
        
        try {
            const jwt = await loginSupabase(email, senha);

            const resp = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, senha })
            });

            if (resp.ok) {
                const user = await resp.json();
                saveUserSession(user);
                document.getElementById("username").textContent = user.nome || user.email;
                loginModal.hide();
                document.getElementById("loginError").classList.add("d-none");
                showPage("dashboard");
                console.log("✅ Login realizado com sucesso!", user);
            } else {
                const errorText = await resp.text();
                console.error("❌ Erro do backend:", resp.status, errorText);
                throw new Error("Erro ao autenticar no backend: " + resp.status);
            }
        } catch (err) {
            console.error("❌ Erro no login:", err);
            document.getElementById("loginError").classList.remove("d-none");
            document.getElementById("loginError").textContent = err.message || "Credenciais inválidas";
        }
    };
}

/* --- Logout --- */
async function doLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Erro ao fazer logout:", error);
        }
        clearUserSession();
        document.getElementById("username").textContent = "Usuário";
        console.log("✅ Logout realizado com sucesso");
        showLogin();
    } catch (err) {
        console.error("❌ Erro no logout:", err);
    }
}

/* --- Get Current User --- */
function getCurrentUser() {
    return loadUserSession();
}

/* --- Check Authentication --- */
async function checkAuth() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.error("❌ Erro ao verificar sessão:", error);
            return false;
        }

        if (data.session && loadUserSession()) {
            console.log("🔍 Sessão encontrada, carregando usuário da sessão local...");
            return true;
        }

        console.log("ℹ️ Nenhuma sessão ativa ou usuário não persistido");
        return false;

    } catch (err) {
        console.error("❌ Erro ao verificar autenticação:", err);
        return false;
    }
}

/* --- EXPORTS GLOBAIS (ESSENCIAL) --- */
window.checkAuth = checkAuth;
window.doLogout = doLogout;
window.getCurrentUser = getCurrentUser;
window.showLogin = showLogin;

/* --- Debug helper --- */
window.debugAuth = {
    getToken: () => supabaseClient.auth.getSession().then(x => {
        const token = x.data?.session?.access_token;
        console.log("🔑 Token:", token);
        return token;
    }),
    getUser: () => console.log("👤 Current User:", getCurrentUser()),
    checkSession: () => supabaseClient.auth.getSession().then(x => console.log("📋 Session:", x.data?.session))
};