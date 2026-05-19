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