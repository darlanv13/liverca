// === Estado da Aplicação Atualizado (5W2H e Config) ===
let estado = {
    config: { empresa: 'Vale S/A', logoBase64: '' },
    dadosIniciais: { titulo: '', area: '', data: '', probabilidade: '', severidade: '', risco: 'Não Avaliado', sistema: '', downtime: '', impacto: '', ttd: '', ttr: '', classificacao: '', violacaoSla: false, resumo: '' },
    arvore: [], cincoPorques: [], ishikawa: { metodo: [], maquina: [], material: [], mao: [], medida: [], meio: [] }, barreiras: [], timeline: [],
    acoes: [], participantes: [], fotos: [], postmortem: { funcionou: '', falhou: '' }
};

// Inicialização com IndexedDB (Assíncrona para evitar travamentos)
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const rascunho = await localforage.getItem('rca_estado');
        if (rascunho) {
            estado = rascunho;
            // Fallback para versões anteriores do rascunho
            if (!estado.config) estado.config = { empresa: 'Vale S/A', logoBase64: '' };
            if (!estado.cincoPorques) estado.cincoPorques = [];
            if (!estado.ishikawa) estado.ishikawa = { metodo: [], maquina: [], material: [], mao: [], medida: [], meio: [] };
            if (!estado.barreiras) estado.barreiras = [];
            if (!estado.timeline) estado.timeline = [];
            if (!estado.postmortem) estado.postmortem = { funcionou: '', falhou: '' };
            if (estado.dadosIniciais.sistema === undefined) {
                estado.dadosIniciais.sistema = '';
                estado.dadosIniciais.downtime = '';
                estado.dadosIniciais.impacto = '';
                estado.dadosIniciais.ttd = '';
                estado.dadosIniciais.ttr = '';
                estado.dadosIniciais.classificacao = '';
                estado.dadosIniciais.violacaoSla = false;
                estado.dadosIniciais.resumo = '';
            }

            document.getElementById('status-save').textContent = 'Rascunho recuperado do Banco Offline.';
            restaurarInterface();
        }
    } catch (err) {
        console.error("Erro ao ler IndexedDB", err);
    }
    validarEstado();
    atualizarCabecalho();
});

// Salvamento Seguro (IndexedDB)
async function salvarEstado() {
    estado.config.empresa = document.getElementById('nome-empresa').value;
    estado.dadosIniciais.titulo = document.getElementById('titulo').value;
    estado.dadosIniciais.area = document.getElementById('area').value;
    estado.dadosIniciais.data = document.getElementById('data').value;
    estado.dadosIniciais.probabilidade = document.getElementById('probabilidade').value;
    estado.dadosIniciais.severidade = document.getElementById('severidade').value;
    estado.dadosIniciais.risco = document.getElementById('risco-resultado').textContent;
    estado.dadosIniciais.sistema = document.getElementById('sistema').value;
    estado.dadosIniciais.downtime = document.getElementById('downtime').value;
    estado.dadosIniciais.impacto = document.getElementById('impacto').value;
    estado.dadosIniciais.ttd = document.getElementById('ttd').value;
    estado.dadosIniciais.ttr = document.getElementById('ttr').value;
    estado.dadosIniciais.classificacao = document.getElementById('classificacao').value;
    estado.dadosIniciais.violacaoSla = document.getElementById('violacao-sla').checked;
    estado.dadosIniciais.resumo = document.getElementById('resumo-executivo').value;
    estado.postmortem.funcionou = document.getElementById('pm-funcionou').value;
    estado.postmortem.falhou = document.getElementById('pm-falhou').value;

    document.getElementById('fishbone-efeito').textContent = estado.dadosIniciais.titulo || 'Nenhum evento preenchido';

    try {
        await localforage.setItem('rca_estado', estado);
        document.getElementById('status-save').textContent = 'Salvo em: ' + new Date().toLocaleTimeString();
    } catch (err) {
        console.error("Erro ao salvar IndexedDB", err);
    }
    validarEstado();
}

