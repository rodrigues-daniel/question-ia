// ================================================================
// app.js — Área de Estudo v5.1
// Filtros: assunto, tópico, vencidas, não respondidos na rodada
// Modo: card único / lista
// ================================================================

const API = 'http://localhost:8080/api';
let sessionId = localStorage.getItem('sessionId') || 'default';
let questoesCarregadas = [];
let indiceAtual = 0;
let modoVisualizacao = localStorage.getItem('modoVisualizacao') || 'card';

// IDs respondidos na rodada atual (reset ao recarregar questões)
let respondidosNaRodada = new Set();

// ================================================================
// INICIALIZAÇÃO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    aplicarTema();
    carregarAssuntos();
    carregarEstatisticas();
    carregarQuestoes();
    document.getElementById('themeToggle').addEventListener('click', alternarTema);
    sincronizarBotoesModo();
});

// ================================================================
// TEMA
// ================================================================

function aplicarTema() {
    const tema = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-theme', tema);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = tema === 'dark' ? '☀️ Claro' : '🌙 Escuro';
}

function alternarTema() {
    const atual = document.documentElement.getAttribute('data-theme');
    const novo = atual === 'dark' ? 'light' : 'dark';
    localStorage.setItem('tema', novo);
    document.documentElement.setAttribute('data-theme', novo);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = novo === 'dark' ? '☀️ Claro' : '🌙 Escuro';
}

// ================================================================
// NAVEGAÇÃO DE SEÇÕES
// ================================================================

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`sec-${id}`)?.classList.add('active');
    document.querySelectorAll(`[data-section="${id}"]`)
        .forEach(n => n.classList.add('active'));

    if (id === 'questoes') carregarQuestoes();
    if (id === 'criticas') carregarCriticas();
    if (id === 'painel') carregarEstatisticas();
}

// ================================================================
// ESTATÍSTICAS
// ================================================================

async function carregarEstatisticas() {
    try {
        const res = await fetch(`${API}/estudo/estatisticas?sessionId=${sessionId}`);
        const stats = await res.json();
        renderizarStats(stats);
    } catch (e) { console.error('Erro estatísticas:', e); }
}

