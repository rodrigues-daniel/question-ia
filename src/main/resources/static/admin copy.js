// ================================================================
// admin.js — Área Administrativa
// ================================================================

const API = 'http://localhost:8080/api';
let questoesTemp = []; // Armazena questões validadas temporariamente

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

// ---- Navegação entre Seções ----

function adminShowSection(sectionId) {
    // Remove active de todas as seções
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Adiciona active na seção selecionada
    const sec = document.getElementById(`sec-${sectionId}`);
    if (sec) sec.classList.add('active');

    // Adiciona active no nav item
    document.querySelectorAll(`[data-section="${sectionId}"]`)
        .forEach(n => n.classList.add('active'));

    // Ações específicas por seção
    if (sectionId === 'preview') {
        renderizarPreview();
    }
    if (sectionId === 'exemplo') {
        carregarExemploInicial();
    }
}

// ---- Exemplo de JSON ----

const exemploPayload = {
    "questoes": [
        {
            "enunciado": "No âmbito da administração pública, o princípio da impessoalidade determina que as atuações estatais não podem favorecer ou prejudicar pessoas específicas.",
            "gabarito": true,
            "assunto": "Direito Administrativo",
            "pegadinha": "O princípio da impessoalidade NÃO se confunde com o da finalidade pública.",
            "tipo_pegadinha": "Conceito",
            "palavras_alerta": ["não podem", "favorecer", "prejudicar"],
            "detalhe_pegadinha": "Impessoalidade = tratar todos igualmente. Finalidade pública = objetivo do ato administrativo.",
            "referencia_legal": "CF/88, art. 37, caput"
        },
        {
            "enunciado": "A licitação é dispensável quando houver guerra ou grave perturbação da ordem.",
            "gabarito": true,
            "assunto": "Licitações",
            "pegadinha": "Dispensável ≠ Inexigível. Dispensável = lei autoriza. Inexigível = competição inviável.",
            "tipo_pegadinha": "Confusão de Conceitos",
            "palavras_alerta": ["dispensável", "guerra", "ordem"],
            "detalhe_pegadinha": "Art. 75 da Lei 14.133/2021 lista as hipóteses de dispensa.",
            "referencia_legal": "Lei 14.133/2021, art. 75"
        }
    ]
};

function carregarExemploInicial() {
    const pre = document.getElementById('exemploJson');
    if (pre) {
        pre.textContent = JSON.stringify(exemploPayload, null, 2);
    }
}

function carregarExemplo() {
    const input = document.getElementById('jsonInput');
    if (input) {
        input.value = JSON.stringify(exemploPayload, null, 2);
        validarJson();
        toast('Exemplo carregado!', 'success');
    }
}

