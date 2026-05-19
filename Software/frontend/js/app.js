let currentPage = "dashboard";

function showPage(page) {
    currentPage = page;
    document.querySelectorAll('#sidebarMenu .nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
    });
    switch (page) {
        case "dashboard": renderDashboard(); break;
        case "dados": renderDadosEntrada(); break;
        case "metas": renderMetas(); break;
        case "reports": renderReports(); break;
        case "config": renderConfig(); break;
        case "setores": renderSetores(); break;
        case "tutoriais": renderTutoriais(); break; 
    }
}

function formatPercent(p) { 
    return Math.round(p * 100) + "%"; 
}

// Lista completa de palavras para o efeito splash
const palavrasEfeito = [
    "Sustentabilidade", 
    "Desenvolvimento Sustentável", 
    "ESG", "Economia Verde", 
    "Pegada Ecológica", 
    "Biocapacidade", 
    "Conservação", 
    "Meio Ambiente e Ecologia", 
    "Ecossistema", 
    "Recursos Naturais", 
    "Energia Limpa", 
    "Eficiência Energética", 
    "Mudanças Climáticas", 
    "Ecologia Industrial", 
    "Social e Governança", 
    "Consumo Consciente",
];

// Função para renderizar a aba Tutoriais
function renderTutoriais() {
    document.getElementById("app").innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header bg-white"><i class="fa fa-graduation-cap"></i> Tutoriais</div>
            <div class="card-body">
                <p>Em breve, você encontrará tutoriais e guias de uso aqui!</p>
            </div>
        </div>
    `;
}
window.renderTutoriais = renderTutoriais;

// window.onload principal
window.onload = async function () {
    showSplashAnimEcoGestor(palavrasEfeito, "EcoGestor", async function () {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) {
            showLogin();
        } else {
            showPage("dashboard");
        }

        // SPA nav
        document.querySelectorAll('#sidebarMenu .nav-link').forEach(link => {
            link.onclick = async function (e) {
                e.preventDefault();
                if (!getCurrentUser()) {
                    await showLogin();
                    return;
                }
                showPage(this.dataset.page);
            }
        });
        document.getElementById("logoutBtn").onclick = doLogout;
    }, 3500);
};