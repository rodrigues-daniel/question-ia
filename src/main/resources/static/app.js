// ================================================================
// app.js — Área de Estudo
// ================================================================

const API = 'http://localhost:8080/api';
let sessionId = localStorage.getItem('sessionId') || 'default';
let grauCertezaSelecionado = 3;
let questoesCarregadas = [];
let questaoAtual = null;

// ---- Inicialização ----

document.addEventListener('DOMContentLoaded', () => {
    aplicarTema();
    carregarAssuntos();
    carregarEstatisticas();
    carregarQuestoes();

    document.getElementById('themeToggle').addEventListener('click', alternarTema);
});

// ---- Tema ----

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

// ---- Navegação ----

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`sec-${id}`).classList.add('active');
    document.querySelectorAll(`[data-section="${id}"]`)
        .forEach(n => n.classList.add('active'));

    if (id === 'questoes') carregarQuestoes();
    if (id === 'criticas') carregarCriticas();
    if (id === 'painel') carregarEstatisticas();
}

// ---- Estatísticas ----

async function carregarEstatisticas() {
    try {
        const res = await fetch(`${API}/estudo/estatisticas?sessionId=${sessionId}`);
        const stats = await res.json();
        renderizarStats(stats);
    } catch (e) {
        console.error('Erro ao carregar estatísticas:', e);
    }
}

