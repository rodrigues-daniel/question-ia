// ================================================================
// app.js — Área de Estudo v5.2
// ================================================================

const API = 'http://localhost:8080/api';
const sessionId = localStorage.getItem('sessionId') || 'default';
let questoesCarregadas = [];
let indiceAtual = 0;
let modoVisualizacao = localStorage.getItem('modoVisualizacao') || 'card';
let respondidosNaRodada = new Set();

// ================================================================
// BOOT
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    aplicarTema();
    sincronizarBotoesModo();
    carregarAssuntos();       // carrega assuntos → ao final chama carregarTopicos('')
    carregarEstatisticas();
    carregarQuestoes();

    document.getElementById('themeToggle')
        ?.addEventListener('click', alternarTema);
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
    document.querySelectorAll('.section')
        .forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item')
        .forEach(n => n.classList.remove('active'));

    document.getElementById('sec-' + id)?.classList.add('active');
    document.querySelectorAll('[data-section="' + id + '"]')
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
        const res = await fetch(API + '/estudo/estatisticas?sessionId=' + sessionId);
        const stats = await res.json();
        renderizarStats(stats);
    } catch (e) {
        console.error('Erro estatísticas:', e);
    }
}

function renderizarStats(s) {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    const taxa = s.totalTentativas > 0
        ? Math.round((s.totalAcertos / s.totalTentativas) * 100) : 0;

    grid.innerHTML =
        '<div class="stat-card">' +
        '<div class="stat-value">' + (s.totalQuestoes || 0) + '</div>' +
        '<div class="stat-label">Total de Questões</div>' +
        '</div>' +
        '<div class="stat-card">' +
        '<div class="stat-value">' + (s.questoesEstudadas || 0) + '</div>' +
        '<div class="stat-label">Estudadas</div>' +
        '</div>' +
        '<div class="stat-card success">' +
        '<div class="stat-value">' + taxa + '%</div>' +
        '<div class="stat-label">Taxa de Acerto</div>' +
        '</div>' +
        '<div class="stat-card warn">' +
        '<div class="stat-value">' + (s.revisoesPendentes || 0) + '</div>' +
        '<div class="stat-label">Revisões Pendentes</div>' +
        '</div>' +
        '<div class="stat-card danger">' +
        '<div class="stat-value">' + (s.questoesCriticas || 0) + '</div>' +
        '<div class="stat-label">Questões Críticas</div>' +
        '</div>' +
        '<div class="stat-card">' +
        '<div class="stat-value">' +
        Number(s.mediaGrauCerteza || 0).toFixed(1) +
        '</div>' +
        '<div class="stat-label">Grau de Certeza</div>' +
        '</div>';

    var badge = document.getElementById('badge-criticas');
    if (badge) {
        badge.textContent = s.questoesCriticas > 0 ? s.questoesCriticas : '';
        badge.style.display = s.questoesCriticas > 0 ? 'inline-flex' : 'none';
    }
}

// ================================================================
// ASSUNTOS E TÓPICOS
// ================================================================

async function carregarAssuntos() {
    try {
        const res = await fetch(API + '/estudo/assuntos');
        const assuntos = await res.json();

        var sel = document.getElementById('filtroAssunto');
        var iaAssunto = document.getElementById('iaAssunto');

        assuntos.forEach(function (a) {
            if (sel && !sel.querySelector('[value="' + a + '"]')) {
                var opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                sel.appendChild(opt);
            }
            if (iaAssunto && !iaAssunto.querySelector('[value="' + a + '"]')) {
                var opt2 = document.createElement('option');
                opt2.value = a;
                opt2.textContent = a;
                iaAssunto.appendChild(opt2);
            }
        });

        // Carrega todos os tópicos logo na inicialização
        await carregarTopicos('');

    } catch (e) {
        console.error('Erro assuntos:', e);
    }
}

async function carregarTopicos(assunto) {
    var selTopico = document.getElementById('filtroTopico');
    if (!selTopico) return;

    var valorAnterior = selTopico.value;

    selTopico.innerHTML = '<option value="">Carregando...</option>';
    selTopico.disabled = true;

    try {
        var url = assunto
            ? API + '/estudo/topicos?assunto=' + encodeURIComponent(assunto)
            : API + '/estudo/topicos';

        const res = await fetch(url);
        const topicos = await res.json();

        selTopico.innerHTML = '<option value="">Todos os tópicos</option>';

        if (topicos.length === 0) {
            selTopico.disabled = false;
            return;
        }

        topicos.forEach(function (t) {
            var opt = document.createElement('option');
            opt.value = t;
            opt.textContent = t;
            if (t === valorAnterior) opt.selected = true;
            selTopico.appendChild(opt);
        });

        selTopico.disabled = false;

    } catch (e) {
        console.error('Erro tópicos:', e);
        selTopico.innerHTML = '<option value="">Todos os tópicos</option>';
        selTopico.disabled = false;
    }
}