function renderizarStats(s) {
    const grid = document.getElementById('statsGrid');
    const taxa = s.totalTentativas > 0
        ? Math.round((s.totalAcertos / s.totalTentativas) * 100) : 0;

    grid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${s.totalQuestoes || 0}</div>
            <div class="stat-label">Total de Questões</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${s.questoesEstudadas || 0}</div>
            <div class="stat-label">Estudadas</div>
        </div>
        <div class="stat-card success">
            <div class="stat-value">${taxa}%</div>
            <div class="stat-label">Taxa de Acerto</div>
        </div>
        <div class="stat-card warn">
            <div class="stat-value">${s.revisoesPendentes || 0}</div>
            <div class="stat-label">Revisões Pendentes</div>
        </div>
        <div class="stat-card danger">
            <div class="stat-value">${s.questoesCriticas || 0}</div>
            <div class="stat-label">Questões Críticas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${Number(s.mediaGrauCerteza || 0).toFixed(1)}</div>
            <div class="stat-label">Grau de Certeza</div>
        </div>`;

    const badge = document.getElementById('badge-criticas');
    if (badge) {
        badge.textContent = s.questoesCriticas > 0 ? s.questoesCriticas : '';
        badge.style.display = s.questoesCriticas > 0 ? 'inline-flex' : 'none';
    }
}

// ================================================================
// ASSUNTOS E TÓPICOS (cascata)
// ================================================================

async function carregarAssuntos() {
    try {
        const res = await fetch(`${API}/estudo/assuntos`);
        const assuntos = await res.json();

        const sel = document.getElementById('filtroAssunto');
        const iaAssunto = document.getElementById('iaAssunto');

        assuntos.forEach(a => {
            const opt = `<option value="${a}">${a}</option>`;
            if (sel && !sel.querySelector(`[value="${a}"]`))
                sel.insertAdjacentHTML('beforeend', opt);
            if (iaAssunto && !iaAssunto.querySelector(`[value="${a}"]`))
                iaAssunto.insertAdjacentHTML('beforeend', opt);
        });
    } catch (e) { console.error('Erro assuntos:', e); }
}

/**
 * Chamado ao mudar o filtro de assunto.
 * Recarrega os tópicos disponíveis para o assunto escolhido.
 */
async function onAssuntoChange() {
    const assunto = document.getElementById('filtroAssunto')?.value || '';
    const selTopico = document.getElementById('filtroTopico');

    if (!selTopico) return;

    // Reset do select de tópicos
    selTopico.innerHTML = '<option value="">Todos os tópicos</option>';
    selTopico.disabled = true;

    if (assunto) {
        try {
            const res = await fetch(`${API}/estudo/topicos?assunto=${encodeURIComponent(assunto)}`);
            const topicos = await res.json();

            if (topicos.length > 0) {
                topicos.forEach(t => {
                    selTopico.insertAdjacentHTML('beforeend',
                        `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`);
                });
                selTopico.disabled = false;
            }
        } catch (e) { console.error('Erro tópicos:', e); }
    } else {
        // Sem assunto selecionado: carrega todos os tópicos
        try {
            const res = await fetch(`${API}/estudo/topicos`);
            const topicos = await res.json();
            topicos.forEach(t => {
                selTopico.insertAdjacentHTML('beforeend',
                    `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`);
            });
            selTopico.disabled = topicos.length === 0;
        } catch (e) { console.error('Erro tópicos gerais:', e); }
    }

    carregarQuestoes();
}

// ================================================================
// MODO DE VISUALIZAÇÃO
// ================================================================

function sincronizarBotoesModo() {
    document.getElementById('btnModoCard')?.classList.toggle('active', modoVisualizacao === 'card');
    document.getElementById('btnModoLista')?.classList.toggle('active', modoVisualizacao === 'lista');
    const navCard = document.getElementById('navCard');
    if (navCard) navCard.style.display = modoVisualizacao === 'card' ? 'flex' : 'none';
}

function aplicarModoVisualizacao(modo, recarregar = true) {
    modoVisualizacao = modo;
    localStorage.setItem('modoVisualizacao', modo);
    sincronizarBotoesModo();
    if (recarregar) renderizarQuestoes();
}

function navAnterior() {
    // No modo "não respondidos": pula para anterior não respondido
    if (filtroNaoRespondidos()) {
        const anterior = encontrarIndiceNaoRespondido(indiceAtual - 1, -1);
        if (anterior !== -1) { indiceAtual = anterior; renderizarQuestoes(); }
        return;
    }
    if (indiceAtual > 0) { indiceAtual--; renderizarQuestoes(); }
}

function navProxima() {
    // No modo "não respondidos": pula para próximo não respondido
    if (filtroNaoRespondidos()) {
        const proximo = encontrarIndiceNaoRespondido(indiceAtual + 1, 1);
        if (proximo !== -1) { indiceAtual = proximo; renderizarQuestoes(); }
        return;
    }
    if (indiceAtual < questoesCarregadas.length - 1) { indiceAtual++; renderizarQuestoes(); }
}

function filtroNaoRespondidos() {
    return document.getElementById('filtroNaoRespondidos')?.checked || false;
}

/**
 * Encontra o índice de uma questão ainda não respondida na rodada,
 * buscando a partir de `inicio` na direção `direcao` (+1 ou -1).
 */
function encontrarIndiceNaoRespondido(inicio, direcao) {
    let i = inicio;
    while (i >= 0 && i < questoesCarregadas.length) {
        const q = questoesCarregadas[i];
        if (!respondidosNaRodada.has(q.id)) return i;
        i += direcao;
    }
    return -1;
}

// ================================================================
// CARREGAR QUESTÕES
// ================================================================

async function carregarQuestoes() {
    const assunto = document.getElementById('filtroAssunto')?.value || '';
    const topico = document.getElementById('filtroTopico')?.value || '';
    const limite = document.getElementById('filtroLimite')?.value || 10;
    const apenasVencidas = document.getElementById('filtroVencidas')?.checked || false;
    const apenasNaoResp = document.getElementById('filtroBanco')?.checked || false;

    const container = document.getElementById('questoesContainer');
    container.innerHTML =
        '<p class="text-muted loading" style="text-align:center;padding:40px">Carregando questões...</p>';

    // Limpa respondidos da rodada ao buscar novas questões
    respondidosNaRodada.clear();
    atualizarContadorRodada();

    try {
        const params = new URLSearchParams({ sessionId, limite, apenasVencidas });
        if (assunto) params.set('assunto', assunto);
        if (topico) params.set('topico', topico);
        if (apenasNaoResp) params.set('apenasNaoRespondidas', 'true');

        const res = await fetch(`${API}/estudo/questoes?${params}`);
        questoesCarregadas = await res.json();
        indiceAtual = 0;

        // Se "não respondidos na rodada" está ativo, filtra localmente também
        // (garante consistência mesmo sem recarregar do servidor)
        const questoesVisiveis = questoesFiltradas();

        if (questoesVisiveis.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px">
                    <div style="font-size:3rem">🎉</div>
                    <h3 style="margin-top:12px;color:var(--accent-green)">
                        ${respondidosNaRodada.size > 0
                    ? 'Você respondeu todas as questões desta rodada!'
                    : 'Nenhuma questão encontrada com os filtros selecionados.'}
                    </h3>
                    <p class="text-muted" style="margin-top:8px">
                        ${respondidosNaRodada.size > 0
                    ? 'Remova o filtro ou carregue uma nova rodada.'
                    : 'Tente ajustar os filtros.'}
                    </p>
                    <button class="btn btn-outline" style="margin-top:16px"
                            onclick="resetarRodada()">
                        🔄 Nova Rodada
                    </button>
                </div>`;
            return;
        }

        renderizarQuestoes();
        atualizarContadorRodada();

    } catch (e) {
        container.innerHTML =
            `<p class="text-danger" style="padding:20px">Erro: ${e.message}</p>`;
    }
}