async function limparRascunho() {
    if (confirm("Apagar todo o banco de dados deste estudo?")) {
        await localforage.removeItem('rca_estado');
        location.reload();
    }
}

// === Cabeçalho e Logotipo Corporativo ===
function atualizarCabecalho() {
    const nome = document.getElementById('nome-empresa').value || 'Vale S/A';
    document.getElementById('nome-empresa-display').textContent = nome;

    const imgLogo = document.getElementById('logo-empresa-img');
    if (estado.config.logoBase64) {
        imgLogo.src = estado.config.logoBase64;
        imgLogo.style.display = 'block';
    } else {
        imgLogo.style.display = 'none';
    }
}

function processarLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        estado.config.logoBase64 = e.target.result;
        atualizarCabecalho();
        salvarEstado();
    };
}

// === Matriz de Risco ===
function calcularRisco() {
    const prob = parseInt(document.getElementById('probabilidade').value) || 0;
    const sev = parseInt(document.getElementById('severidade').value) || 0;
    const badge = document.getElementById('risco-resultado');

    if (prob === 0 || sev === 0) {
        badge.textContent = 'Não Avaliado'; badge.className = 'risk-badge'; return;
    }

    const pontuacao = prob * sev;
    let nivel = '', classe = '';

    if (pontuacao <= 4) { nivel = 'Baixo'; classe = 'risk-baixo'; }
    else if (pontuacao <= 10) { nivel = 'Médio'; classe = 'risk-medio'; }
    else if (pontuacao <= 16) { nivel = 'Alto'; classe = 'risk-alto'; }
    else { nivel = 'Crítico'; classe = 'risk-critico'; }

    badge.textContent = `Risco ${nivel} (Score: ${pontuacao})`;
    badge.className = `risk-badge ${classe}`;
}

// === Templates (Quick-Start) ===
const templates = {
    lte: {
        titulo: 'Falha de conectividade LTE e Sincronismo GPS',
        arvore: [{ id: gerarId(), texto: 'Perda de link LTE no equipamento de despacho', tipo: 'evento', filhos: [{ id: gerarId(), texto: 'Ausência de cobertura de RF no setor', tipo: 'validada', filhos: [{ id: gerarId(), texto: 'Antena direcional danificada ou desalinhada', tipo: 'raiz', filhos: [] }] }] }]
    },
    spda: {
        titulo: 'Anomalia em Malha de Aterramento (SPDA)',
        arvore: [{ id: gerarId(), texto: 'Desarme de proteção elétrica no painel', tipo: 'evento', filhos: [{ id: gerarId(), texto: 'Diferença de potencial (DDP) detectada', tipo: 'validada', filhos: [{ id: gerarId(), texto: 'Rompimento da malha de terra inferior', tipo: 'validada', filhos: [{ id: gerarId(), texto: 'Oxidação severa no conector de cobre', tipo: 'raiz', filhos: [] }] }] }] }]
    },
    rede: {
        titulo: 'Isolamento de Ativo de Rede (SD-WAN / Firewall)',
        arvore: [{ id: gerarId(), texto: 'Perda de gerência no Switch/Firewall', tipo: 'evento', filhos: [{ id: gerarId(), texto: 'Queda do túnel IPSec primário e secundário', tipo: 'validada', filhos: [{ id: gerarId(), texto: 'Falha na negociação de protocolo de roteamento', tipo: 'raiz', filhos: [] }] }] }]
    }
};

function aplicarTemplate() {
    const val = document.getElementById('template-selector').value;
    if (!val || !confirm("Isso substituirá a árvore de causas atual. Continuar?")) return;
    estado.dadosIniciais.titulo = templates[val].titulo;
    estado.arvore = JSON.parse(JSON.stringify(templates[val].arvore));
    document.getElementById('titulo').value = estado.dadosIniciais.titulo;
    document.getElementById('template-selector').value = '';
    renderizarArvore();
    salvarEstado();
}