async function onAssuntoChange() {
    var assunto = document.getElementById('filtroAssunto')?.value || '';
    await carregarTopicos(assunto);
    carregarQuestoes();
}

// ================================================================
// MODO DE VISUALIZAÇÃO
// ================================================================

function sincronizarBotoesModo() {
    var btnCard = document.getElementById('btnModoCard');
    var btnLista = document.getElementById('btnModoLista');
    if (btnCard) btnCard.classList.toggle('active', modoVisualizacao === 'card');
    if (btnLista) btnLista.classList.toggle('active', modoVisualizacao === 'lista');
}

function aplicarModoVisualizacao(modo) {
    modoVisualizacao = modo;
    localStorage.setItem('modoVisualizacao', modo);
    sincronizarBotoesModo();
    renderizarQuestoes();
}

function navAnterior() {
    if (filtroNaoRespondidosAtivo()) {
        var visiveis = questoesFiltradas();
        if (indiceAtual > 0) {
            indiceAtual--;
            renderizarQuestoes();
        }
        return;
    }
    if (indiceAtual > 0) {
        indiceAtual--;
        renderizarQuestoes();
    }
}

function navProxima() {
    var visiveis = questoesFiltradas();
    if (indiceAtual < visiveis.length - 1) {
        indiceAtual++;
        renderizarQuestoes();
    }
}

function filtroNaoRespondidosAtivo() {
    var el = document.getElementById('filtroNaoRespondidos');
    return el ? el.checked : false;
}

// ================================================================
// CARREGAR QUESTÕES
// ================================================================

async function carregarQuestoes() {
    var assunto = document.getElementById('filtroAssunto')?.value || '';
    var topico = document.getElementById('filtroTopico')?.value || '';
    var limite = document.getElementById('filtroLimite')?.value || 10;
    var apenasVencidas = document.getElementById('filtroVencidas')?.checked || false;
    var apenasNaoResp = document.getElementById('filtroBanco')?.checked || false;

    var container = document.getElementById('questoesContainer');
    if (!container) return;

    container.innerHTML =
        '<p class="text-muted loading" style="text-align:center;padding:40px">' +
        'Carregando questões...</p>';

    respondidosNaRodada.clear();
    atualizarContadorRodada();

    try {
        var params = new URLSearchParams();
        params.set('sessionId', sessionId);
        params.set('limite', limite);
        params.set('apenasVencidas', apenasVencidas);
        if (assunto) params.set('assunto', assunto);
        if (topico) params.set('topico', topico);
        if (apenasNaoResp) params.set('apenasNaoRespondidas', 'true');

        const res = await fetch(API + '/estudo/questoes?' + params.toString());
        questoesCarregadas = await res.json();
        indiceAtual = 0;

        if (questoesCarregadas.length === 0) {
            container.innerHTML =
                '<div style="text-align:center;padding:60px">' +
                '<div style="font-size:3rem">🎉</div>' +
                '<h3 style="margin-top:12px;color:var(--accent-green)">' +
                'Nenhuma questão encontrada com os filtros selecionados.' +
                '</h3>' +
                '<button class="btn btn-outline" style="margin-top:16px" ' +
                'onclick="resetarRodada()">🔄 Nova Rodada</button>' +
                '</div>';
            return;
        }

        renderizarQuestoes();
        atualizarContadorRodada();

    } catch (e) {
        container.innerHTML =
            '<p class="text-danger" style="padding:20px">Erro: ' + e.message + '</p>';
    }
}

async function carregarCriticas() {
    var container = document.getElementById('criticasContainer');
    if (!container) return;

    container.innerHTML =
        '<p class="text-muted loading" style="text-align:center;padding:40px">' +
        'Carregando...</p>';

    try {
        const res = await fetch(API + '/estudo/criticas?sessionId=' + sessionId);
        const criticas = await res.json();

        if (criticas.length === 0) {
            container.innerHTML =
                '<div style="text-align:center;padding:60px">' +
                '<div style="font-size:3rem">✅</div>' +
                '<h3 style="margin-top:12px;color:var(--accent-green)">' +
                'Nenhuma questão crítica!' +
                '</h3>' +
                '</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < criticas.length; i++) {
            html += renderizarQuestaoCard(criticas[i], i, 'critica');
        }
        container.innerHTML = html;

    } catch (e) {
        container.innerHTML =
            '<p class="text-danger">Erro: ' + e.message + '</p>';
    }
}

// ================================================================
// FILTRO LOCAL "NÃO RESPONDIDOS NA RODADA"
// ================================================================

function questoesFiltradas() {
    if (!filtroNaoRespondidosAtivo()) return questoesCarregadas;
    return questoesCarregadas.filter(function (q) {
        return !respondidosNaRodada.has(q.id);
    });
}