function copiarExemplo() {
    const texto = JSON.stringify(exemploPayload, null, 2);
    navigator.clipboard.writeText(texto)
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

// ---- Validação de JSON ----

function validarJson() {
    const input = document.getElementById('jsonInput');
    const validacao = document.getElementById('jsonValidacao');
    const btnIngerir = document.getElementById('btnIngerir');

    if (!input || !validacao || !btnIngerir) return;

    const texto = input.value.trim();

    if (!texto) {
        validacao.innerHTML = '<span class="text-muted">Aguardando JSON...</span>';
        btnIngerir.disabled = true;
        return;
    }

    try {
        const parsed = JSON.parse(texto);

        // Valida estrutura básica
        if (!parsed.questoes || !Array.isArray(parsed.questoes)) {
            throw new Error('JSON deve conter um array "questoes"');
        }

        // Valida campos obrigatórios de cada questão
        const camposObrigatorios = ['enunciado', 'gabarito', 'assunto'];
        const erros = [];

        parsed.questoes.forEach((q, i) => {
            camposObrigatorios.forEach(campo => {
                if (q[campo] === undefined || q[campo] === null) {
                    erros.push(`Questão ${i + 1}: campo "${campo}" ausente`);
                }
            });
        });

        if (erros.length > 0) {
            throw new Error(erros.slice(0, 3).join('<br>'));
        }

        // JSON válido!
        questoesTemp = parsed.questoes;
        validacao.innerHTML = `
            <span class="text-success">
                ✅ JSON válido! ${questoesTemp.length} questão(ões) encontrada(s)
            </span>
        `;
        btnIngerir.disabled = false;

    } catch (e) {
        validacao.innerHTML = `<span class="text-danger">❌ ${e.message}</span>`;
        btnIngerir.disabled = true;
        questoesTemp = [];
    }
}

// ---- Preview das Questões ----

function renderizarPreview() {
    const container = document.getElementById('previewContainer');

    if (!container) return;

    if (questoesTemp.length === 0) {
        container.innerHTML = `
            <div class="card">
                <p class="text-muted" style="text-align:center;padding:40px">
                    📋 Cole um JSON na aba "Ingerir Questões" para visualizar o preview.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="card" style="margin-bottom:16px">
            <div class="card-header">
                <span class="card-title">📊 Resumo</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px">
                <div class="stat-card">
                    <div class="stat-value">${questoesTemp.length}</div>
                    <div class="stat-label">Total de Questões</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${questoesTemp.filter(q => q.gabarito).length}</div>
                    <div class="stat-label">Gabarito: CERTO</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${questoesTemp.filter(q => !q.gabarito).length}</div>
                    <div class="stat-label">Gabarito: ERRADO</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${[...new Set(questoesTemp.map(q => q.assunto))].length}</div>
                    <div class="stat-label">Assuntos Únicos</div>
                </div>
            </div>
        </div>
    `;

    questoesTemp.forEach((q, i) => {
        container.insertAdjacentHTML('beforeend', `
            <div class="questao-card" style="margin-bottom:16px">
                <div class="questao-header">
                    <div class="questao-meta">
                        <span class="badge badge-assunto">📚 ${escapeHtml(q.assunto)}</span>
                        <span class="badge ${q.gabarito ? 'badge-success' : 'badge-danger'}">
                            ${q.gabarito ? '✅ CERTO' : '❌ ERRADO'}
                        </span>
                    </div>
                </div>
                <div class="questao-enunciado">
                    ${escapeHtml(q.enunciado)}
                </div>
                ${q.pegadinha ? `
                    <div class="feedback-section" style="margin-top:12px">
                        <div class="feedback-section-label">🪤 Pegadinha</div>
                        <p class="text-sm">${escapeHtml(q.pegadinha)}</p>
                    </div>
                ` : ''}
                ${q.palavras_alerta?.length ? `
                    <div class="feedback-section" style="margin-top:8px">
                        <div class="feedback-section-label">⚠️ Palavras de Alerta</div>
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                            ${q.palavras_alerta.map(p =>
            `<span class="badge badge-alerta">${escapeHtml(p)}</span>`
        ).join('')}
                        </div>
                    </div>
                ` : ''}
                ${q.referencia_legal ? `
                    <div class="feedback-section" style="margin-top:8px">
                        <div class="feedback-section-label">⚖️ Referência Legal</div>
                        <p class="text-sm text-bold">${escapeHtml(q.referencia_legal)}</p>
                    </div>
                ` : ''}
            </div>
        `);
    });
}

// ---- Ingestão no Banco ----

async function ingerirQuestoes() {
    const btnIngerir = document.getElementById('btnIngerir');
    const resultado = document.getElementById('resultadoIngestao');
    const cardResultado = document.getElementById('cardResultado');

    if (questoesTemp.length === 0) {
        toast('Nenhuma questão para ingerir!', 'error');
        return;
    }

    // Confirmação
    if (!confirm(`Deseja ingerir ${questoesTemp.length} questão(ões) no banco de dados?`)) {
        return;
    }

    // UI: Loading
    btnIngerir.disabled = true;
    btnIngerir.innerHTML = '⏳ Ingerindo...';

    try {
        const res = await fetch(`${API}/admin/ingerir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questoes: questoesTemp })
        });

        const data = await res.json();

        // UI: Resultado
        resultado.style.display = 'block';
        cardResultado.innerHTML = `
            <div class="card-header">
                <span class="card-title">✅ Ingestão Concluída!</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:16px">
                <div class="stat-card success">
                    <div class="stat-value">${data.sucesso || questoesTemp.length}</div>
                    <div class="stat-label">Inseridas</div>
                </div>
                <div class="stat-card warn">
                    <div class="stat-value">${data.ignoradas || 0}</div>
                    <div class="stat-label">Ignoradas (duplicadas)</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-value">${data.erros || 0}</div>
                    <div class="stat-label">Com Erro</div>
                </div>
            </div>
            ${data.detalhes ? `
                <div class="divider" style="margin:16px 0"></div>
                <div class="text-sm text-muted">${escapeHtml(data.detalhes)}</div>
            ` : ''}
        `;

        toast(`✅ ${data.sucesso || questoesTemp.length} questão(ões) ingerida(s)!`, 'success');

        // Limpa após sucesso
        limparJson();
        adminShowSection('preview');

    } catch (e) {
        console.error('Erro na ingestão:', e);

        resultado.style.display = 'block';
        cardResultado.innerHTML = `
            <div class="card-header">
                <span class="card-title text-danger">❌ Erro na Ingestão</span>
            </div>
            <p class="text-danger" style="margin-top:12px">${e.message}</p>
        `;

        toast('Erro ao ingerir questões: ' + e.message, 'error');
    } finally {
        btnIngerir.disabled = false;
        btnIngerir.innerHTML = '📥 Ingerir no Banco';
    }
}

// ---- Utilitários ----

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
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}