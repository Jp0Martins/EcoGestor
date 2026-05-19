from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics.charts.legends import Legend
from reportlab.graphics import renderPDF
import math
import os


def _make_page_header_footer(canvas, doc, empresa_nome, setor):
    """
    Desenha cabeçalho e rodapé em cada página.
    """
    largura, altura = A4
    canvas.saveState()
    # Cabeçalho
    canvas.setFont("Helvetica-Bold", 10)
    header_text = f"{empresa_nome}"
    if setor:
        header_text += f" — {setor}"
    canvas.drawString(20 * mm, altura - 15 * mm, header_text)

    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(
        largura - 20 * mm, altura - 15 * mm, datetime.now().strftime("%d/%m/%Y")
    )

    # Rodapé: número da página
    canvas.setFont("Helvetica", 8)
    page_num_text = f"Página {doc.page}"
    canvas.drawCentredString(largura / 2.0, 12 * mm, page_num_text)

    canvas.restoreState()


def _build_line_chart(width, height, labels, series, title=""):
    """
    Constrói um gráfico de linha simples (emissões ao longo do tempo).
    - labels: lista de rótulos (x)
    - series: lista de (nome, [valores])
    """
    drawing = Drawing(width, height)
    lp = LinePlot()
    lp.x = 50
    lp.y = 20
    lp.width = width - 80
    lp.height = height - 60

    # LinePlot wants a list of sequences (x,y), but simpler: provide y-values and it maps x as indices
    data = []
    maxy = 0
    for name, values in series:
        cleaned = [float(v) if v is not None else 0.0 for v in values]
        data.append(cleaned)
        maxy = max(maxy, max(cleaned) if cleaned else 0)

    lp.data = data
    lp.joinedLines = 1
    # Styling
    lp.lines[0].strokeColor = colors.HexColor("#1f77b4")
    if len(lp.lines) > 1:
        lp.lines[1].strokeColor = colors.HexColor("#ff7f0e")
    lp.xValueAxis.visible = False
    lp.yValueAxis.labelTextFormat = lambda v: ("%0.0f" % v)
    lp.yValueAxis.valueMax = max(1, math.ceil(maxy * 1.1))
    lp.yValueAxis.valueMin = 0
    lp.yValueAxis.valueSteps = max(2, int(lp.yValueAxis.valueMax / 4))

    drawing.add(lp)

    # Legend
    legend = Legend()
    legend.alignment = "right"
    legend.x = width - 70
    legend.y = height - 30
    legend.dx = 8
    legend.dy = 8
    legend.fontName = "Helvetica"
    legend.colorNamePairs = [(colors.HexColor("#1f77b4"), series[0][0])]
    if len(series) > 1:
        legend.colorNamePairs.append((colors.HexColor("#ff7f0e"), series[1][0]))
    drawing.add(legend)

    # X labels
    x_text = String(50, 10, ", ".join(labels), fontName="Helvetica", fontSize=7)
    drawing.add(x_text)

    # Title
    if title:
        drawing.add(
            String(
                width / 2 - 30,
                height - 10,
                title,
                fontName="Helvetica-Bold",
                fontSize=10,
            )
        )

    return drawing


def _build_bar_chart(width, height, labels, data, title=""):
    """
    Constrói um gráfico de barras verticais.
    - labels: categorias
    - data: [valores]
    """
    drawing = Drawing(width, height)
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 30
    bc.height = height - 70
    bc.width = width - 100
    bc.data = [data]
    bc.strokeColor = colors.black
    bc.valueAxis.valueMin = 0
    max_val = max(data) if data else 0
    bc.valueAxis.valueMax = max(1, math.ceil(max_val * 1.1))
    bc.valueAxis.valueStep = max(1, int(bc.valueAxis.valueMax / 5))
    bc.categoryAxis.labels.boxAnchor = "ne"
    bc.categoryAxis.labels.dy = -2
    bc.categoryAxis.labels.angle = 30
    bc.categoryAxis.categoryNames = labels
    bc.bars[0].fillColor = colors.HexColor("#2ca02c")
    drawing.add(bc)
    if title:
        drawing.add(
            String(
                width / 2 - 30,
                height - 10,
                title,
                fontName="Helvetica-Bold",
                fontSize=10,
            )
        )
    return drawing