async function carregarCriticas() {
    const container = document.getElementById('criticasContainer');
    container.innerHTML =
        '<p class="text-muted loading" style="text-align:center;padding:40px">Carregando...</p>';
    try {
        const res = await fetch(`${API}/estudo/criticas?sessionId=${sessionId}`);
        const criticas = await res.json();

        if (criticas.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px">
                    <div style="font-size:3rem">✅</div>
                    <h3 style="margin-top:12px;color:var(--accent-green)">
                        Nenhuma questão crítica!
                    </h3>
                </div>`;
            return;
        }
        container.innerHTML = criticas
            .map((q, i) => renderizarQuestaoCard(q, i, 'critica'))
            .join('');
    } catch (e) {
        container.innerHTML = `<p class="text-danger">Erro: ${e.message}</p>`;
    }
}

// ================================================================
// FILTRO LOCAL "NÃO RESPONDIDOS NA RODADA"
// ================================================================

/**
 * Retorna as questões carregadas que ainda não foram respondidas
 * na rodada atual, se o filtro estiver ativo.
 */
function questoesFiltradas() {
    const filtroAtivo = document.getElementById('filtroNaoRespondidos')?.checked || false;
    if (!filtroAtivo) return questoesCarregadas;
    return questoesCarregadas.filter(q => !respondidosNaRodada.has(q.id));
}

function atualizarContadorRodada() {
    const el = document.getElementById('contadorRodada');
    if (!el) return;

    const total = questoesCarregadas.length;
    const respondidos = respondidosNaRodada.size;
    const restantes = total - respondidos;

    if (total === 0) {
        el.style.display = 'none';
        return;
    }

    el.style.display = 'flex';
    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex:1">
            <span class="text-xs text-muted">Rodada:</span>
            <div class="progress-bar" style="flex:1;max-width:200px">
                <div class="progress-fill"
                     style="width:${(respondidos / total) * 100}%;
                            background:${respondidos === total
            ? 'var(--accent-green)' : 'var(--accent-blue)'}">
                </div>
            </div>
            <span class="text-xs text-bold">
                ${respondidos}/${total} respondidas
            </span>
            ${restantes > 0
            ? `<span class="badge badge-alerta">${restantes} restante(s)</span>`
            : `<span class="badge badge-assunto">✅ Completa!</span>`}
        </div>
        <button class="btn btn-ghost btn-sm" onclick="resetarRodada()">
            🔄 Nova Rodada
        </button>`;
}

/**
 * Reseta o controle de respondidos e recarrega as questões.
 */
function resetarRodada() {
    respondidosNaRodada.clear();
    // Remove o filtro "não respondidos" para não travar
    const filtro = document.getElementById('filtroNaoRespondidos');
    if (filtro) filtro.checked = false;
    carregarQuestoes();
}

/**
 * Chamado ao alterar o checkbox "não respondidos".
 * Reaplica filtro local sem buscar no servidor.
 */
function onFiltroNaoRespondidosChange() {
    indiceAtual = 0;
    renderizarQuestoes();
    atualizarContadorRodada();
}

// ================================================================
// RENDERIZAÇÃO PRINCIPAL
// ================================================================

function renderizarQuestoes() {
    const container = document.getElementById('questoesContainer');
    if (!questoesCarregadas.length) return;

    const visíveis = questoesFiltradas();

    if (visíveis.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px">
                <div style="font-size:2.5rem">✅</div>
                <h3 style="margin-top:12px;color:var(--accent-green)">
                    Todas respondidas nesta rodada!
                </h3>
                <button class="btn btn-primary" style="margin-top:16px"
                        onclick="resetarRodada()">
                    🔄 Nova Rodada
                </button>
            </div>`;
        return;
    }

    // Garante que indiceAtual aponte para uma questão visível
    if (modoVisualizacao === 'card') {
        // No modo card, indiceAtual refere-se ao array `visíveis`
        if (indiceAtual >= visíveis.length) indiceAtual = 0;
        renderizarModoCard(container, visíveis);
    } else {
        renderizarModoLista(container, visíveis);
    }
}

// ---- Modo Card Único ----

function renderizarModoCard(container, visíveis) {
    const q = visíveis[indiceAtual];
    // índice real no array original (para o responder())
    const indexReal = questoesCarregadas.indexOf(q);

    const nav = `
        <div id="navCard"
             style="display:flex;align-items:center;justify-content:space-between;
                    margin-bottom:16px;padding:12px 16px;
                    background:var(--bg-card);border-radius:var(--radius-md);
                    border:1px solid var(--border)">
            <button class="btn btn-outline btn-sm" onclick="navAnterior()"
                    ${indiceAtual === 0 ? 'disabled' : ''}>
                ← Anterior
            </button>
            <div style="text-align:center">
                <span class="text-bold">${indiceAtual + 1}</span>
                <span class="text-muted"> / ${visíveis.length}</span>
                ${questoesCarregadas.length !== visíveis.length
            ? `<span class="text-xs text-muted">
                           (${questoesCarregadas.length} no total)
                       </span>`
            : ''}
                <div class="progress-bar" style="width:180px;margin:6px auto 0">
                    <div class="progress-fill"
                         style="width:${((indiceAtual + 1) / visíveis.length) * 100}%">
                    </div>
                </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="navProxima()"
                    ${indiceAtual === visíveis.length - 1 ? 'disabled' : ''}>
                Próxima →
            </button>
        </div>`;

    container.innerHTML = nav + renderizarQuestaoCard(q, indexReal, 'q');
}

// ---- Modo Lista ----

function renderizarModoLista(container, visíveis) {
    const nav = `<div id="navCard" style="display:none"></div>`;
    container.innerHTML = nav + visíveis
        .map((q) => {
            const indexReal = questoesCarregadas.indexOf(q);
            return renderizarQuestaoCard(q, indexReal, 'q');
        })
        .join('');
}

// ================================================================
// CARD DE QUESTÃO
// ================================================================

function renderizarQuestaoCard(q, index, prefixo = 'q') {
    const cardId = `${prefixo}-${index}`;

    // ── Badge de origem ──
    const origemBadge = q.geradaPorIa
        ? `<span class="badge badge-ia" title="Gerada pela IA interna">🤖 IA Interna</span>`
        : `<span class="badge badge-origem-manual" title="Inserida manualmente">✍️ Manual</span>`;

    // ── Badge de erros ──
    const errosBadge = q.errosRecorrentes >= 3
        ? `<span class="badge badge-critico">⚠️ ${q.errosRecorrentes} erros</span>`
        : q.errosRecorrentes > 0
            ? `<span class="badge badge-alerta">⚠️ ${q.errosRecorrentes} erro(s)</span>`
            : '';

    // ── Badge de respondida na rodada ──
    const jaRespondida = respondidosNaRodada.has(q.id);
    const respondidaBadge = jaRespondida
        ? `<span class="badge" style="background:#dcfce7;color:#166534">✔ Respondida</span>`
        : '';

    const metaInfo = q.tentativas > 0
        ? `<span class="text-xs text-muted">
               ${q.tentativas} tentativa(s) · Certeza: ${q.grauCerteza}/5
           </span>`
        : `<span class="badge" style="background:var(--bg-primary)">🆕 Nunca respondida</span>`;

    // ── Mnemônico pessoal (salvo no banco) ──
    const mnemonico = q.mnemonicoPersonal ? `
        <div class="mnemonico-box" style="margin-top:8px">
            <div class="feedback-section-label">💡 Mnemônico pessoal</div>
            <div style="color:var(--accent-purple);font-weight:600">
                ${escapeHtml(q.mnemonicoPersonal)}
            </div>
        </div>` : '';

    // ── Detalhe da Pegadinha (visível desde o início no card) ──
    const detalhePegadinha = q.detalhePegadinha ? `
        <div class="info-box info-box-alerta" style="margin-top:10px">
            <div class="info-box-label">🪤 ${q.tipoPegadinha
            ? escapeHtml(q.tipoPegadinha)
            : 'Pegadinha'}</div>
            <p class="text-sm">${escapeHtml(q.detalhePegadinha)}</p>
        </div>` : '';

    // ── Comentário do Professor (visível desde o início no card) ──
    const comentarioProfessor = q.comentarioProfessor ? `
        <div class="info-box info-box-professor" style="margin-top:10px">
            <div class="info-box-label">👨‍🏫 Comentário do Professor</div>
            <p class="text-sm">${escapeHtml(q.comentarioProfessor)}</p>
        </div>` : '';

    // ── Palavras-alerta (badges antes de responder) ──
    const palavrasAlertaBadges = q.palavrasAlerta?.length ? `
        <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
            <span class="feedback-section-label">⚠️ Palavras-alerta:</span>
            ${q.palavrasAlerta.map(p =>
        `<span class="badge badge-alerta">${escapeHtml(p)}</span>`
    ).join('')}
        </div>` : '';

    return `
        <div class="questao-card ${jaRespondida ? 'ja-respondida' : ''}"
             id="card-${cardId}">

            <!-- ── Meta: assunto + tópico + origem + erros + status ── -->
            <div class="questao-meta" style="margin-bottom:12px;flex-wrap:wrap;gap:6px">
                <span class="badge badge-assunto">📚 ${escapeHtml(q.assunto)}</span>
                ${q.topico
            ? `<span class="badge badge-topico" title="Tópico">
                           📌 ${escapeHtml(q.topico)}
                       </span>`
            : ''}
                ${origemBadge}
                ${errosBadge}
                ${respondidaBadge}
                ${metaInfo}
            </div>

            <!-- ── Referência Legal ── -->
            ${q.referenciaLegal ? `
                <div style="margin-bottom:8px">
                    <span class="badge"
                          style="background:var(--bg-primary);color:var(--text-secondary)">
                        ⚖️ ${escapeHtml(q.referenciaLegal)}
                    </span>
                </div>` : ''}

            <!-- ── Enunciado ── -->
            <div class="questao-enunciado" id="enunciado-${cardId}">
                ${escapeHtml(q.enunciado)}
            </div>

            <!-- ── Palavras-alerta ── -->
            ${palavrasAlertaBadges}

            <!-- ── Detalhes visíveis antes de responder ── -->
            <div id="detalhes-pre-${cardId}">
                ${detalhePegadinha}
                ${comentarioProfessor}
            </div>

            <!-- ── Mnemônico pessoal ── -->
            ${mnemonico}

            <!-- ── Grau de certeza ── -->
            <div style="margin:14px 0 10px">
                <span class="text-xs text-muted">Grau de certeza:</span>
                <div class="grau-certeza" id="grau-${cardId}" data-grau="3">
                    ${[0, 1, 2, 3, 4, 5].map(g => `
                        <button class="grau-btn ${g === 3 ? 'selected' : ''}"
                                onclick="selecionarGrau('${cardId}', ${g})">
                            ${['❓', '😰', '😟', '🤔', '😊', '🎯'][g]} ${g}
                        </button>`).join('')}
                </div>
            </div>

            <!-- ── Botões de resposta ── -->
            <div class="resposta-btns" id="btns-${cardId}">
                <button class="btn btn-success"
                        onclick="responder('${cardId}', ${index}, true)">
                    ✅ CERTO
                </button>
                <button class="btn btn-danger"
                        onclick="responder('${cardId}', ${index}, false)">
                    ❌ ERRADO
                </button>
            </div>

            <!-- ── Feedback (preenchido após responder) ── -->
            <div class="feedback-box" id="feedback-${cardId}"></div>

            <!-- ── Editor de mnemônico (aparece ao errar) ── -->
            <div id="mnemonico-edit-${cardId}" style="display:none">
                <div class="divider"></div>
                <div class="mnemonico-box">
                    <div class="feedback-section-label">💡 Adicionar / Editar Mnemônico</div>
                    <textarea id="mnemonico-input-${cardId}"
                              placeholder="Digite sua dica pessoal..."
                    >${q.mnemonicoPersonal || ''}</textarea>
                    <button class="btn btn-outline btn-sm" style="margin-top:8px"
                            onclick="salvarMnemonico('${cardId}', '${q.id}')">
                        💾 Salvar Mnemônico
                    </button>
                </div>
            </div>
        </div>`;
}

// ================================================================
// RESPONDER QUESTÃO
// ================================================================

function selecionarGrau(cardId, grau) {
    const container = document.getElementById(`grau-${cardId}`);
    container.querySelectorAll('.grau-btn')
        .forEach((b, i) => b.classList.toggle('selected', i === grau));
    container.dataset.grau = grau;
}

async function responder(cardId, index, resposta) {
    const questao = questoesCarregadas[index];
    if (!questao) return;

    const grauContainer = document.getElementById(`grau-${cardId}`);
    const grauCerteza = parseInt(grauContainer?.dataset.grau ?? '3');
    const btns = document.getElementById(`btns-${cardId}`);
    btns.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
        const res = await fetch(`${API}/estudo/responder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questaoId: questao.id, resposta, grauCerteza, sessionId })
        });
        const resultado = await res.json();

        // Marca como respondida na rodada
        respondidosNaRodada.add(questao.id);
        atualizarContadorRodada();

        renderizarFeedback(cardId, questao, resultado);

        // No modo card com filtro "não respondidos" ativo:
        // avança automaticamente após 1.5s se ainda há questões
        if (modoVisualizacao === 'card' && filtroNaoRespondidos()) {
            const proximo = encontrarIndiceNaoRespondido(indiceAtual + 1, 1);
            if (proximo !== -1) {
                setTimeout(() => {
                    indiceAtual = proximo;
                    renderizarQuestoes();
                }, 1800);
            }
        }

    } catch (e) {
        toast('Erro ao responder: ' + e.message, 'error');
        btns.querySelectorAll('button').forEach(b => b.disabled = false);
    }
}