// === Exportar e Importar (.JSON) ===
function exportarJSON() {
    salvarEstado();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(estado));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `RCA_${estado.dadosIniciais.titulo || 'Export'}.json`);
    document.body.appendChild(a); a.click(); a.remove();
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            estado = JSON.parse(e.target.result);
            await localforage.setItem('rca_estado', estado);
            restaurarInterface();
            alert("Estudo importado com sucesso!");
        } catch (err) { alert("Arquivo JSON inválido."); }
    };
    reader.readAsText(file);
}

// === Controle de Abas ===
function abrirAba(evt, idAba) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idAba).style.display = 'block';
    if (evt) evt.currentTarget.classList.add('active');
}

// === Árvore de Causas, 5PQs e Ishikawa ===
function gerarId() { return '_' + Math.random().toString(36).substr(2, 9); }

function adicionarCausaTopo() {
    const input = document.getElementById('nova-causa-topo');
    if (!input.value.trim()) return;
    estado.arvore.push({ id: gerarId(), texto: input.value, tipo: 'evento', filhos: [] });
    input.value = ''; renderizarArvore(); salvarEstado();
}

function iterarArvore(nos, idBusca, callback) {
    for (let i = 0; i < nos.length; i++) {
        if (nos[i].id === idBusca) { callback(nos, i); return true; }
        if (nos[i].filhos.length > 0 && iterarArvore(nos[i].filhos, idBusca, callback)) return true;
    }
    return false;
}

function adicionarSubcausa(idPai, tipoPredefinido) {
    const texto = prompt(`Adicionando [${tipoPredefinido.toUpperCase()}]. Descreva o item:`);
    if (!texto) return;
    iterarArvore(estado.arvore, idPai, (nos, index) => {
        nos[index].filhos.push({ id: gerarId(), texto: texto, tipo: tipoPredefinido, filhos: [] });
    });
    renderizarArvore(); salvarEstado();
}

function editarNo(id) {
    iterarArvore(estado.arvore, id, (nos, index) => {
        const novoTexto = prompt("Editar Causa:", nos[index].texto);
        if (novoTexto && novoTexto.trim() !== "") nos[index].texto = novoTexto;
    });
    renderizarArvore(); salvarEstado();
}

function renderizarArvore() {
    const container = document.getElementById('arvore-container'); container.innerHTML = '';
    function criarHTML(nos) {
        if (nos.length === 0) return '';
        let html = '<ul>';
        for (let no of nos) {
            const tipoClasse = no.tipo ? `tipo-${no.tipo}` : 'tipo-evento';

            // Text logic tag based on node type
            let tagTexto = 'EVENTO';
            let botoesAcao = '';

            if (no.tipo === 'evento') {
                tagTexto = 'EVENTO TOPO';
                botoesAcao = `<button class="btn-small no-print" style="color:#333;" onclick="adicionarSubcausa('${no.id}', 'hipotese')">+ Hipótese</button>`;
            }
            else if (no.tipo === 'hipotese') {
                tagTexto = 'HIPÓTESE';
                botoesAcao = `
                    <button class="btn-small no-print" style="color:#166534; background:#bbf7d0;" onclick="adicionarSubcausa('${no.id}', 'validada')">+ Validada</button>
                    <button class="btn-small no-print" style="color:#334155; background:#cbd5e1;" onclick="adicionarSubcausa('${no.id}', 'nao-validada')">+ Não Validada</button>
                `;
            }
            else if (no.tipo === 'validada') {
                tagTexto = 'HIP. VALIDADA';
                botoesAcao = `
                    <button class="btn-small no-print" style="color:#fff; background:#f87171;" onclick="adicionarSubcausa('${no.id}', 'raiz')">+ C. Raiz</button>
                    <button class="btn-small no-print" style="color:#fff; background:#fb923c;" onclick="adicionarSubcausa('${no.id}', 'raiz-secundaria')">+ C. Secundária</button>
                `;
            }
            else if (no.tipo === 'nao-validada') {
                tagTexto = 'NÃO VALIDADA';
                // Final node, no actions
            }
            else if (no.tipo === 'raiz-secundaria') {
                tagTexto = 'CAUSA SECUNDÁRIA';
                // Final node, no actions
            }
            else if (no.tipo === 'raiz') {
                tagTexto = 'CAUSA RAIZ';
                // Final node, no actions
            }

            html += `<li>
                        <div class="node-content ${tipoClasse}">
                            <span class="logic-tag">${tagTexto}</span>
                            <span class="node-text" onclick="editarNo('${no.id}')">${no.texto}</span>
                            <div class="node-actions">${botoesAcao}</div>
                        </div>
                        ${no.filhos.length > 0 ? criarHTML(no.filhos) : ''}
                    </li>`;
        }
        html += '</ul>';
        return html;
    }

    if (estado.arvore.length > 0) {
        container.innerHTML = `<div class="oc-tree">${criarHTML(estado.arvore)}</div>`;
    }
}

