from datetime import date
from typing import List


def anos_disponiveis_para_empresa(consumos):
    """
    Retorna uma lista de anos que existem nos dados de consumo da empresa.
    """
    anos = set()
    for c in consumos:
        if c.data:
            anos.add(c.data.year)
    return sorted(anos)


def resumo_sumario(consumos):
    return {
        "economia_financeira_total": 12000,
        "redução_co2": 3.2,
        "metas_atingidas": 2,
        "metas_planejadas": 3,
        "recomendacoes": ["Implantar energia solar", "Campanha de conscientização"],
    }


# Outras funções para cálculos detalhados, ODS, análise setorial etc. podem ser adicionadas aqui.