function renderizarFeedback(cardId, questao, resultado) {
    const card = document.getElementById(`card-${cardId}`);
    const feedback = document.getElementById(`feedback-${cardId}`);
    const enunciado = document.getElementById(`enunciado-${cardId}`);

    card.classList.add(resultado.correta ? 'respondida-certo' : 'respondida-errado');

    if (!resultado.correta && resultado.palavrasAlerta?.length) {
        let texto = enunciado.textContent;
        resultado.palavrasAlerta.forEach(p => {
            const re = new RegExp(`(${escapeRegex(p)})`, 'gi');
            texto = texto.replace(re,
                '<span class="palavra-alerta" title="Palavra de alerta!">$1</span>');
        });
        enunciado.innerHTML = texto;
    }

    const proxRevisao = resultado.proximaRevisao
        ? new Date(resultado.proximaRevisao).toLocaleString('pt-BR') : '—';

    let extras = '';
    if (!resultado.correta) {
        if (resultado.explicacaoPegadinha)
            extras += `<div class="feedback-section">
                <div class="feedback-section-label">🪤 Pegadinha</div>
                <p class="text-sm">${escapeHtml(resultado.explicacaoPegadinha)}</p>
            </div>`;
        if (resultado.detalhePegadinha)
            extras += `<div class="feedback-section">
                <div class="feedback-section-label">📖 Detalhe</div>
                <p class="text-sm">${escapeHtml(resultado.detalhePegadinha)}</p>
            </div>`;
        if (resultado.referenciaLegal)
            extras += `<div class="feedback-section">
                <div class="feedback-section-label">⚖️ Referência Legal</div>
                <p class="text-sm text-bold">${escapeHtml(resultado.referenciaLegal)}</p>
            </div>`;

        document.getElementById(`mnemonico-edit-${cardId}`).style.display = 'block';
    }

    if (resultado.mnemonicoPersonal)
        extras += `<div class="feedback-section">
            <div class="feedback-section-label">💡 Seu mnemônico</div>
            <p class="text-sm" style="color:var(--accent-purple);font-weight:600">
                ${escapeHtml(resultado.mnemonicoPersonal)}
            </p>
        </div>`;

    feedback.className = `feedback-box visible ${resultado.correta ? 'certo' : 'errado'}`;
    feedback.innerHTML = `
        <div class="feedback-title">
            ${resultado.correta ? '✅ CORRETO!' : '❌ INCORRETO!'}
            — Gabarito: ${resultado.gabaritoOficial ? 'CERTO' : 'ERRADO'}
        </div>
        <p class="text-sm">${escapeHtml(resultado.mensagemEstudo)}</p>
        ${extras}
        <div class="feedback-section">
            <div class="feedback-section-label">📅 Próxima revisão</div>
            <p class="text-sm">${proxRevisao}</p>
        </div>`;
}

