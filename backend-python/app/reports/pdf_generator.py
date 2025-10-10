from io import BytesIO
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4


def gerar_relatorio_pdf(dados, ano, empresa_nome):
    """
    Gera um relatório PDF simples e retorna o conteúdo como bytes.
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    largura, altura = A4

    # CAPA
    c.setFont("Helvetica-Bold", 18)
    c.drawString(
        60, altura - 80, f"{empresa_nome} - RELATÓRIO DE SUSTENTABILIDADE {ano}"
    )
    c.setFont("Helvetica", 12)
    c.drawString(
        60, altura - 110, "EcoGestor SaaS - Relatório Anual de Desempenho Ambiental"
    )
    c.drawString(60, altura - 130, f"Período: Janeiro a Dezembro de {ano}")
    c.drawString(
        60, altura - 150, f"Data de geração: {datetime.now().strftime('%d/%m/%Y')}"
    )

    c.showPage()

    # SUMÁRIO EXECUTIVO (simples)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(60, altura - 60, "Sumário Executivo")
    c.setFont("Helvetica", 12)
    c.drawString(
        60,
        altura - 90,
        f"Economia financeira total: R$ {dados['economia_financeira_total']}",
    )
    c.drawString(
        60,
        altura - 110,
        f"Redução de emissões de CO₂: {dados['redução_co2']} toneladas",
    )
    c.drawString(
        60,
        altura - 130,
        f"Metas atingidas: {dados['metas_atingidas']} / {dados['metas_planejadas']}",
    )
    c.drawString(
        60, altura - 150, f"Recomendações: {', '.join(dados['recomendacoes'])}"
    )

    # Outras páginas (financeiro, ambiental, etc) podem ser adicionadas aqui.

    c.save()
    buffer.seek(0)
    return buffer.read()