function atualizarContadorRodada() {
    var el = document.getElementById('contadorRodada');
    if (!el) return;

    var total = questoesCarregadas.length;
    var respondidos = respondidosNaRodada.size;
    var restantes = total - respondidos;

    if (total === 0) {
        el.style.display = 'none';
        return;
    }

    var pct = Math.round((respondidos / total) * 100);
    var cor = respondidos === total ? 'var(--accent-green)' : 'var(--accent-blue)';
    var badgeR = restantes > 0
        ? '<span class="badge badge-alerta">' + restantes + ' restante(s)</span>'
        : '<span class="badge badge-assunto">✅ Completa!</span>';

    el.style.display = 'flex';
    el.innerHTML =
        '<div style="display:flex;align-items:center;gap:10px;flex:1">' +
        '<span class="text-xs text-muted">Rodada:</span>' +
        '<div class="progress-bar" style="flex:1;max-width:200px">' +
        '<div class="progress-fill" style="width:' + pct + '%;background:' + cor + '">' +
        '</div>' +
        '</div>' +
        '<span class="text-xs text-bold">' + respondidos + '/' + total + ' respondidas</span>' +
        badgeR +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" onclick="resetarRodada()">🔄 Nova Rodada</button>';
}

function resetarRodada() {
    respondidosNaRodada.clear();
    var filtro = document.getElementById('filtroNaoRespondidos');
    if (filtro) filtro.checked = false;
    carregarQuestoes();
}

function onFiltroNaoRespondidosChange() {
    indiceAtual = 0;
    renderizarQuestoes();
    atualizarContadorRodada();
}

// ================================================================
// RENDERIZAÇÃO PRINCIPAL
// ================================================================

function renderizarQuestoes() {
    var container = document.getElementById('questoesContainer');
    if (!container || questoesCarregadas.length === 0) return;

    var visiveis = questoesFiltradas();

    if (visiveis.length === 0) {
        container.innerHTML =
            '<div style="text-align:center;padding:40px">' +
            '<div style="font-size:2.5rem">✅</div>' +
            '<h3 style="margin-top:12px;color:var(--accent-green)">' +
            'Todas respondidas nesta rodada!' +
            '</h3>' +
            '<button class="btn btn-primary" style="margin-top:16px" ' +
            'onclick="resetarRodada()">🔄 Nova Rodada</button>' +
            '</div>';
        return;
    }

    if (indiceAtual >= visiveis.length) indiceAtual = 0;

    if (modoVisualizacao === 'card') {
        renderizarModoCard(container, visiveis);
    } else {
        renderizarModoLista(container, visiveis);
    }
}

function renderizarModoCard(container, visiveis) {
    var q = visiveis[indiceAtual];
    var indexReal = questoesCarregadas.indexOf(q);
    var total = visiveis.length;
    var pct = Math.round(((indiceAtual + 1) / total) * 100);

    var infoTotal = questoesCarregadas.length !== total
        ? ' <span class="text-xs text-muted">(' + questoesCarregadas.length + ' no total)</span>'
        : '';

    var nav =
        '<div id="navCard" style="display:flex;align-items:center;' +
        'justify-content:space-between;margin-bottom:16px;padding:12px 16px;' +
        'background:var(--bg-card);border-radius:var(--radius-md);' +
        'border:1px solid var(--border)">' +
        '<button class="btn btn-outline btn-sm" onclick="navAnterior()"' +
        (indiceAtual === 0 ? ' disabled' : '') + '>← Anterior</button>' +
        '<div style="text-align:center">' +
        '<span class="text-bold">' + (indiceAtual + 1) + '</span>' +
        '<span class="text-muted"> / ' + total + '</span>' +
        infoTotal +
        '<div class="progress-bar" style="width:180px;margin:6px auto 0">' +
        '<div class="progress-fill" style="width:' + pct + '%"></div>' +
        '</div>' +
        '</div>' +
        '<button class="btn btn-outline btn-sm" onclick="navProxima()"' +
        (indiceAtual === total - 1 ? ' disabled' : '') + '>Próxima →</button>' +
        '</div>';

    container.innerHTML = nav + renderizarQuestaoCard(q, indexReal, 'q');
}

function renderizarModoLista(container, visiveis) {
    var html = '<div id="navCard" style="display:none"></div>';
    for (var i = 0; i < visiveis.length; i++) {
        var indexReal = questoesCarregadas.indexOf(visiveis[i]);
        html += renderizarQuestaoCard(visiveis[i], indexReal, 'q');
    }
    container.innerHTML = html;
}

// ================================================================
// CARD DE QUESTÃO
// ================================================================