function adicionarPorque() {
    const input = document.getElementById('novo-porque');
    if (!input.value.trim()) return;
    estado.cincoPorques.push(input.value);
    input.value = ''; renderizarPorques(); salvarEstado();
}

function removerPorque(index) { estado.cincoPorques.splice(index, 1); renderizarPorques(); salvarEstado(); }

function renderizarPorques() {
    const lista = document.getElementById('lista-5pq'); lista.innerHTML = '';
    estado.cincoPorques.forEach((pq, index) => {
        lista.innerHTML += `<li><span class="pq-text">${pq}</span> <span class="no-print" style="cursor:pointer; color:red; margin-left:auto;" onclick="removerPorque(${index})">✖</span></li>`;
    });
}

function addIshikawa(event, categoria) {
    if (event.key === 'Enter') {
        const input = event.target;
        if (!input.value.trim()) return;
        estado.ishikawa[categoria].push(input.value);
        input.value = ''; renderizarIshikawa(); salvarEstado();
    }
}

function removerIshikawa(categoria, index) { estado.ishikawa[categoria].splice(index, 1); renderizarIshikawa(); salvarEstado(); }

function renderizarIshikawa() {
    Object.keys(estado.ishikawa).forEach(cat => {
        const ul = document.getElementById(`lista-${cat}`);
        if (ul) {
            ul.innerHTML = '';
            estado.ishikawa[cat].forEach((item, index) => {
                ul.innerHTML += `<li>${item} <span class="no-print" style="cursor:pointer; color:red; margin-left:10px; font-size:0.8em;" onclick="removerIshikawa('${cat}', ${index})">✖</span></li>`;
            });
        }
    });
}

// === Barreiras ===
function adicionarBarreira() {
    const nome = document.getElementById('barreira-nome').value;
    const status = document.getElementById('barreira-status').value;

    if (!nome.trim()) return alert('Preencha o nome da barreira.');

    estado.barreiras.push({ nome: nome.trim(), status });
    document.getElementById('barreira-nome').value = '';
    renderizarBarreiras(); salvarEstado();
}

function removerBarreira(index) { estado.barreiras.splice(index, 1); renderizarBarreiras(); salvarEstado(); }

function renderizarBarreiras() {
    const container = document.getElementById('lista-barreiras');
    container.innerHTML = '';
    estado.barreiras.forEach((barreira, index) => {
        let badge = '';
        let classeCard = 'barreira-inexistente';

        if (barreira.status === 'Funcionou') {
            badge = '🛡️ Mitigou/Funcionou';
            classeCard = 'barreira-funcionou';
        } else if (barreira.status === 'Falhou') {
            badge = '⚠️ Falhou';
            classeCard = 'barreira-falhou';
        } else {
            badge = '❌ Inexistente';
        }

        container.innerHTML += `
            <div class="barreira-card ${classeCard}">
                <div class="barreira-info">
                    <strong>${barreira.nome}</strong>
                    <span>Status: ${badge}</span>
                </div>
                <button class="btn-danger btn-small no-print" onclick="removerBarreira(${index})">X</button>
            </div>
        `;
    });
}