function renderizarStats(s) {
    const grid = document.getElementById('statsGrid');
    const taxa = s.totalTentativas > 0
        ? Math.round((s.totalAcertos / s.totalTentativas) * 100)
        : 0;

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
    </div>
  `;

    // Atualiza badge sidebar
    const badge = document.getElementById('badge-criticas');
    if (badge) {
        if (s.questoesCriticas > 0) {
            badge.textContent = s.questoesCriticas;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ---- Assuntos ----

async function carregarAssuntos() {
    try {
        const res = await fetch(`${API}/estudo/assuntos`);
        const assuntos = await res.json();
        const sel = document.getElementById('filtroAssunto');
        const iaAssunto = document.getElementById('iaAssunto');

        assuntos.forEach(a => {
            const opt = `<option value="${a}">${a}</option>`;
            if (sel) sel.insertAdjacentHTML('beforeend', opt);
            if (iaAssunto && !iaAssunto.querySelector(`[value="${a}"]`)) {
                iaAssunto.insertAdjacentHTML('beforeend', opt);
            }
        });
    } catch (e) {
        console.error('Erro ao carregar assuntos:', e);
    }
}

// ---- Questões ----

async function carregarQuestoes() {
    const assunto = document.getElementById('filtroAssunto')?.value || '';
    const limite = document.getElementById('filtroLimite')?.value || 10;
    const vencidas = document.getElementById('filtroVencidas')?.checked || false;

    const container = document.getElementById('questoesContainer');
    container.innerHTML = '<p class="text-muted loading" style="text-align:center;padding:40px">Carregando questões...</p>';

    try {
        const params = new URLSearchParams({
            sessionId,
            limite,
            apenasVencidas: vencidas
        });
        if (assunto) params.set('assunto', assunto);

        const res = await fetch(`${API}/estudo/questoes?${params}`);
        questoesCarregadas = await res.json();

        if (questoesCarregadas.length === 0) {
            container.innerHTML = `
        <div style="text-align:center;padding:60px">
          <div style="font-size:3rem">🎉</div>
          <h3 style="margin-top:12px;color:var(--accent-green)">
            Nenhuma revisão pendente!
          </h3>
          <p class="text-muted" style="margin-top:8px">
            Você está em dia com todas as revisões.
          </p>
        </div>`;
            return;
        }

        container.innerHTML = questoesCarregadas.map((q, i) =>
            renderizarQuestaoCard(q, i)
        ).join('');

    } catch (e) {
        container.innerHTML = `<p class="text-danger" style="padding:20px">
      Erro ao carregar questões: ${e.message}
    </p>`;
    }
}

async function carregarCriticas() {
    const container = document.getElementById('criticasContainer');
    container.innerHTML = '<p class="text-muted loading" style="text-align:center;padding:40px">Carregando...</p>';

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

        container.innerHTML = criticas.map((q, i) =>
            renderizarQuestaoCard(q, i, 'critica')
        ).join('');
    } catch (e) {
        container.innerHTML = `<p class="text-danger">Erro: ${e.message}</p>`;
    }
}

// ---- Renderizar Questão ----

function renderizarQuestaoCard(q, index, prefixo = 'q') {
    const cardId = `${prefixo}-${index}`;
    const errosBadge = q.errosRecorrentes >= 3
        ? `<span class="badge badge-critico">⚠️ ${q.errosRecorrentes} erros recorrentes</span>`
        : (q.errosRecorrentes > 0
            ? `<span class="badge badge-alerta">⚠️ ${q.errosRecorrentes} erro(s)</span>`
            : '');

    const mnemonico = q.mnemonicoPersonal
        ? `<div class="mnemonico-box" style="margin-top:8px">
        <div class="feedback-section-label">💡 Mnemônico pessoal</div>
        <div style="color:var(--accent-purple);font-weight:600">${escapeHtml(q.mnemonicoPersonal)}</div>
       </div>`
        : '';

    const metaInfo = q.tentativas > 0
        ? `<span class="text-xs text-muted">${q.tentativas} tentativa(s) · Certeza: ${q.grauCerteza}/5</span>`
        : `<span class="text-xs text-muted badge" style="background:var(--bg-primary)">🆕 Nunca respondida</span>`;

    return `
    <div class="questao-card" id="card-${cardId}">
      <div class="questao-header">
        <div class="questao-meta">
          <span class="badge badge-assunto">📚 ${escapeHtml(q.assunto)}</span>
          ${errosBadge}
          ${metaInfo}
        </div>
      </div>

      <div class="questao-enunciado" id="enunciado-${cardId}">
        ${escapeHtml(q.enunciado)}
      </div>

      ${mnemonico}

      <!-- Grau de Certeza -->
      <div style="margin-bottom:12px">
        <span class="text-xs text-muted">Grau de certeza:</span>
        <div class="grau-certeza" id="grau-${cardId}">
          ${[0, 1, 2, 3, 4, 5].map(g => `
            <button class="grau-btn ${g === 3 ? 'selected' : ''}"
                    onclick="selecionarGrau('${cardId}', ${g})">
              ${['❓', '😰', '😟', '🤔', '😊', '🎯'][g]} ${g}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Botões Resposta -->
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

      <!-- Feedback (oculto) -->
      <div class="feedback-box" id="feedback-${cardId}">
        <!-- preenchido após resposta -->
      </div>

      <!-- Campo mnemônico (aparece ao errar) -->
      <div id="mnemonico-edit-${cardId}" style="display:none">
        <div class="divider"></div>
        <div class="mnemonico-box">
          <div class="feedback-section-label">💡 Adicionar / Editar Mnemônico</div>
          <textarea
            id="mnemonico-input-${cardId}"
            placeholder="Digite sua dica pessoal para memorizar..."
          >${q.mnemonicoPersonal || ''}</textarea>
          <button class="btn btn-outline btn-sm" style="margin-top:8px"
                  onclick="salvarMnemonico('${cardId}', '${q.id}')">
            💾 Salvar Mnemônico
          </button>
        </div>
      </div>
    </div>
  `;
}

// ---- Responder ----

function selecionarGrau(cardId, grau) {
    const container = document.getElementById(`grau-${cardId}`);
    container.querySelectorAll('.grau-btn').forEach((b, i) => {
        b.classList.toggle('selected', i === grau);
    });
    container.dataset.grau = grau;
}

async function responder(cardId, index, resposta) {
    const questao = questoesCarregadas[index];
    if (!questao) return;

    const grauContainer = document.getElementById(`grau-${cardId}`);
    const grauCerteza = parseInt(grauContainer.dataset.grau || '3');

    const btns = document.getElementById(`btns-${cardId}`);
    btns.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
        const res = await fetch(`${API}/estudo/responder`, {
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
        renderizarFeedback(cardId, questao, resultado, resposta);

    } catch (e) {
        toast('Erro ao responder: ' + e.message, 'error');
        btns.querySelectorAll('button').forEach(b => b.disabled = false);
    }
}

function renderizarFeedback(cardId, questao, resultado, respostaDada) {
    const card = document.getElementById(`card-${cardId}`);
    const feedback = document.getElementById(`feedback-${cardId}`);
    const enunciado = document.getElementById(`enunciado-${cardId}`);

    card.classList.add(resultado.correta ? 'respondida-certo' : 'respondida-errado');

    // Destaca palavras-alerta via regex quando erra
    if (!resultado.correta && resultado.palavrasAlerta?.length) {
        let texto = enunciado.textContent;
        resultado.palavrasAlerta.forEach(palavra => {
            const regex = new RegExp(`(${escapeRegex(palavra)})`, 'gi');
            texto = texto.replace(regex,
                '<span class="palavra-alerta" title="Palavra de alerta!">$1</span>'
            );
        });
        enunciado.innerHTML = texto;
    }

    const proxRevisao = resultado.proximaRevisao
        ? new Date(resultado.proximaRevisao).toLocaleString('pt-BR')
        : '—';

    let conteudoExtra = '';

    if (!resultado.correta) {
        if (resultado.explicacaoPegadinha) {
            conteudoExtra += `
        <div class="feedback-section">
          <div class="feedback-section-label">🪤 Pegadinha</div>
          <p class="text-sm">${escapeHtml(resultado.explicacaoPegadinha)}</p>
        </div>`;
        }
        if (resultado.detalhePegadinha) {
            conteudoExtra += `
        <div class="feedback-section">
          <div class="feedback-section-label">📖 Detalhe</div>
          <p class="text-sm">${escapeHtml(resultado.detalhePegadinha)}</p>
        </div>`;
        }
        if (resultado.referenciaLegal) {
            conteudoExtra += `
        <div class="feedback-section">
          <div class="feedback-section-label">⚖️ Referência Legal</div>
          <p class="text-sm text-bold">${escapeHtml(resultado.referenciaLegal)}</p>
        </div>`;
        }
        // Mostra editor de mnemônico ao errar
        const mnemonicoEdit = document.getElementById(`mnemonico-edit-${cardId}`);
        if (mnemonicoEdit) mnemonicoEdit.style.display = 'block';
    }

    if (resultado.mnemonicoPersonal) {
        conteudoExtra += `
      <div class="feedback-section">
        <div class="feedback-section-label">💡 Seu mnemônico</div>
        <p class="text-sm" style="color:var(--accent-purple);font-weight:600">
          ${escapeHtml(resultado.mnemonicoPersonal)}
        </p>
      </div>`;
    }

    feedback.className = `feedback-box visible ${resultado.correta ? 'certo' : 'errado'}`;
    feedback.innerHTML = `
    <div class="feedback-title">
      ${resultado.correta ? '✅ CORRETO!' : '❌ INCORRETO!'}
      — Gabarito: ${resultado.gabaritoOficial ? 'CERTO' : 'ERRADO'}
    </div>
    <p class="text-sm">${escapeHtml(resultado.mensagemEstudo)}</p>
    ${conteudoExtra}
    <div class="feedback-section">
      <div class="feedback-section-label">📅 Próxima revisão</div>
      <p class="text-sm">${proxRevisao}</p>
    </div>
  `;
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
    } catch (e) {
        toast('Erro ao salvar mnemônico', 'error');
    }
}

// ---- IA ----

async function gerarQuestoesIa() {
    const assunto = document.getElementById('iaAssunto')?.value;
    const quantidade = parseInt(document.getElementById('iaQtd')?.value || '3');
    const btn = document.getElementById('btnGerarIa');
    const resultado = document.getElementById('iaResultado');
    const texto = document.getElementById('iaTextoResultado');

    btn.disabled = true;
    btn.textContent = '⏳ Gerando...';
    resultado.style.display = 'none';

    try {
        const res = await fetch(`${API}/ia/gerar-questoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assunto, quantidade })
        });
        const data = await res.json();
        texto.textContent = data.resultado;
        resultado.style.display = 'block';
    } catch (e) {
        toast('Erro ao gerar questões: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '🤖 Gerar com IA';
    }
}

async function analisarDesempenho() {
    const assuntoFraco = document.getElementById('assuntoFraco')?.value;
    const resultado = document.getElementById('analiseResultado');
    const texto = document.getElementById('analiseTexto');

    resultado.style.display = 'none';
    texto.textContent = '⏳ Analisando...';
    resultado.style.display = 'block';

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

// ---- Utilitários ----

function toast(msg, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}