def gerar_relatorio_pdf(dados, ano, empresa_nome):
    """
    Gera um relatório PDF mais completo e profissional seguindo a estrutura solicitada.
    Retorna o conteúdo em bytes.

    Parâmetros esperados em 'dados' (exemplos):
    - 'logo_path': caminho para o logo (opcional)
    - 'setor': nome do setor/unidade (opcional)
    - 'periodo': "Jan 2024 - Dez 2024" (opcional)
    - 'metodos': texto descrevendo metodologias (opcional)
    - 'economia_financeira_total': número ou string
    - 'redução_co2': número (toneladas)
    - 'metas_atingidas' e 'metas_planejadas'
    - 'recomendacoes': lista de strings
    - 'indicadores': dict com chaves como 'co2_total', 'co2_breakdown' (dict), 'co2_mensal' (list), 'meses' (list)
    - 'eficiencia_operacional': dict com medidas
    - 'analise_financeira': dict com 'economias' (dict), 'projecoes' (dict), 'roi' (list of dict)
    - 'metas': list of dicts {'nome', 'meta', 'realizado', 'responsavel', 'prazo'}
    - 'contatos': dict com 'email', 'telefone', etc.
    """

    # --- Configuração do documento ---
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=25 * mm,
        rightMargin=25 * mm,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
        title=f"{empresa_nome} - Relatório de Sustentabilidade {ano}",
        author="EcoGestor",
    )

    styles = getSampleStyleSheet()
    # Estilos customizados
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            alignment=1,
            fontSize=18,
            leading=22,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Heading1TOC",
            parent=styles["Heading1"],
            fontSize=14,
            leading=16,
            spaceAfter=6,
            outlineLevel=1,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Heading2TOC",
            parent=styles["Heading2"],
            fontSize=12,
            leading=14,
            spaceAfter=4,
            outlineLevel=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="NormalSmall", parent=styles["Normal"], fontSize=9, leading=12
        )
    )
    styles.add(
        ParagraphStyle(name="MonoSmall", parent=styles["Code"], fontSize=8, leading=10)
    )

    empresa_setor = dados.get("setor", "")
    periodo_text = dados.get("periodo", f"Janeiro a Dezembro de {ano}")

    story = []

    # ---- CAPA ----
    # Tentar incluir logo se existir
    logo_path = dados.get("logo_path")
    if logo_path and os.path.exists(logo_path):
        try:
            img = Image(logo_path, width=60 * mm, height=30 * mm)
            img.hAlign = "LEFT"
            story.append(img)
        except Exception:
            # imagem inválida, ignorar
            pass

    story.append(Spacer(1, 12))
    story.append(Paragraph(f"{empresa_nome}", styles["TitleCenter"]))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(f"Relatório de Sustentabilidade — {ano}", styles["TitleCenter"])
    )
    story.append(Spacer(1, 12))
    if empresa_setor:
        story.append(
            Paragraph(f"Setor/Unidade: <b>{empresa_setor}</b>", styles["Normal"])
        )
    story.append(Paragraph(f"Período analisado: {periodo_text}", styles["Normal"]))
    story.append(
        Paragraph(
            f"Data de geração: {datetime.now().strftime('%d/%m/%Y')}", styles["Normal"]
        )
    )
    story.append(Spacer(1, 18))
    story.append(Paragraph("Sumário executivo", styles["Heading2TOC"]))
    # Pequeno destaque do sumário executivo (texto curto)
    resumo_exec = []
    economia = dados.get("economia_financeira_total", "—")
    reducao_co2 = dados.get("redução_co2", "—")
    metas_atingidas = dados.get("metas_atingidas", "—")
    metas_planejadas = dados.get("metas_planejadas", "—")
    resumo_exec.append(f"Economia financeira total: R$ {economia}")
    resumo_exec.append(f"Redução de emissões de CO₂: {reducao_co2} toneladas")
    resumo_exec.append(f"Metas atingidas: {metas_atingidas} / {metas_planejadas}")
    recoms = dados.get("recomendacoes", [])
    if isinstance(recoms, (list, tuple)):
        resumo_exec.append(
            "Recomendações principais: " + (", ".join(recoms[:3]) if recoms else "—")
        )
    else:
        resumo_exec.append(f"Recomendações principais: {recoms}")

    for line in resumo_exec:
        story.append(Paragraph(line, styles["Normal"]))
    story.append(PageBreak())

    # ---- SUMÁRIO (Table of Contents) ----
    story.append(Paragraph("Sumário", styles["Heading1TOC"]))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle(
            fontName="Helvetica-Bold",
            fontSize=11,
            name="TOCHeading1",
            leftIndent=6,
            firstLineIndent=-6,
            spaceBefore=4,
            leading=12,
        ),
        ParagraphStyle(
            fontName="Helvetica",
            fontSize=10,
            name="TOCHeading2",
            leftIndent=20,
            firstLineIndent=-6,
            spaceBefore=2,
            leading=10,
        ),
    ]
    story.append(toc)
    story.append(PageBreak())

    # Utility: afterFlowable to register headings in TOC
    def after_flowable_callback(flowable):
        from reportlab.platypus import Paragraph

        if isinstance(flowable, Paragraph):
            style = getattr(flowable, "style", None)
            if style and hasattr(style, "outlineLevel"):
                level = style.outlineLevel
                text = "".join(flowable.getPlainText().splitlines())
                # notify the TOC
                doc.notify("TOCEntry", (level, text, doc.page))

    doc.afterFlowable = after_flowable_callback

    # ---- 1. Resumo Executivo (detalhado) ----
    story.append(Paragraph("Resumo Executivo", styles["Heading1TOC"]))
    resumo_detalhado = dados.get("resumo_executivo", None)
    if resumo_detalhado:
        story.append(Paragraph(resumo_detalhado, styles["Normal"]))
    else:
        story.append(
            Paragraph(
                "Este relatório apresenta os principais achados e conquistas no período analisado, com foco em emissões, eficiência e resultados financeiros relacionados às iniciativas de sustentabilidade.",
                styles["Normal"],
            )
        )
    story.append(Spacer(1, 6))

    # ---- 2. Contextualização ----
    story.append(Paragraph("Contextualização e Metodologia", styles["Heading1TOC"]))
    metod_text = dados.get("metodos", "Metodologias e bases de cálculo não informadas.")
    story.append(Paragraph(f"Período: {periodo_text}", styles["Normal"]))
    story.append(
        Paragraph(
            f"Escopo: {dados.get('escopo', 'Empresa completa / Unidade não especificada')}",
            styles["Normal"],
        )
    )
    story.append(Paragraph("Metodologia:", styles["Heading2TOC"]))
    story.append(Paragraph(metod_text, styles["NormalSmall"]))
    story.append(Spacer(1, 6))

    # ---- 3. Indicadores de Desempenho Ambiental ----
    story.append(
        Paragraph("Indicadores de Desempenho Ambiental", styles["Heading1TOC"])
    )

    indicadores = dados.get("indicadores", {})
    co2_total = indicadores.get("co2_total", "—")
    co2_breakdown = indicadores.get("co2_breakdown", {})  # dict tipo->valor
    meses = indicadores.get("meses", [])
    co2_mensal = indicadores.get("co2_mensal", [])

    # resumo rápido de CO2
    story.append(Paragraph("Pegada de Carbono", styles["Heading2TOC"]))
    story.append(
        Paragraph(
            f"Emissões totais (CO₂e): <b>{co2_total}</b> toneladas", styles["Normal"]
        )
    )
    # breakdown table
    breakdown_data = [["Fonte", "Emissões (t CO₂e)"]]
    for k, v in co2_breakdown.items():
        breakdown_data.append([k, f"{v}"])
    if len(breakdown_data) == 1:
        breakdown_data.append(["Não informado", "—"])
    tbl = Table(breakdown_data, hAlign="LEFT", colWidths=[120 * mm, 40 * mm])
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(tbl)
    story.append(Spacer(1, 8))

    # gráfico temporal de CO2
    if meses and co2_mensal:
        try:
            drawing = _build_line_chart(
                400,
                160,
                meses,
                [("CO2e", co2_mensal)],
                title="Evolução das Emissões (últimos períodos)",
            )
            story.append(drawing)
        except Exception:
            story.append(
                Paragraph(
                    "Gráfico de evolução não pôde ser gerado.", styles["NormalSmall"]
                )
            )
    else:
        story.append(
            Paragraph(
                "Dados mensais de emissões não disponíveis para gráfico.",
                styles["NormalSmall"],
            )
        )

    story.append(Spacer(1, 10))

    # Indicadores de eficiência operacional
    story.append(Paragraph("Eficiência Operacional", styles["Heading2TOC"]))
    eficiencia = dados.get("eficiencia_operacional", {})
    if eficiencia:
        eff_rows = [["Métrica", "Valor"]]
        for k, v in eficiencia.items():
            eff_rows.append([k, str(v)])
        eff_tbl = Table(eff_rows, hAlign="LEFT", colWidths=[120 * mm, 40 * mm])
        eff_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        story.append(eff_tbl)
    else:
        story.append(
            Paragraph(
                "Indicadores de eficiência operacional não informados.",
                styles["NormalSmall"],
            )
        )

    story.append(PageBreak())

    # ---- 4. Análise Financeira e ROI ----
    story.append(
        Paragraph(
            "Análise Financeira e Retorno sobre Investimento (ROI)",
            styles["Heading1TOC"],
        )
    )
    analise = dados.get("analise_financeira", {})
    economia_total = analise.get(
        "economia_total", dados.get("economia_financeira_total", "—")
    )
    story.append(
        Paragraph(
            f"Economia financeira total reportada: <b>R$ {economia_total}</b>",
            styles["Normal"],
        )
    )
    economias = analise.get("economias", {})
    if economias:
        econ_rows = [["Fonte/Projeto", "Economia (R$)"]]
        for k, v in economias.items():
            econ_rows.append([k, f"{v}"])
        econ_tbl = Table(econ_rows, hAlign="LEFT", colWidths=[120 * mm, 40 * mm])
        econ_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        story.append(econ_tbl)
    else:
        story.append(
            Paragraph(
                "Detalhes de economia por medida não informados.", styles["NormalSmall"]
            )
        )

    # Projeções
    proj = analise.get("projecoes", {})
    if proj:
        story.append(Paragraph("Projeções de economia futura", styles["Heading2TOC"]))
        for k, v in proj.items():
            story.append(Paragraph(f"{k}: R$ {v}", styles["Normal"]))
    # ROI
    roi_list = analise.get("roi", [])
    if roi_list:
        story.append(Paragraph("Cálculo de ROI por iniciativa", styles["Heading2TOC"]))
        roi_rows = [
            ["Iniciativa", "Investimento (R$)", "Economia anual (R$)", "ROI (%)"]
        ]
        for item in roi_list:
            nome = item.get("nome", "—")
            investimento = item.get("investimento", "—")
            economia = item.get("economia_anual", "—")
            roi_val = item.get("roi_percent", "—")
            roi_rows.append([nome, f"{investimento}", f"{economia}", f"{roi_val}"])
        roi_tbl = Table(
            roi_rows, hAlign="LEFT", colWidths=[70 * mm, 40 * mm, 40 * mm, 20 * mm]
        )
        roi_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ]
            )
        )
        story.append(roi_tbl)
    else:
        story.append(Paragraph("Dados de ROI não informados.", styles["NormalSmall"]))

    story.append(PageBreak())

    # ---- 5. Metas e Desempenho ----
    story.append(Paragraph("Metas e Desempenho", styles["Heading1TOC"]))
    metas = dados.get("metas", [])
    if metas:
        metas_rows = [
            [
                "Meta",
                "Objetivo",
                "Realizado",
                "% Realizado",
                "Gap",
                "Responsável",
                "Prazo",
            ]
        ]
        for m in metas:
            nome = m.get("nome", "—")
            objetivo = m.get("meta", "—")
            realizado = m.get("realizado", 0)
            percent = (
                f"{(float(realizado) / float(objetivo) * 100):.1f}%"
                if objetivo and float(objetivo) != 0
                else "—"
            )
            gap = (
                f"{float(objetivo) - float(realizado):.2f}"
                if objetivo and realizado is not None
                else "—"
            )
            resp = m.get("responsavel", "—")
            prazo = m.get("prazo", "—")
            metas_rows.append([nome, objetivo, realizado, percent, gap, resp, prazo])
        metas_tbl = Table(
            metas_rows,
            hAlign="LEFT",
            colWidths=[50 * mm, 25 * mm, 25 * mm, 25 * mm, 25 * mm, 30 * mm, 25 * mm],
        )
        metas_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        story.append(metas_tbl)
    else:
        story.append(
            Paragraph(
                "Nenhuma meta cadastrada no período analisado.", styles["NormalSmall"]
            )
        )

    story.append(Spacer(1, 6))

    # Gráfico comparativo simples (por exemplo, consumo/eficiência)
    comparativo_labels = analise.get("comparativo_labels", [])
    comparativo_values = analise.get("comparativo_values", [])
    if comparativo_labels and comparativo_values:
        try:
            drawing = _build_bar_chart(
                400,
                160,
                comparativo_labels,
                comparativo_values,
                title="Indicadores Comparativos",
            )
            story.append(drawing)
        except Exception:
            story.append(
                Paragraph(
                    "Gráfico comparativo não pôde ser gerado.", styles["NormalSmall"]
                )
            )

    story.append(PageBreak())

    # ---- 6. Recomendações e Plano de Ação ----
    story.append(Paragraph("Recomendações e Plano de Ação", styles["Heading1TOC"]))
    recoms = dados.get("recomendacoes", [])
    if recoms:
        for i, r in enumerate(recoms, start=1):
            story.append(Paragraph(f"{i}. {r}", styles["Normal"]))
    else:
        story.append(Paragraph("Nenhuma recomendação listada.", styles["NormalSmall"]))

    plano = dados.get("plano_acao", [])
    if plano:
        story.append(Spacer(1, 6))
        story.append(Paragraph("Plano de Ação Sugerido", styles["Heading2TOC"]))
        plano_rows = [["Ação", "Responsável", "Prioridade", "Prazo"]]
        for p in plano:
            plano_rows.append(
                [
                    p.get("acao", "—"),
                    p.get("responsavel", "—"),
                    p.get("prioridade", "—"),
                    p.get("prazo", "—"),
                ]
            )
        plano_tbl = Table(
            plano_rows, hAlign="LEFT", colWidths=[80 * mm, 40 * mm, 30 * mm, 30 * mm]
        )
        plano_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ]
            )
        )
        story.append(plano_tbl)

    story.append(PageBreak())

    # ---- 7. Elementos Gráficos e Formatação (Observações) ----
    story.append(
        Paragraph(
            "Elementos Gráficos e Observações sobre Formatação", styles["Heading1TOC"]
        )
    )
    story.append(
        Paragraph(
            "O relatório utiliza gráficos de barras e linhas, tabelas com destaque de cabeçalho e tipografia legível. "
            "A paleta de cores aplicada prioriza contraste e acessibilidade.",
            styles["Normal"],
        )
    )
    story.append(Spacer(1, 6))

    # ---- 8. Personalização e Benchmarks ----
    story.append(Paragraph("Personalização e Benchmarking", styles["Heading1TOC"]))
    benchmarks = dados.get("benchmarks", {})
    if benchmarks:
        bench_rows = [["Referência", "Valor"]]
        for k, v in benchmarks.items():
            bench_rows.append([k, str(v)])
        bench_tbl = Table(bench_rows, hAlign="LEFT", colWidths=[120 * mm, 40 * mm])
        bench_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.grey),
                ]
            )
        )
        story.append(bench_tbl)
    else:
        story.append(
            Paragraph("Benchmarks setoriais não informados.", styles["NormalSmall"])
        )

    story.append(Spacer(1, 12))

    # ---- Contatos e Créditos ----
    story.append(Paragraph("Contatos e Créditos", styles["Heading1TOC"]))
    contatos = dados.get("contatos", {})
    contato_lines = []
    if contatos.get("email"):
        contato_lines.append(f"E-mail: {contatos.get('email')}")
    if contatos.get("telefone"):
        contato_lines.append(f"Telefone: {contatos.get('telefone')}")
    if contatos.get("responsavel"):
        contato_lines.append(f"Responsável: {contatos.get('responsavel')}")
    if contato_lines:
        for l in contato_lines:
            story.append(Paragraph(l, styles["Normal"]))
    else:
        story.append(
            Paragraph("Informações de contato não fornecidas.", styles["NormalSmall"])
        )

    story.append(Spacer(1, 6))
    story.append(
        Paragraph("Relatório gerado por: EcoGestor SaaS", styles["NormalSmall"])
    )

    # --- Build do documento com cabeçalho/rodapé ---
    def on_page(canvas_obj, doc_obj):
        _make_page_header_footer(canvas_obj, doc_obj, empresa_nome, empresa_setor)

    # O SimpleDocTemplate chama 'afterFlowable' entre flowables se definido (registrado acima)
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)

    buffer.seek(0)
    return buffer.read()