// === Timeline ===
function adicionarTimeline() {
    const data = document.getElementById('timeline-data').value;
    const hora = document.getElementById('timeline-hora').value;
    const evento = document.getElementById('timeline-evento').value;

    if (!data || !hora || !evento.trim()) return alert('Preencha data, hora e evento para a timeline.');

    estado.timeline.push({ data, hora, evento: evento.trim() });

    // Ordenar cronologicamente
    estado.timeline.sort((a, b) => {
        const dtA = new Date(`${a.data}T${a.hora}`);
        const dtB = new Date(`${b.data}T${b.hora}`);
        return dtA - dtB;
    });

    document.getElementById('timeline-evento').value = '';
    renderizarTimeline(); salvarEstado();
}

function removerTimeline(index) { estado.timeline.splice(index, 1); renderizarTimeline(); salvarEstado(); }

function renderizarTimeline() {
    const lista = document.getElementById('lista-timeline');
    lista.innerHTML = '';
    estado.timeline.forEach((item, index) => {
        // formatar data
        const dateParts = item.data.split('-');
        const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : item.data;

        lista.innerHTML += `
            <li class="timeline-item">
                <div class="timeline-content">
                    <span class="timeline-datetime">${formattedDate} ${item.hora}</span>
                    <span class="timeline-text">${item.evento}</span>
                    <button class="btn-danger btn-small no-print" onclick="removerTimeline(${index})">X</button>
                </div>
            </li>
        `;
    });
}

// === Plano de Ação 5W2H ===
function adicionarAcao() {
    const oque = document.getElementById('acao-oque').value; const porque = document.getElementById('acao-porque').value;
    const quem = document.getElementById('acao-quem').value; const quando = document.getElementById('acao-quando').value;
    const onde = document.getElementById('acao-onde').value; const como = document.getElementById('acao-como').value;
    const quanto = document.getElementById('acao-quanto').value;
    const categoria = document.getElementById('acao-categoria').value;
    const status = document.getElementById('acao-status').value;

    if (!oque || !quem || !quando) return alert("Preencha ao menos O Que, Quem e Quando!");

    estado.acoes.push({ oque, porque, quem, quando, onde, como, quanto, categoria, status });

    document.querySelectorAll('input[id^="acao-"]').forEach(inp => inp.value = '');
    document.getElementById('acao-categoria').value = 'Corretiva';
    document.getElementById('acao-status').value = 'A Fazer';
    renderizarAcoes(); salvarEstado();
}

function removerAcao(index) { estado.acoes.splice(index, 1); renderizarAcoes(); salvarEstado(); }

function atualizarProgressoAcoes() {
    const total = estado.acoes.length;
    if (total === 0) {
        document.getElementById('progresso-texto').textContent = '0% Concluído';
        document.getElementById('progresso-fill').style.width = '0%';
        return;
    }

    const concluidas = estado.acoes.filter(a => a.status === 'Concluído').length;
    const porcentagem = Math.round((concluidas / total) * 100);

    document.getElementById('progresso-texto').textContent = `${porcentagem}% Concluído`;
    document.getElementById('progresso-fill').style.width = `${porcentagem}%`;
}

function renderizarAcoes() {
    const tbody = document.querySelector('#tabela-acoes tbody'); tbody.innerHTML = '';
    estado.acoes.forEach((a, index) => {
        let badgeClass = 'status-todo';
        if (a.status === 'Em Andamento') badgeClass = 'status-doing';
        else if (a.status === 'Concluído') badgeClass = 'status-done';

        let catClass = 'cat-corretiva';
        if (a.categoria === 'Preventiva') catClass = 'cat-preventiva';
        else if (a.categoria === 'Detetiva') catClass = 'cat-detetiva';
        else if (a.categoria === 'Melhoria') catClass = 'cat-melhoria';

        const catBadgeHTML = a.categoria ? `<br><span class="cat-badge ${catClass}">${a.categoria}</span>` : '';

        // Agrupamento lógico para caber no PDF Retrato
        tbody.innerHTML += `<tr>
            <td>${a.oque} <span class="info-sub"><strong>Por que:</strong> ${a.porque || 'N/A'}</span></td>
            <td>${a.quem}</td>
            <td>${a.quando} <span class="info-sub"><strong>Onde:</strong> ${a.onde || 'N/A'}</span></td>
            <td>${a.como || 'N/A'} ${catBadgeHTML} <span class="info-sub"><strong>Custo:</strong> ${a.quanto || 'N/A'}</span></td>
            <td><span class="status-badge ${badgeClass}">${a.status || 'A Fazer'}</span></td>
            <td class="no-print"><button class="btn-danger btn-small" onclick="removerAcao(${index})">X</button></td>
        </tr>`;
    });
    atualizarProgressoAcoes();
}

