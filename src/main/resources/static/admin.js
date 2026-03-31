// ================================================================
// admin.js — Área Administrativa v4.0
// Suporte ao payload com simulado_config, analise_estudo,
// gabarito "C"/"E", snake_case e metadados_evolucao
// ================================================================

const API = 'http://localhost:8080/api';
let questoesTemp = []; // Questões validadas e normalizadas

// ---- Inicialização ----

document.addEventListener('DOMContentLoaded', () => {
    aplicarTemaAdmin();
    carregarExemploInicial();
    document.getElementById('themeToggle').addEventListener('click', alternarTemaAdmin);
});

// ---- Tema ----

function aplicarTemaAdmin() {
    const tema = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-theme', tema);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = tema === 'dark' ? '☀️ Claro' : '🌙 Escuro';
}

function alternarTemaAdmin() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tema', novo);
    document.documentElement.setAttribute('data-theme', novo);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = novo === 'dark' ? '☀️ Claro' : '🌙 Escuro';
}

// ---- Navegação ----

function adminShowSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const sec = document.getElementById(`sec-${sectionId}`);
    if (sec) sec.classList.add('active');
    document.querySelectorAll(`[data-section="${sectionId}"]`)
        .forEach(n => n.classList.add('active'));

    if (sectionId === 'preview') renderizarPreview();
    if (sectionId === 'exemplo') carregarExemploInicial();
}

// ================================================================
// EXEMPLO PAYLOAD v4.0
// ================================================================

const EXEMPLO_PAYLOAD = {
    "simulado_config": {
        "id": "ESTUDO-ATIVO-C14-LOTE1",
        "titulo": "Técnico TCE - Bloco 01 (Inexigibilidade Básica)",
        "objetivo": "Domínio das hipóteses de Inexigibilidade - Lei 14.133/2021",
        "banca": "Cebraspe",
        "formato": "Certo/Errado",
        "versao_payload": "4.0"
    },
    "questoes": [
        {
            "id": 1,
            "disciplina": "Noções de Administração Pública",
            "topico": "4.1 Licitação: Inexigibilidade",
            "referencia_legal": "Lei nº 14.133/2021, Art. 74, I",
            "enunciado": "Na aquisição de materiais ou gêneros que só possam ser fornecidos por produtor ou empresa exclusiva, a Administração é proibida de indicar marca específica, sob pena de nulidade do processo de inexigibilidade.",
            "gabarito": "E",
            "pegadinha": true,
            "tipo_pegadinha": "Exceção à Regra Geral",
            "palavras_alerta": ["proibida", "indicar marca"],
            "detalhe_pegadinha": "A Nova Lei (Art. 74, I) permite explicitamente a indicação de marca se a exclusividade for do próprio objeto, desde que tecnicamente justificado.",
            "comentario_professor": "Errado. Diferente da Lei 8.666, a 14.133 permite a indicação de marca quando a exclusividade recai sobre o fornecedor/produtor (Art. 74, I).",
            "analise_estudo": {
                "meu_grau_certeza": null,
                "tentativas_anteriores": 0,
                "erros_recorrentes": 0,
                "proxima_revisao_sugerida": "2025-04-01",
                "meu_mnemonico_pessoal": "14.133: Exclusivo pode ter MARCA (se justificado)."
            }
        },
        {
            "id": 2,
            "disciplina": "Noções de Administração Pública",
            "topico": "4.1 Licitação: Inexigibilidade",
            "referencia_legal": "Lei nº 14.133/2021, Art. 74, III",
            "enunciado": "É admitida a contratação por inexigibilidade de serviços técnicos especializados de natureza predominantemente intelectual, como serviços de publicidade e propaganda, desde que comprovada a notória especialização do contratado.",
            "gabarito": "E",
            "pegadinha": true,
            "tipo_pegadinha": "Vedações Expressas",
            "palavras_alerta": ["publicidade", "notória especialização"],
            "detalhe_pegadinha": "O Cebraspe adora misturar serviços intelectuais com publicidade. Publicidade é a EXCEÇÃO que nunca entra em inexigibilidade.",
            "comentario_professor": "Errado. O Art. 74, III, veda expressamente a inexigibilidade para serviços de publicidade e divulgação.",
            "analise_estudo": {
                "meu_grau_certeza": null,
                "tentativas_anteriores": 0,
                "erros_recorrentes": 0,
                "proxima_revisao_sugerida": "2025-04-01",
                "meu_mnemonico_pessoal": "Propaganda = Licitação SEMPRE (Regra de Ouro)."
            }
        }
    ],
    "metadados_evolucao": {
        "resumo_edital": {
            "questoes_totais": 2,
            "cobertura_edital_percentual": "10%",
            "foco_em_pegadinhas": "100%"
        },
        "controle_revisao": {
            "agendadas_para_amanha": 2,
            "topico_mais_errado": "Inexigibilidade (Marca e Imóveis)",
            "alerta_palavra_chave_critica": "Avaliação prévia vs Dispensa"
        },
        "checksum": "sha256-lote1-exemplo"
    }
};