function renderizarQuestaoCard(q, index, prefixo) {
    prefixo = prefixo || 'q';
    var cardId = prefixo + '-' + index;

    var origemBadge = q.geradaPorIa
        ? '<span class="badge badge-ia" title="Gerada pela IA interna">🤖 IA Interna</span>'
        : '<span class="badge badge-origem-manual" title="Inserida manualmente">✍️ Manual</span>';

    var errosBadge = '';
    if (q.errosRecorrentes >= 3) {
        errosBadge = '<span class="badge badge-critico">⚠️ ' + q.errosRecorrentes + ' erros</span>';
    } else if (q.errosRecorrentes > 0) {
        errosBadge = '<span class="badge badge-alerta">⚠️ ' + q.errosRecorrentes + ' erro(s)</span>';
    }

    var jaRespondida = respondidosNaRodada.has(q.id);
    var respondidaBadge = jaRespondida
        ? '<span class="badge" style="background:#dcfce7;color:#166534">✔ Respondida</span>'
        : '';

    var metaInfo = q.tentativas > 0
        ? '<span class="text-xs text-muted">' +
        q.tentativas + ' tentativa(s) · Certeza: ' + q.grauCerteza + '/5' +
        '</span>'
        : '<span class="badge" style="background:var(--bg-primary)">🆕 Nunca respondida</span>';

    var topicoBadge = q.topico
        ? '<span class="badge badge-topico" title="Tópico">📌 ' + escapeHtml(q.topico) + '</span>'
        : '';

    var refLegal = q.referenciaLegal
        ? '<div style="margin-bottom:8px">' +
        '<span class="badge" style="background:var(--bg-primary);color:var(--text-secondary)">' +
        '⚖️ ' + escapeHtml(q.referenciaLegal) +
        '</span>' +
        '</div>'
        : '';

    var palavrasAlertaHtml = '';
    if (q.palavrasAlerta && q.palavrasAlerta.length > 0) {
        var badges = '';
        for (var i = 0; i < q.palavrasAlerta.length; i++) {
            badges += '<span class="badge badge-alerta">' +
                escapeHtml(q.palavrasAlerta[i]) +
                '</span>';
        }
        palavrasAlertaHtml =
            '<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">' +
            '<span class="feedback-section-label">⚠️ Palavras-alerta:</span>' +
            badges +
            '</div>';
    }

    var detalhePegadinhaHtml = '';
    if (q.detalhePegadinha) {
        var labelPeg = q.tipoPegadinha
            ? '🪤 ' + escapeHtml(q.tipoPegadinha)
            : '🪤 Pegadinha';
        detalhePegadinhaHtml =
            '<div class="info-box info-box-alerta" style="margin-top:10px">' +
            '<div class="info-box-label">' + labelPeg + '</div>' +
            '<p class="text-sm">' + escapeHtml(q.detalhePegadinha) + '</p>' +
            '</div>';
    }

    var comentarioHtml = '';
    if (q.comentarioProfessor) {
        comentarioHtml =
            '<div class="info-box info-box-professor" style="margin-top:10px">' +
            '<div class="info-box-label">👨‍🏫 Comentário do Professor</div>' +
            '<p class="text-sm">' + escapeHtml(q.comentarioProfessor) + '</p>' +
            '</div>';
    }

    var mnemonicoHtml = '';
    if (q.mnemonicoPersonal) {
        mnemonicoHtml =
            '<div class="mnemonico-box" style="margin-top:8px">' +
            '<div class="feedback-section-label">💡 Mnemônico pessoal</div>' +
            '<div style="color:var(--accent-purple);font-weight:600">' +
            escapeHtml(q.mnemonicoPersonal) +
            '</div>' +
            '</div>';
    }

    var grauBtns = '';
    var labels = ['❓', '😰', '😟', '🤔', '😊', '🎯'];
    for (var g = 0; g <= 5; g++) {
        grauBtns +=
            '<button class="grau-btn ' + (g === 3 ? 'selected' : '') + '" ' +
            'onclick="selecionarGrau(\'' + cardId + '\', ' + g + ')">' +
            labels[g] + ' ' + g +
            '</button>';
    }

    return '<div class="questao-card ' + (jaRespondida ? 'ja-respondida' : '') + '" ' +
        'id="card-' + cardId + '">' +

        // Meta
        '<div class="questao-meta" style="margin-bottom:12px;flex-wrap:wrap;gap:6px">' +
        '<span class="badge badge-assunto">📚 ' + escapeHtml(q.assunto) + '</span>' +
        topicoBadge +
        origemBadge +
        errosBadge +
        respondidaBadge +
        metaInfo +
        '</div>' +

        // Referência legal
        refLegal +

        // Enunciado
        '<div class="questao-enunciado" id="enunciado-' + cardId + '">' +
        escapeHtml(q.enunciado) +
        '</div>' +

        // Palavras-alerta
        palavrasAlertaHtml +

        // Detalhe pegadinha + comentário professor
        '<div id="detalhes-pre-' + cardId + '">' +
        detalhePegadinhaHtml +
        comentarioHtml +
        '</div>' +

        // Mnemônico pessoal
        mnemonicoHtml +

        // Grau de certeza
        '<div style="margin:14px 0 10px">' +
        '<span class="text-xs text-muted">Grau de certeza:</span>' +
        '<div class="grau-certeza" id="grau-' + cardId + '" data-grau="3">' +
        grauBtns +
        '</div>' +
        '</div>' +

        // Botões resposta
        '<div class="resposta-btns" id="btns-' + cardId + '">' +
        '<button class="btn btn-success" ' +
        'onclick="responder(\'' + cardId + '\', ' + index + ', true)">' +
        '✅ CERTO' +
        '</button>' +
        '<button class="btn btn-danger" ' +
        'onclick="responder(\'' + cardId + '\', ' + index + ', false)">' +
        '❌ ERRADO' +
        '</button>' +
        '</div>' +

        // Feedback
        '<div class="feedback-box" id="feedback-' + cardId + '"></div>' +

        // Editor mnemônico
        '<div id="mnemonico-edit-' + cardId + '" style="display:none">' +
        '<div class="divider"></div>' +
        '<div class="mnemonico-box">' +
        '<div class="feedback-section-label">💡 Adicionar / Editar Mnemônico</div>' +
        '<textarea id="mnemonico-input-' + cardId + '" ' +
        'placeholder="Digite sua dica pessoal...">' +
        (q.mnemonicoPersonal || '') +
        '</textarea>' +
        '<button class="btn btn-outline btn-sm" style="margin-top:8px" ' +
        'onclick="salvarMnemonico(\'' + cardId + '\', \'' + q.id + '\')">' +
        '💾 Salvar Mnemônico' +
        '</button>' +
        '</div>' +
        '</div>' +

        '</div>';
}