async function salvarMnemonico(cardId, questaoId) {
    const input = document.getElementById(`mnemonico-input-${cardId}`);
    const mnemonico = input?.value?.trim();
    if (!mnemonico) return;
    try {
        await fetch(`${API}/estudo/mnemonico/${questaoId}?sessionId=${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mnemonico })
        });
        toast('Mnemônico salvo!', 'success');
    } catch (e) { toast('Erro ao salvar mnemônico', 'error'); }
}

// ================================================================
// IA — GERAR QUESTÕES
// ================================================================

let questoesIaGeradas = [];

async function gerarQuestoesIa() {
    const assunto = document.getElementById('iaAssunto')?.value || 'Direito Administrativo';
    const quantidade = parseInt(document.getElementById('iaQtd')?.value || '3');
    const btn = document.getElementById('btnGerarIa');
    const container = document.getElementById('iaResultadoContainer');

    btn.disabled = true;
    btn.textContent = '⏳ Gerando...';
    container.style.display = 'none';
    questoesIaGeradas = [];

    try {
        const res = await fetch(`${API}/ia/gerar-questoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assunto, quantidade })
        });
        const data = await res.json();
        const payload = data.payload;
        questoesIaGeradas = payload.questoes || [];
        renderizarQuestoesIaParaEdicao(payload);
        container.style.display = 'block';
    } catch (e) {
        toast('Erro ao gerar questões: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Gerar com IA';
    }
}