// ================================================================
// FUNÇÕES DE EXEMPLO
// ================================================================

function carregarExemploInicial() {
    const pre = document.getElementById('exemploJson');
    if (pre) pre.textContent = JSON.stringify(EXEMPLO_PAYLOAD, null, 2);
}

function carregarExemplo() {
    const input = document.getElementById('jsonInput');
    if (input) {
        input.value = JSON.stringify(EXEMPLO_PAYLOAD, null, 2);
        validarJson();
        toast('Exemplo carregado!', 'success');
    }
}

function copiarExemplo() {
    navigator.clipboard.writeText(JSON.stringify(EXEMPLO_PAYLOAD, null, 2))
        .then(() => toast('Exemplo copiado!', 'success'))
        .catch(() => toast('Erro ao copiar', 'error'));
}

function limparJson() {
    const input = document.getElementById('jsonInput');
    const validacao = document.getElementById('jsonValidacao');
    const btnIngerir = document.getElementById('btnIngerir');
    const resultado = document.getElementById('resultadoIngestao');

    if (input) input.value = '';
    if (validacao) validacao.innerHTML = '';
    if (btnIngerir) btnIngerir.disabled = true;
    if (resultado) resultado.style.display = 'none';
    questoesTemp = [];

    toast('JSON limpo!', 'info');
}

// ================================================================
// NORMALIZAÇÃO — converte payload v4.0 para o formato Java
// ================================================================

/**
 * "C" | "CERTO" | true  → true
 * "E" | "ERRADO" | false → false
 */
function normalizarGabarito(valor) {
    if (typeof valor === 'boolean') return valor;
    const s = String(valor ?? '').trim().toUpperCase();
    return s === 'C' || s === 'CERTO' || s === 'TRUE';
}

/**
 * Normaliza o bloco analise_estudo (snake_case → camelCase).
 */
function normalizarAnalise(ae) {
    if (!ae) return null;
    return {
        meuGrauCerteza: ae.meu_grau_certeza ?? ae.meuGrauCerteza ?? 0,
        tentativasAnteriores: ae.tentativas_anteriores ?? ae.tentativasAnteriores ?? 0,
        errosRecorrentes: ae.erros_recorrentes ?? ae.errosRecorrentes ?? 0,
        proximaRevisaoSugerida: ae.proxima_revisao_sugerida ?? ae.proximaRevisaoSugerida ?? null,
        meuMnemonicoPersonal: ae.meu_mnemonico_pessoal ?? ae.meuMnemonicoPersonal ?? null
    };
}

/**
 * Converte uma questão do formato v4.0 (snake_case, gabarito "C"/"E")
 * para o camelCase esperado pelos records Java.
 */
function normalizarQuestao(q) {
    return {
        idOrigem: q.id ?? null,
        disciplina: q.disciplina ?? null,
        topico: q.topico ?? null,
        enunciado: q.enunciado,
        gabarito: normalizarGabarito(q.gabarito),
        // assunto: usa disciplina como fallback se não vier campo "assunto"
        assunto: q.assunto ?? q.disciplina ?? 'Geral',
        banca: q.banca ?? null,
        ano: q.ano ?? null,
        cargo: q.cargo ?? null,
        pegadinha: typeof q.pegadinha === 'string'
            ? q.pegadinha
            : (q.detalhe_pegadinha ?? q.detalhePegadinha ?? null),
        tipoPegadinha: q.tipo_pegadinha ?? q.tipoPegadinha ?? null,
        palavrasAlerta: q.palavras_alerta ?? q.palavrasAlerta ?? [],
        detalhePegadinha: q.detalhe_pegadinha ?? q.detalhePegadinha ?? null,
        referenciaLegal: q.referencia_legal ?? q.referenciaLegal ?? null,
        comentarioProfessor: q.comentario_professor ?? q.comentarioProfessor ?? null,
        analiseEstudo: normalizarAnalise(q.analise_estudo ?? q.analiseEstudo)
    };
}