// ================================================================
// RESPONDER
// ================================================================

function selecionarGrau(cardId, grau) {
    var container = document.getElementById('grau-' + cardId);
    if (!container) return;
    var btns = container.querySelectorAll('.grau-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('selected', i === grau);
    }
    container.dataset.grau = grau;
}

async function responder(cardId, index, resposta) {
    var questao = questoesCarregadas[index];
    if (!questao) return;

    var grauContainer = document.getElementById('grau-' + cardId);
    var grauCerteza = parseInt(grauContainer ? grauContainer.dataset.grau || '3' : '3');

    var btns = document.getElementById('btns-' + cardId);
    if (btns) {
        var bArr = btns.querySelectorAll('button');
        for (var b = 0; b < bArr.length; b++) bArr[b].disabled = true;
    }

    try {
        const res = await fetch(API + '/estudo/responder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                questaoId: questao.id,
                resposta: resposta,
                grauCerteza: grauCerteza,
                sessionId: sessionId
            })
        });
        const resultado = await res.json();

        respondidosNaRodada.add(questao.id);
        atualizarContadorRodada();
        renderizarFeedback(cardId, questao, resultado);

        // Modo card + filtro rodada: avança automaticamente
        if (modoVisualizacao === 'card' && filtroNaoRespondidosAtivo()) {
            var visiveis = questoesFiltradas();
            if (visiveis.length > 0) {
                setTimeout(function () {
                    if (indiceAtual >= questoesFiltradas().length) indiceAtual = 0;
                    renderizarQuestoes();
                }, 1800);
            }
        }

    } catch (e) {
        toast('Erro ao responder: ' + e.message, 'error');
        if (btns) {
            var bArr2 = btns.querySelectorAll('button');
            for (var b2 = 0; b2 < bArr2.length; b2++) bArr2[b2].disabled = false;
        }
    }
}