// === Participantes ===
function adicionarParticipante() {
    const input = document.getElementById('novo-participante');
    if (!input.value.trim()) return;
    estado.participantes.push(input.value);
    input.value = ''; renderizarParticipantes(); salvarEstado();
}
function removerParticipante(index) { estado.participantes.splice(index, 1); renderizarParticipantes(); salvarEstado(); }
function renderizarParticipantes() {
    const lista = document.getElementById('lista-presenca'); lista.innerHTML = '';
    estado.participantes.forEach((p, index) => {
        lista.innerHTML += `<li>${p} <span class="no-print" style="cursor:pointer; color:red; margin-left:5px;" onclick="removerParticipante(${index})">✖</span></li>`;
    });
}

// === Evidências ===
function processarImagem(event) {
    const tituloInput = document.getElementById('foto-titulo');
    const descInput = document.getElementById('foto-desc');
    if (!tituloInput.value.trim()) { alert("Preencha o 'Título da Foto' primeiro."); event.target.value = ''; return; }

    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = function (e) {
        const img = new Image(); img.src = e.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas'); const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width; canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

            estado.fotos.push({ base64: canvas.toDataURL('image/jpeg', 0.7), titulo: tituloInput.value.trim(), descricao: descInput.value.trim() });
            tituloInput.value = ''; descInput.value = ''; event.target.value = '';
            renderizarFotos(); salvarEstado();
        }
    };
}
function removerFoto(index) { estado.fotos.splice(index, 1); renderizarFotos(); salvarEstado(); }
function renderizarFotos() {
    const galeria = document.getElementById('galeria-fotos'); galeria.innerHTML = '';
    estado.fotos.forEach((foto, index) => {
        galeria.innerHTML += `<div class="evidence-card">
            <img src="${foto.base64 || foto}" alt="${foto.titulo || 'Foto'}">
            <div class="evidence-info"><h4>${foto.titulo || 'Evidência'}</h4><p>${foto.descricao || ''}</p></div>
            <button class="btn-danger btn-small no-print" onclick="removerFoto(${index})">Remover</button>
        </div>`;
    });
}

// === Restauração e Validação ===
function restaurarInterface() {
    document.getElementById('nome-empresa').value = estado.config?.empresa || 'Vale S/A';
    document.getElementById('titulo').value = estado.dadosIniciais.titulo || '';
    document.getElementById('area').value = estado.dadosIniciais.area || '';
    document.getElementById('data').value = estado.dadosIniciais.data || '';
    document.getElementById('probabilidade').value = estado.dadosIniciais.probabilidade || '';
    document.getElementById('severidade').value = estado.dadosIniciais.severidade || '';
    document.getElementById('sistema').value = estado.dadosIniciais.sistema || '';
    document.getElementById('downtime').value = estado.dadosIniciais.downtime || '';
    document.getElementById('impacto').value = estado.dadosIniciais.impacto || '';
    document.getElementById('ttd').value = estado.dadosIniciais.ttd || '';
    document.getElementById('ttr').value = estado.dadosIniciais.ttr || '';
    document.getElementById('classificacao').value = estado.dadosIniciais.classificacao || '';
    document.getElementById('violacao-sla').checked = estado.dadosIniciais.violacaoSla || false;
    document.getElementById('resumo-executivo').value = estado.dadosIniciais.resumo || '';
    document.getElementById('pm-funcionou').value = estado.postmortem?.funcionou || '';
    document.getElementById('pm-falhou').value = estado.postmortem?.falhou || '';

    document.getElementById('fishbone-efeito').textContent = estado.dadosIniciais.titulo || 'Nenhum evento preenchido';

    calcularRisco(); atualizarCabecalho(); renderizarArvore(); renderizarPorques();
    renderizarIshikawa(); renderizarBarreiras(); renderizarTimeline(); renderizarAcoes(); renderizarParticipantes(); renderizarFotos();
}