// ================================================================
// VALIDAÇÃO DE JSON
// ================================================================

function validarJson() {
    const input = document.getElementById('jsonInput');
    const validacao = document.getElementById('jsonValidacao');
    const btnIngerir = document.getElementById('btnIngerir');

    if (!input || !validacao || !btnIngerir) return;

    const texto = input.value.trim();

    if (!texto) {
        validacao.innerHTML = '<span class="text-muted">Aguardando JSON...</span>';
        btnIngerir.disabled = true;
        questoesTemp = [];
        return;
    }

    try {
        const parsed = JSON.parse(texto);

        // Aceita tanto { questoes: [] } quanto o payload v4.0 completo
        if (!parsed.questoes || !Array.isArray(parsed.questoes)) {
            throw new Error('O JSON deve conter um array "questoes".');
        }

        // Valida campos obrigatórios em cada questão
        const errosValidacao = [];
        parsed.questoes.forEach((q, i) => {
            if (!q.enunciado) errosValidacao.push(`Questão ${i + 1}: "enunciado" ausente`);
            if (q.gabarito === undefined || q.gabarito === null)
                errosValidacao.push(`Questão ${i + 1}: "gabarito" ausente`);
            // assunto é opcional (usa disciplina como fallback), mas avisa
            if (!q.assunto && !q.disciplina)
                errosValidacao.push(`Questão ${i + 1}: "assunto" ou "disciplina" ausente`);
        });

        if (errosValidacao.length > 0) {
            throw new Error(errosValidacao.slice(0, 3).join('<br>'));
        }

        // Normaliza e armazena
        questoesTemp = parsed.questoes.map(normalizarQuestao);

        // Resumo para o usuário
        const totalCerto = questoesTemp.filter(q => q.gabarito).length;
        const totalErrado = questoesTemp.length - totalCerto;
        const config = parsed.simulado_config;
        const tituloInfo = config?.titulo
            ? `<span class="text-muted"> — ${escapeHtml(config.titulo)}</span>`
            : '';

        validacao.innerHTML = `
            <span class="text-success">
                ✅ JSON válido! ${questoesTemp.length} questão(ões)${tituloInfo}
            </span>
            <span style="margin-left:12px" class="text-xs text-muted">
                ✅ ${totalCerto} certo(s) &nbsp;|&nbsp; ❌ ${totalErrado} errado(s)
            </span>
        `;
        btnIngerir.disabled = false;

    } catch (e) {
        validacao.innerHTML = `<span class="text-danger">❌ ${e.message}</span>`;
        btnIngerir.disabled = true;
        questoesTemp = [];
    }
}

// ================================================================
// PREVIEW DAS QUESTÕES
// ================================================================