function renderizarFeedback(cardId, questao, resultado) {
    var card = document.getElementById('card-' + cardId);
    var feedback = document.getElementById('feedback-' + cardId);
    var enunciado = document.getElementById('enunciado-' + cardId);

    if (!card || !feedback) return;

    card.classList.add(resultado.correta ? 'respondida-certo' : 'respondida-errado');

    // Destaca palavras-alerta via regex ao errar
    if (!resultado.correta && resultado.palavrasAlerta && resultado.palavrasAlerta.length) {
        var texto = enunciado.textContent;
        for (var i = 0; i < resultado.palavrasAlerta.length; i++) {
            var re = new RegExp('(' + escapeRegex(resultado.palavrasAlerta[i]) + ')', 'gi');
            texto = texto.replace(re,
                '<span class="palavra-alerta" title="Palavra de alerta!">$1</span>');
        }
        enunciado.innerHTML = texto;
    }

    var proxRevisao = resultado.proximaRevisao
        ? new Date(resultado.proximaRevisao).toLocaleString('pt-BR') : '—';

    var extras = '';

    if (!resultado.correta) {
        if (resultado.explicacaoPegadinha) {
            extras +=
                '<div class="feedback-section">' +
                '<div class="feedback-section-label">🪤 Pegadinha</div>' +
                '<p class="text-sm">' + escapeHtml(resultado.explicacaoPegadinha) + '</p>' +
                '</div>';
        }
        if (resultado.detalhePegadinha) {
            extras +=
                '<div class="feedback-section">' +
                '<div class="feedback-section-label">📖 Detalhe</div>' +
                '<p class="text-sm">' + escapeHtml(resultado.detalhePegadinha) + '</p>' +
                '</div>';
        }
        if (resultado.referenciaLegal) {
            extras +=
                '<div class="feedback-section">' +
                '<div class="feedback-section-label">⚖️ Referência Legal</div>' +
                '<p class="text-sm text-bold">' + escapeHtml(resultado.referenciaLegal) + '</p>' +
                '</div>';
        }

        var editMnemonico = document.getElementById('mnemonico-edit-' + cardId);
        if (editMnemonico) editMnemonico.style.display = 'block';
    }

    if (resultado.mnemonicoPersonal) {
        extras +=
            '<div class="feedback-section">' +
            '<div class="feedback-section-label">💡 Seu mnemônico</div>' +
            '<p class="text-sm" style="color:var(--accent-purple);font-weight:600">' +
            escapeHtml(resultado.mnemonicoPersonal) +
            '</p>' +
            '</div>';
    }

    feedback.className = 'feedback-box visible ' + (resultado.correta ? 'certo' : 'errado');
    feedback.innerHTML =
        '<div class="feedback-title">' +
        (resultado.correta ? '✅ CORRETO!' : '❌ INCORRETO!') +
        ' — Gabarito: ' + (resultado.gabaritoOficial ? 'CERTO' : 'ERRADO') +
        '</div>' +
        '<p class="text-sm">' + escapeHtml(resultado.mensagemEstudo) + '</p>' +
        extras +
        '<div class="feedback-section">' +
        '<div class="feedback-section-label">📅 Próxima revisão</div>' +
        '<p class="text-sm">' + proxRevisao + '</p>' +
        '</div>';
}

async function salvarMnemonico(cardId, questaoId) {
    var input = document.getElementById('mnemonico-input-' + cardId);
    var mnemonico = input ? input.value.trim() : '';
    if (!mnemonico) return;

    try {
        await fetch(API + '/estudo/mnemonico/' + questaoId + '?sessionId=' + sessionId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mnemonico: mnemonico })
        });
        toast('Mnemônico salvo!', 'success');
    } catch (e) {
        toast('Erro ao salvar mnemônico', 'error');
    }
}

// ================================================================
// IA — GERAR QUESTÕES
// ================================================================

var questoesIaGeradas = [];

async function gerarQuestoesIa() {
    var assunto = document.getElementById('iaAssunto')?.value || 'Direito Administrativo';
    var quantidade = parseInt(document.getElementById('iaQtd')?.value || '3');
    var btn = document.getElementById('btnGerarIa');
    var container = document.getElementById('iaResultadoContainer');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Gerando...'; }
    if (container) container.style.display = 'none';
    questoesIaGeradas = [];

    try {
        const res = await fetch(API + '/ia/gerar-questoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assunto: assunto, quantidade: quantidade })
        });
        const data = await res.json();
        const payload = data.payload;
        questoesIaGeradas = payload.questoes || [];
        renderizarQuestoesIaParaEdicao(payload);
        if (container) container.style.display = 'block';
    } catch (e) {
        toast('Erro ao gerar questões: ' + e.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🤖 Gerar com IA'; }
    }
}

function renderizarQuestoesIaParaEdicao(payload) {
    var container = document.getElementById('iaResultadoContainer');
    if (!container) return;

    var config = payload.simulado_config || {};
    var html =
        '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'margin-bottom:20px;flex-wrap:wrap;gap:12px">' +
        '<div>' +
        '<div class="card-title">🤖 ' +
        escapeHtml(config.titulo || 'Questões Geradas por IA') +
        '</div>' +
        '<p class="text-xs text-muted" style="margin-top:4px">' +
        escapeHtml(config.objetivo || '') +
        '</p>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<span class="badge badge-ia">🤖 IA Interna</span>' +
        '<span class="badge" style="background:var(--bg-primary)">' +
        'v' + escapeHtml(config.versao_payload || '4.0') +
        '</span>' +
        '</div>' +
        '</div>';

    for (var i = 0; i < payload.questoes.length; i++) {
        html += renderizarCardIaEditavel(payload.questoes[i], i);
    }

    html +=
        '<div style="display:flex;gap:12px;margin-top:20px;flex-wrap:wrap">' +
        '<button class="btn btn-primary btn-lg" onclick="salvarTodasQuestoesIa()">' +
        '💾 Salvar Todas no Banco' +
        '</button>' +
        '<button class="btn btn-outline" onclick="salvarQuestoesIaSelecionadas()">' +
        '✅ Salvar Selecionadas' +
        '</button>' +
        '<button class="btn btn-ghost" ' +
        'onclick="document.getElementById(\'iaResultadoContainer\').style.display=\'none\'">' +
        '✖ Descartar' +
        '</button>' +
        '</div>';

    container.innerHTML = html;
}