function renderizarQuestoesIaParaEdicao(payload) {
    const container = document.getElementById('iaResultadoContainer');
    const config = payload.simulado_config || {};
    const meta = payload.metadados_evolucao || {};

    let html = `
        <div style="display:flex;align-items:center;justify-content:space-between;
             margin-bottom:20px;flex-wrap:wrap;gap:12px">
            <div>
                <div class="card-title">
                    🤖 ${escapeHtml(config.titulo || 'Questões Geradas por IA')}
                </div>
                <p class="text-xs text-muted" style="margin-top:4px">
                    ${escapeHtml(config.objetivo || '')}
                </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <span class="badge badge-ia">🤖 IA Interna</span>
                <span class="badge" style="background:var(--bg-primary)">
                    v${escapeHtml(config.versao_payload || '4.0')}
                </span>
            </div>
        </div>`;

    html += payload.questoes.map((q, i) => renderizarCardIaEditavel(q, i)).join('');

    html += `
        <div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">
            <button class="btn btn-primary btn-lg" onclick="salvarTodasQuestoesIa()">
                💾 Salvar Todas no Banco
            </button>
            <button class="btn btn-outline" onclick="salvarQuestoesIaSelecionadas()">
                ✅ Salvar Selecionadas
            </button>
            <button class="btn btn-ghost"
                    onclick="document.getElementById('iaResultadoContainer').style.display='none'">
                ✖ Descartar
            </button>
        </div>`;

    container.innerHTML = html;
}