function renderizarPreview() {
    const container = document.getElementById('previewContainer');
    if (!container) return;

    if (questoesTemp.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p class="text-muted" style="text-align:center;padding:40px">
                    📋 Cole um JSON na aba "Ingerir Questões" para visualizar o preview.
                </p>
            </div>`;
        return;
    }

    // ── Cabeçalho do simulado (se vier simulado_config no JSON atual) ──
    let headerHtml = '';
    try {
        const parsed = JSON.parse(document.getElementById('jsonInput').value || '{}');
        const cfg = parsed.simulado_config;
        const meta = parsed.metadados_evolucao;

        if (cfg) {
            headerHtml = `
                <div class="card" style="margin-bottom:20px;
                     border-left:4px solid var(--accent-blue)">
                    <div class="card-title" style="margin-bottom:6px">
                        📋 ${escapeHtml(cfg.titulo || '')}
                    </div>
                    <p class="text-sm text-muted">${escapeHtml(cfg.objetivo || '')}</p>
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                        <span class="badge badge-assunto">🏛️ ${escapeHtml(cfg.banca || '')}</span>
                        <span class="badge" style="background:var(--bg-primary)">
                            📄 ${escapeHtml(cfg.formato || '')}
                        </span>
                        <span class="badge badge-ia">v${escapeHtml(cfg.versao_payload || '')}</span>
                        <span class="badge" style="background:var(--bg-primary)">
                            🔑 ${escapeHtml(cfg.id || '')}
                        </span>
                    </div>
                    ${meta?.controle_revisao?.alerta_palavra_chave_critica ? `
                        <div style="margin-top:10px" class="text-xs text-warn">
                            ⚠️ Alerta: ${escapeHtml(meta.controle_revisao.alerta_palavra_chave_critica)}
                        </div>` : ''}
                </div>`;
        }
    } catch (_) { /* JSON ainda inválido durante a digitação — ignora */ }

    // ── Cards de resumo ──
    const totalPegadinhas = questoesTemp.filter(q => q.tipoPegadinha).length;
    const assuntosUnicos = [...new Set(questoesTemp.map(q => q.assunto))].length;

    const resumoHtml = `
        <div class="card" style="margin-bottom:20px">
            <div class="card-header">
                <span class="card-title">📊 Resumo do Lote</span>
            </div>
            <div style="display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
                        gap:12px">
                <div class="stat-card">
                    <div class="stat-value">${questoesTemp.length}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value">${questoesTemp.filter(q => q.gabarito).length}</div>
                    <div class="stat-label">Gabarito CERTO</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-value">${questoesTemp.filter(q => !q.gabarito).length}</div>
                    <div class="stat-label">Gabarito ERRADO</div>
                </div>
                <div class="stat-card warn">
                    <div class="stat-value">${totalPegadinhas}</div>
                    <div class="stat-label">Com Pegadinha</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${assuntosUnicos}</div>
                    <div class="stat-label">Assuntos Únicos</div>
                </div>
            </div>
        </div>`;

    // ── Cards de questões ──
    const questoesHtml = questoesTemp.map((q, i) => {
        const ae = q.analiseEstudo;

        const badgePegadinha = q.tipoPegadinha
            ? `<span class="badge badge-alerta">🪤 ${escapeHtml(q.tipoPegadinha)}</span>`
            : '';

        const badgeLegal = q.referenciaLegal
            ? `<span class="badge" style="background:var(--bg-primary);
               color:var(--text-secondary)">⚖️ ${escapeHtml(q.referenciaLegal)}</span>`
            : '';

        const topicoHtml = q.topico
            ? `<p class="text-xs text-muted" style="margin:6px 0 2px">
               📌 ${escapeHtml(q.topico)}</p>`
            : '';

        const detalhePegadinhaHtml = q.detalhePegadinha ? `
            <div class="feedback-section"
                 style="margin-top:12px;padding-top:12px;
                        border-top:1px solid var(--border)">
                <div class="feedback-section-label">🪤 Detalhe da Pegadinha</div>
                <p class="text-sm">${escapeHtml(q.detalhePegadinha)}</p>
            </div>` : '';

        const comentarioHtml = q.comentarioProfessor ? `
            <div class="feedback-section"
                 style="padding-top:10px;margin-top:10px;
                        border-top:1px solid var(--border)">
                <div class="feedback-section-label">👨‍🏫 Comentário do Professor</div>
                <p class="text-sm">${escapeHtml(q.comentarioProfessor)}</p>
            </div>` : '';

        const palavrasHtml = q.palavrasAlerta?.length ? `
            <div style="margin-top:10px">
                <span class="feedback-section-label">⚠️ Palavras-alerta: </span>
                ${q.palavrasAlerta.map(p =>
            `<span class="badge badge-alerta">${escapeHtml(p)}</span>`
        ).join(' ')}
            </div>` : '';

        const mnemonicoHtml = ae?.meuMnemonicoPersonal ? `
            <div class="mnemonico-box" style="margin-top:12px">
                <div class="feedback-section-label">💡 Mnemônico</div>
                <p class="text-sm" style="color:var(--accent-purple);font-weight:600">
                    ${escapeHtml(ae.meuMnemonicoPersonal)}
                </p>
            </div>` : '';

        return `
            <div class="questao-card" style="margin-bottom:16px">
                <div class="questao-meta">
                    <span class="badge" style="background:var(--bg-primary);
                          color:var(--text-secondary)">#${q.idOrigem ?? i + 1}</span>
                    <span class="badge badge-assunto">
                        📚 ${escapeHtml(q.assunto)}
                    </span>
                    <span class="badge ${q.gabarito ? 'badge-assunto' : 'badge-critico'}">
                        ${q.gabarito ? '✅ CERTO' : '❌ ERRADO'}
                    </span>
                    ${badgePegadinha}
                    ${badgeLegal}
                </div>
                ${topicoHtml}
                <div class="questao-enunciado" style="margin-top:10px">
                    ${escapeHtml(q.enunciado)}
                </div>
                ${detalhePegadinhaHtml}
                ${comentarioHtml}
                ${palavrasHtml}
                ${mnemonicoHtml}
            </div>`;
    }).join('');

    container.innerHTML = headerHtml + resumoHtml + questoesHtml;
}