function validarEstado() {
    const dadosOk = estado.dadosIniciais.titulo && estado.dadosIniciais.area && estado.dadosIniciais.data && estado.dadosIniciais.probabilidade && estado.dadosIniciais.severidade;
    const metodosOk = estado.arvore.length > 0 || estado.cincoPorques.length > 0 || Object.values(estado.ishikawa).some(arr => arr.length > 0) || (estado.timeline && estado.timeline.length > 0) || (estado.barreiras && estado.barreiras.length > 0);
    const acaoOk = estado.acoes.length > 0; const presencaOk = estado.participantes.length > 0;

    document.getElementById('check-dados').className = dadosOk ? 'ok' : 'pending';
    document.getElementById('check-arvore').className = metodosOk ? 'ok' : 'pending';
    document.getElementById('check-acao').className = acaoOk ? 'ok' : 'pending';
    document.getElementById('check-presenca').className = presencaOk ? 'ok' : 'pending';

    const btnPdf = document.getElementById('btn-pdf');
    if (dadosOk && metodosOk && acaoOk && presencaOk) { btnPdf.removeAttribute('disabled'); }
    else { btnPdf.setAttribute('disabled', 'true'); }
}

// === Geração do PDF Corporativo ===
document.getElementById('btn-pdf').addEventListener('click', () => {
    // Insere a data de emissão automática no cabeçalho
    document.getElementById('data-emissao-pdf').textContent = 'Emitido em: ' + new Date().toLocaleDateString();

    // Ativa as classes para exibir cabeçalho e esconder sidebar
    document.body.classList.add('pdf-mode-global');

    // Mostra todas as metodologias preenchidas
    const secaoMetodologias = document.getElementById('secao-metodologias');
    secaoMetodologias.classList.add('pdf-mode');
    document.querySelectorAll('.tab-content').forEach(tab => {
        const temArvore = tab.id === 'aba-arvore' && estado.arvore.length > 0;
        const tem5PQ = tab.id === 'aba-5pq' && estado.cincoPorques.length > 0;
        const temIshikawa = tab.id === 'aba-ishikawa' && Object.values(estado.ishikawa).some(arr => arr.length > 0);
        const temTimeline = tab.id === 'aba-timeline' && estado.timeline && estado.timeline.length > 0;
        const temBarreiras = tab.id === 'aba-barreiras' && estado.barreiras && estado.barreiras.length > 0;
        tab.style.display = (temArvore || tem5PQ || temIshikawa || temTimeline || temBarreiras) ? 'block' : 'none';
    });

    // Converte inputs para texto limpo
    const inputs = document.querySelectorAll('input[type="text"], input[type="date"], select, textarea, input[type="checkbox"]');
    inputs.forEach(input => {
        if (input.id && input.style.display !== 'none' && !input.closest('.no-print')) {
            const span = document.createElement('span');

            if (input.type === 'checkbox') {
                span.className = 'pdf-checkbox';
                span.textContent = input.checked ? '☑ Sim' : '☐ Não';
            } else {
                span.className = 'pdf-text';
                span.textContent = input.options ? input.options[input.selectedIndex].text : input.value;
            }

            span.id = 'span_' + input.id; input.style.display = 'none';
            input.parentNode.insertBefore(span, input.nextSibling);
        }
    });

    const opt = {
        margin: 10,
        filename: `RCA_${estado.dadosIniciais.titulo.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(document.getElementById('relatorio-content')).save().then(() => {
        // Restaura Interface
        document.body.classList.remove('pdf-mode-global');
        secaoMetodologias.classList.remove('pdf-mode');
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.querySelector('.tab-btn.active')?.click() || abrirAba(null, 'aba-arvore');

        inputs.forEach(input => {
            if (input.id) {
                input.style.display = '';
                const span = document.getElementById('span_' + input.id);
                if (span) span.remove();
            }
        });
        alert('Relatório da Vale S/A gerado com sucesso!');
    });
});