function renderizarCardIaEditavel(q, i) {
    const gaboritoTexto = normalizarGabaritoTexto(q.gabarito);
    const ae = q.analise_estudo || {};

    return `
        <div class="questao-card" id="ia-card-${i}"
             style="margin-bottom:20px;border-left:4px solid var(--accent-purple)">
            <div style="display:flex;align-items:center;justify-content:space-between;
                 margin-bottom:12px;flex-wrap:wrap;gap:8px">
                <div class="questao-meta">
                    <span class="badge badge-ia">🤖 IA Interna</span>
                    <span class="badge badge-assunto">
                        📚 ${escapeHtml(q.disciplina || q.assunto || '')}
                    </span>
                    <span class="badge ${gaboritoTexto === 'C' ? 'badge-assunto' : 'badge-critico'}">
                        ${gaboritoTexto === 'C' ? '✅ CERTO' : '❌ ERRADO'}
                    </span>
                    ${q.tipo_pegadinha
            ? `<span class="badge badge-alerta">🪤 ${escapeHtml(q.tipo_pegadinha)}</span>`
            : ''}
                </div>
                <label style="display:flex;align-items:center;gap:6px;
                       cursor:pointer;font-size:.8rem;font-weight:600">
                    <input type="checkbox" id="ia-sel-${i}" checked
                           style="width:16px;height:16px;cursor:pointer" />
                    Incluir
                </label>
            </div>

            ${q.topico
            ? `<p class="text-xs text-muted" style="margin-bottom:8px">
                   📌 ${escapeHtml(q.topico)}</p>`
            : ''}

            <div style="margin-bottom:10px">
                <label class="feedback-section-label">📝 Enunciado</label>
                <textarea id="ia-enunciado-${i}" class="input-field"
                          style="width:100%;min-height:80px;margin-top:4px;
                                 resize:vertical;font-size:.875rem;line-height:1.6"
                >${escapeHtml(q.enunciado)}</textarea>
            </div>

            <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
                <label class="feedback-section-label">Gabarito:</label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                    <input type="radio" name="ia-gab-${i}" value="C"
                           ${gaboritoTexto === 'C' ? 'checked' : ''} />
                    <span class="badge badge-assunto">✅ CERTO</span>
                </label>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
                    <input type="radio" name="ia-gab-${i}" value="E"
                           ${gaboritoTexto === 'E' ? 'checked' : ''} />
                    <span class="badge badge-critico">❌ ERRADO</span>
                </label>
            </div>

            <div style="margin-bottom:10px">
                <label class="feedback-section-label">⚖️ Referência Legal</label>
                <input type="text" id="ia-reflegal-${i}" class="input-field"
                       style="width:100%;margin-top:4px"
                       value="${escapeHtml(q.referencia_legal || '')}"
                       placeholder="Ex: Lei 14.133/2021, Art. 74" />
            </div>

            <div style="margin-bottom:10px">
                <label class="feedback-section-label">🪤 Detalhe da Pegadinha</label>
                <textarea id="ia-pegadinha-${i}" class="input-field"
                          style="width:100%;min-height:60px;margin-top:4px;resize:vertical"
                          placeholder="Descreva a pegadinha (opcional)"
                >${escapeHtml(q.detalhe_pegadinha || '')}</textarea>
            </div>

            <div class="mnemonico-box" style="margin-top:4px">
                <div class="feedback-section-label">💡 Mnemônico</div>
                <textarea id="ia-mnemonico-${i}"
                          style="width:100%;min-height:40px;background:transparent;
                                 border:none;resize:vertical;font-family:var(--font);
                                 font-size:.875rem;color:var(--accent-purple);font-weight:600"
                          placeholder="Dica mnemônica..."
                >${escapeHtml(ae.meu_mnemonico_pessoal || '')}</textarea>
            </div>

            ${(q.palavras_alerta || []).length ? `
                <div style="margin-top:10px">
                    <span class="feedback-section-label">⚠️ Palavras-alerta: </span>
                    ${(q.palavras_alerta || []).map(p =>
                `<span class="badge badge-alerta">${escapeHtml(p)}</span>`
            ).join(' ')}
                </div>` : ''}

            <div style="margin-top:14px;display:flex;justify-content:flex-end">
                <button class="btn btn-outline btn-sm"
                        onclick="salvarQuestaoIaIndividual(${i})">
                    💾 Salvar esta questão
                </button>
            </div>
        </div>`;
}