// ================================================================
// INGESTÃO NO BANCO
// ================================================================

async function ingerirQuestoes() {
    const btnIngerir = document.getElementById('btnIngerir');
    const resultado = document.getElementById('resultadoIngestao');
    const cardResultado = document.getElementById('cardResultado');

    if (questoesTemp.length === 0) {
        toast('Nenhuma questão para ingerir!', 'error');
        return;
    }

    if (!confirm(`Deseja ingerir ${questoesTemp.length} questão(ões) no banco de dados?`)) {
        return;
    }

    btnIngerir.disabled = true;
    btnIngerir.innerHTML = '⏳ Ingerindo...';

    // Monta o payload final no formato esperado pelo IngestaoRequest Java
    let simuladoConfig = null;
    let metadadosEvolucao = null;
    try {
        const parsed = JSON.parse(document.getElementById('jsonInput').value || '{}');
        simuladoConfig = parsed.simulado_config ?? null;
        metadadosEvolucao = parsed.metadados_evolucao ?? null;
    } catch (_) { /* ignora se o campo foi limpo */ }

    const payloadFinal = {
        simuladoConfig,
        questoes: questoesTemp,
        metadadosEvolucao
    };

    try {
        const res = await fetch(`${API}/questoes/ingerir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadFinal)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`HTTP ${res.status}: ${err}`);
        }

        const data = await res.json();

        resultado.style.display = 'block';

        const temErros = (data.erros?.length ?? 0) > 0;
        cardResultado.style.borderLeft =
            `4px solid ${data.inseridas > 0 ? 'var(--accent-green)' : 'var(--accent-red)'}`;

        cardResultado.innerHTML = `
            <div class="card-header">
                <span class="card-title">
                    ${data.inseridas > 0 ? '✅' : '❌'} Ingestão Concluída
                </span>
            </div>
            <div style="display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
                        gap:12px;margin-top:16px">
                <div class="stat-card success">
                    <div class="stat-value">${data.inseridas ?? 0}</div>
                    <div class="stat-label">Inseridas</div>
                </div>
                <div class="stat-card ${temErros ? 'danger' : ''}">
                    <div class="stat-value">${data.erros?.length ?? 0}</div>
                    <div class="stat-label">Erros</div>
                </div>
            </div>
            ${data.ids?.length ? `
                <div style="margin-top:16px">
                    <div class="feedback-section-label">UUIDs gerados:</div>
                    <div style="font-family:monospace;font-size:.72rem;
                                color:var(--text-muted);max-height:110px;
                                overflow-y:auto;padding:8px;
                                background:var(--bg-primary);
                                border-radius:var(--radius-sm)">
                        ${data.ids.join('\n')}
                    </div>
                </div>` : ''}
            ${temErros ? `
                <div style="margin-top:12px">
                    <div class="feedback-section-label text-danger">Erros:</div>
                    <ul style="padding-left:20px;color:var(--accent-red);font-size:.8rem">
                        ${data.erros.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
                    </ul>
                </div>` : ''}
        `;

        toast(`✅ ${data.inseridas} questão(ões) inserida(s)!`, 'success');
        limparJson();
        adminShowSection('preview');

    } catch (e) {
        console.error('Erro na ingestão:', e);
        resultado.style.display = 'block';
        cardResultado.style.borderLeft = '4px solid var(--accent-red)';
        cardResultado.innerHTML = `
            <div class="card-header">
                <span class="card-title text-danger">❌ Erro na Ingestão</span>
            </div>
            <p class="text-danger" style="margin-top:12px">${escapeHtml(e.message)}</p>
        `;
        toast('Erro ao ingerir: ' + e.message, 'error');

    } finally {
        btnIngerir.disabled = false;
        btnIngerir.innerHTML = '📥 Ingerir no Banco';
    }
}

// ================================================================
// UTILITÁRIOS
// ================================================================

function toast(msg, tipo = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}