function normalizarGabaritoTexto(valor) {
    if (typeof valor === 'boolean') return valor ? 'C' : 'E';
    var s = String(valor || '').trim().toUpperCase();
    return (s === 'C' || s === 'CERTO' || s === 'TRUE') ? 'C' : 'E';
}

function renderizarCardIaEditavel(q, i) {
    var gab = normalizarGabaritoTexto(q.gabarito);
    var ae = q.analise_estudo || {};

    return '<div class="questao-card" id="ia-card-' + i + '" ' +
        'style="margin-bottom:20px;border-left:4px solid var(--accent-purple)">' +

        '<div style="display:flex;align-items:center;justify-content:space-between;' +
        'margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
        '<div class="questao-meta">' +
        '<span class="badge badge-ia">🤖 IA Interna</span>' +
        '<span class="badge badge-assunto">📚 ' +
        escapeHtml(q.disciplina || q.assunto || '') +
        '</span>' +
        '<span class="badge ' + (gab === 'C' ? 'badge-assunto' : 'badge-critico') + '">' +
        (gab === 'C' ? '✅ CERTO' : '❌ ERRADO') +
        '</span>' +
        (q.tipo_pegadinha
            ? '<span class="badge badge-alerta">🪤 ' +
            escapeHtml(q.tipo_pegadinha) + '</span>'
            : '') +
        '</div>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;' +
        'font-size:.8rem;font-weight:600">' +
        '<input type="checkbox" id="ia-sel-' + i + '" checked ' +
        'style="width:16px;height:16px;cursor:pointer" />' +
        'Incluir' +
        '</label>' +
        '</div>' +

        (q.topico
            ? '<p class="text-xs text-muted" style="margin-bottom:8px">📌 ' +
            escapeHtml(q.topico) + '</p>'
            : '') +

        '<div style="margin-bottom:10px">' +
        '<label class="feedback-section-label">📝 Enunciado</label>' +
        '<textarea id="ia-enunciado-' + i + '" class="input-field" ' +
        'style="width:100%;min-height:80px;margin-top:4px;' +
        'resize:vertical;font-size:.875rem;line-height:1.6">' +
        escapeHtml(q.enunciado) +
        '</textarea>' +
        '</div>' +

        '<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">' +
        '<label class="feedback-section-label">Gabarito:</label>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">' +
        '<input type="radio" name="ia-gab-' + i + '" value="C" ' +
        (gab === 'C' ? 'checked' : '') + ' />' +
        '<span class="badge badge-assunto">✅ CERTO</span>' +
        '</label>' +
        '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">' +
        '<input type="radio" name="ia-gab-' + i + '" value="E" ' +
        (gab === 'E' ? 'checked' : '') + ' />' +
        '<span class="badge badge-critico">❌ ERRADO</span>' +
        '</label>' +
        '</div>' +

        '<div style="margin-bottom:10px">' +
        '<label class="feedback-section-label">⚖️ Referência Legal</label>' +
        '<input type="text" id="ia-reflegal-' + i + '" class="input-field" ' +
        'style="width:100%;margin-top:4px" ' +
        'value="' + escapeHtml(q.referencia_legal || '') + '" ' +
        'placeholder="Ex: Lei 14.133/2021, Art. 74" />' +
        '</div>' +

        '<div style="margin-bottom:10px">' +
        '<label class="feedback-section-label">🪤 Detalhe da Pegadinha</label>' +
        '<textarea id="ia-pegadinha-' + i + '" class="input-field" ' +
        'style="width:100%;min-height:60px;margin-top:4px;resize:vertical" ' +
        'placeholder="Descreva a pegadinha (opcional)">' +
        escapeHtml(q.detalhe_pegadinha || '') +
        '</textarea>' +
        '</div>' +

        '<div class="mnemonico-box" style="margin-top:4px">' +
        '<div class="feedback-section-label">💡 Mnemônico</div>' +
        '<textarea id="ia-mnemonico-' + i + '" ' +
        'style="width:100%;min-height:40px;background:transparent;border:none;' +
        'resize:vertical;font-family:var(--font);font-size:.875rem;' +
        'color:var(--accent-purple);font-weight:600" ' +
        'placeholder="Dica mnemônica...">' +
        escapeHtml(ae.meu_mnemonico_pessoal || '') +
        '</textarea>' +
        '</div>' +

        (q.palavras_alerta && q.palavras_alerta.length
            ? '<div style="margin-top:10px">' +
            '<span class="feedback-section-label">⚠️ Palavras-alerta: </span>' +
            q.palavras_alerta.map(function (p) {
                return '<span class="badge badge-alerta">' + escapeHtml(p) + '</span>';
            }).join('') +
            '</div>'
            : '') +

        '<div style="margin-top:14px;display:flex;justify-content:flex-end">' +
        '<button class="btn btn-outline btn-sm" ' +
        'onclick="salvarQuestaoIaIndividual(' + i + ')">' +
        '💾 Salvar esta questão' +
        '</button>' +
        '</div>' +

        '</div>';
}