function normalizarGabaritoTexto(valor) {
    if (typeof valor === 'boolean') return valor ? 'C' : 'E';
    const s = String(valor ?? '').trim().toUpperCase();
    return (s === 'C' || s === 'CERTO' || s === 'TRUE') ? 'C' : 'E';
}

function coletarQuestaoEditada(i) {
    const enunciado = document.getElementById(`ia-enunciado-${i}`)?.value?.trim() || '';
    const gabRadio = document.querySelector(`input[name="ia-gab-${i}"]:checked`)?.value || 'C';
    const refLegal = document.getElementById(`ia-reflegal-${i}`)?.value?.trim() || null;
    const pegadinha = document.getElementById(`ia-pegadinha-${i}`)?.value?.trim() || null;
    const mnemonico = document.getElementById(`ia-mnemonico-${i}`)?.value?.trim() || null;
    const original = questoesIaGeradas[i] || {};
    return {
        ...original, enunciado, gabarito: gabRadio,
        referencia_legal: refLegal, detalhe_pegadinha: pegadinha,
        analise_estudo: {
            ...(original.analise_estudo || {}),
            meu_mnemonico_pessoal: mnemonico
        }
    };
}

async function salvarQuestaoIaIndividual(i) {
    await enviarQuestoesParaBanco([coletarQuestaoEditada(i)]);
}

async function salvarTodasQuestoesIa() {
    await enviarQuestoesParaBanco(questoesIaGeradas.map((_, i) => coletarQuestaoEditada(i)));
}

async function salvarQuestoesIaSelecionadas() {
    const selecionadas = questoesIaGeradas
        .map((_, i) => ({ i, sel: document.getElementById(`ia-sel-${i}`)?.checked }))
        .filter(x => x.sel)
        .map(x => coletarQuestaoEditada(x.i));
    if (!selecionadas.length) { toast('Nenhuma questão selecionada!', 'error'); return; }
    await enviarQuestoesParaBanco(selecionadas);
}

async function enviarQuestoesParaBanco(questoes) {
    if (!questoes.length) return;
    const payload = {
        simuladoConfig: { geradaPorIa: true, origem: 'ia_interna' },
        questoes: questoes.map(q => ({
            idOrigem: q.id ?? null, disciplina: q.disciplina ?? null,
            topico: q.topico ?? null, enunciado: q.enunciado,
            gabarito: normalizarGabaritoTexto(q.gabarito) === 'C',
            assunto: q.assunto ?? q.disciplina ?? 'Geral',
            banca: q.banca ?? 'CEBRASPE',
            pegadinha: q.detalhe_pegadinha ?? null,
            tipoPegadinha: q.tipo_pegadinha ?? null,
            palavrasAlerta: q.palavras_alerta ?? [],
            detalhePegadinha: q.detalhe_pegadinha ?? null,
            referenciaLegal: q.referencia_legal ?? null,
            comentarioProfessor: q.comentario_professor ?? null,
            analiseEstudo: q.analise_estudo ? {
                meuGrauCerteza: q.analise_estudo.meu_grau_certeza ?? 0,
                tentativasAnteriores: q.analise_estudo.tentativas_anteriores ?? 0,
                errosRecorrentes: q.analise_estudo.erros_recorrentes ?? 0,
                proximaRevisaoSugerida: q.analise_estudo.proxima_revisao_sugerida ?? null,
                meuMnemonicoPersonal: q.analise_estudo.meu_mnemonico_pessoal ?? null
            } : null
        })),
        metadadosEvolucao: { iaInterna: true }
    };
    try {
        const res = await fetch(`${API}/questoes/ingerir`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        toast(`✅ ${data.inseridas} questão(ões) salva(s)!`, 'success');
        carregarEstatisticas();
        carregarAssuntos();
    } catch (e) { toast('Erro ao salvar: ' + e.message, 'error'); }
}

// ================================================================
// IA — ANÁLISE
// ================================================================

async function analisarDesempenho() {
    const assuntoFraco = document.getElementById('assuntoFraco')?.value;
    const resultado = document.getElementById('analiseResultado');
    const texto = document.getElementById('analiseTexto');
    resultado.style.display = 'block';
    texto.textContent = '⏳ Analisando...';
    try {
        const params = new URLSearchParams({ sessionId });
        if (assuntoFraco) params.set('assuntoFraco', assuntoFraco);
        const res = await fetch(`${API}/ia/analisar-desempenho?${params}`);
        const data = await res.json();
        texto.textContent = data.analise;
    } catch (e) {
        texto.textContent = 'Erro: ' + e.message;
        toast('Erro na análise IA', 'error');
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
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}