function coletarQuestaoEditada(i) {
    var enunciado = document.getElementById('ia-enunciado-' + i);
    var refLegal = document.getElementById('ia-reflegal-' + i);
    var pegadinha = document.getElementById('ia-pegadinha-' + i);
    var mnemonico = document.getElementById('ia-mnemonico-' + i);
    var gabRadio = document.querySelector('input[name="ia-gab-' + i + '"]:checked');
    var original = questoesIaGeradas[i] || {};

    return Object.assign({}, original, {
        enunciado: enunciado ? enunciado.value.trim() : '',
        gabarito: gabRadio ? gabRadio.value : 'C',
        referencia_legal: refLegal ? refLegal.value.trim() : null,
        detalhe_pegadinha: pegadinha ? pegadinha.value.trim() : null,
        analise_estudo: Object.assign({}, original.analise_estudo || {}, {
            meu_mnemonico_pessoal: mnemonico ? mnemonico.value.trim() : null
        })
    });
}

async function salvarQuestaoIaIndividual(i) {
    await enviarQuestoesParaBanco([coletarQuestaoEditada(i)]);
}

async function salvarTodasQuestoesIa() {
    var todas = [];
    for (var i = 0; i < questoesIaGeradas.length; i++) {
        todas.push(coletarQuestaoEditada(i));
    }
    await enviarQuestoesParaBanco(todas);
}

async function salvarQuestoesIaSelecionadas() {
    var selecionadas = [];
    for (var i = 0; i < questoesIaGeradas.length; i++) {
        var cb = document.getElementById('ia-sel-' + i);
        if (cb && cb.checked) selecionadas.push(coletarQuestaoEditada(i));
    }
    if (!selecionadas.length) { toast('Nenhuma questão selecionada!', 'error'); return; }
    await enviarQuestoesParaBanco(selecionadas);
}

async function enviarQuestoesParaBanco(questoes) {
    if (!questoes.length) return;

    var payload = {
        simuladoConfig: { geradaPorIa: true, origem: 'ia_interna' },
        questoes: questoes.map(function (q) {
            var ae = q.analise_estudo || {};
            return {
                idOrigem: q.id || null,
                disciplina: q.disciplina || null,
                topico: q.topico || null,
                enunciado: q.enunciado,
                gabarito: normalizarGabaritoTexto(q.gabarito) === 'C',
                assunto: q.assunto || q.disciplina || 'Geral',
                banca: q.banca || 'CEBRASPE',
                pegadinha: q.detalhe_pegadinha || null,
                tipoPegadinha: q.tipo_pegadinha || null,
                palavrasAlerta: q.palavras_alerta || [],
                detalhePegadinha: q.detalhe_pegadinha || null,
                referenciaLegal: q.referencia_legal || null,
                comentarioProfessor: q.comentario_professor || null,
                analiseEstudo: {
                    meuGrauCerteza: ae.meu_grau_certeza || 0,
                    tentativasAnteriores: ae.tentativas_anteriores || 0,
                    errosRecorrentes: ae.erros_recorrentes || 0,
                    proximaRevisaoSugerida: ae.proxima_revisao_sugerida || null,
                    meuMnemonicoPersonal: ae.meu_mnemonico_pessoal || null
                }
            };
        }),
        metadadosEvolucao: { iaInterna: true }
    };

    try {
        const res = await fetch(API + '/questoes/ingerir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        toast('✅ ' + data.inseridas + ' questão(ões) salva(s)!', 'success');
        carregarEstatisticas();
        carregarAssuntos();
    } catch (e) {
        toast('Erro ao salvar: ' + e.message, 'error');
    }
}

// ================================================================
// IA — ANÁLISE DE DESEMPENHO
// ================================================================

async function analisarDesempenho() {
    var assuntoFraco = document.getElementById('assuntoFraco')?.value || '';
    var resultado = document.getElementById('analiseResultado');
    var texto = document.getElementById('analiseTexto');

    if (resultado) resultado.style.display = 'block';
    if (texto) texto.textContent = '⏳ Analisando...';

    try {
        var params = new URLSearchParams({ sessionId: sessionId });
        if (assuntoFraco) params.set('assuntoFraco', assuntoFraco);

        const res = await fetch(API + '/ia/analisar-desempenho?' + params.toString());
        const data = await res.json();
        if (texto) texto.textContent = data.analise;
    } catch (e) {
        if (texto) texto.textContent = 'Erro: ' + e.message;
        toast('Erro na análise IA', 'error');
    }
}

// ================================================================
// UTILITÁRIOS
// ================================================================

function toast(msg, tipo) {
    tipo = tipo || 'info';
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    var el = document.createElement('div');
    el.className = 'toast ' + tipo;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, 300);
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

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}