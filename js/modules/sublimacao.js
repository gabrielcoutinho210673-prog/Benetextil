'use strict';
let sublimacaoSearch = '';
let sublimacaoMes = '';
let salvandoSublimacao = false;
const MAX_ITENS_SUBL = 10;

// Item 1 fica nas colunas antigas (descricao, tecido, qtd_metro...);
// os itens 2 em diante ficam na coluna itens_extra (jsonb, lista).
function itensSublDoRegistro(r) {
  const primeiro = {
    descricao: r.descricao, tecido: r.tecido, cod_cor: r.cod_cor,
    qtd_metro: r.qtd_metro, valor_metro: r.valor_metro,
    compra_tecido_metros: r.compra_tecido_metros, compra_tecido_valor_metro: r.compra_tecido_valor_metro
  };
  let extras = r.itens_extra;
  if (typeof extras === 'string') { try { extras = JSON.parse(extras); } catch(e) { extras = []; } }
  return [primeiro, ...(Array.isArray(extras) ? extras : [])];
}

function blocoItemSubl(i, it, visivel) {
  const val = k => escHtml(it?.[k] ?? '');
  const custoInicial = (parseFloat(it?.compra_tecido_metros)||0) * (parseFloat(it?.compra_tecido_valor_metro)||0);
  return `
  <div class="subl-item mb-2" id="sublItem${i}" style="${visivel?'':'display:none'}">
    <div class="d-flex align-items-center gap-2 my-2" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-paint-brush text-primary"></i><strong class="text-primary">SUBLIMAÇÃO ${i}</strong>
      ${i>1?`<button type="button" class="btn btn-sm btn-outline-danger ms-auto py-0" onclick="removerItemSubl(${i})"><i class="fas fa-trash me-1"></i>Remover</button>`:''}
    </div>
    <div class="row g-2">
      <div class="col-12"><label class="form-label">Observação</label><input class="form-control" id="sDesc${i}" value="${val('descricao')}" placeholder="Ex: Camiseta polo azul marinho"></div>
      <div class="col-md-4"><label class="form-label">Tecido</label><input class="form-control" id="sTecido${i}" value="${val('tecido')}" placeholder="Ex: Malha PV, Dry Fit..."></div>
      <div class="col-md-3"><label class="form-label">Código da Cor do Tecido</label><input class="form-control" id="sCodCor${i}" value="${val('cod_cor')}" placeholder="Ex: 0001, Azul Royal..."></div>
      <div class="col-md-2"><label class="form-label">Metros usados (m²)</label><input type="number" class="form-control" id="sQtdMetro${i}" step="0.01" min="0" value="${val('qtd_metro')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div>
      <div class="col-md-3"><label class="form-label">Valor cobrado do cliente/m² (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="sValorMetro${i}" step="0.01" min="0" value="${val('valor_metro')}" oninput="calcTotalSublimacao()"></div></div>
      <div class="col-md-3"><label class="form-label">Metros comprados</label><input type="number" class="form-control" id="sCompraMetros${i}" step="0.01" min="0" value="${val('compra_tecido_metros')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div>
      <div class="col-md-3"><label class="form-label">Valor pago por metro (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="sCompraValorM${i}" step="0.01" min="0" value="${val('compra_tecido_valor_metro')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div></div>
      <div class="col-md-6 d-flex align-items-end gap-2">
        <div class="p-2 rounded flex-fill text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">Cobrado do cliente</div><strong class="text-success" id="sSubVenda${i}">R$ 0,00</strong></div>
        <div class="p-2 rounded flex-fill text-center" style="background:#fee2e2;border:1px solid #dc2626"><div class="small text-muted">Custo do tecido</div><strong class="text-danger" id="sSubCusto${i}">${fmtMoney(custoInicial)}</strong></div>
      </div>
    </div>
  </div>`;
}

function renderItensSubl() {
  const n = parseInt(document.getElementById('sQtdItens')?.value) || 1;
  for (let i = 1; i <= MAX_ITENS_SUBL; i++) {
    const el = document.getElementById('sublItem' + i);
    if (el) el.style.display = i <= n ? '' : 'none';
  }
  const btn = document.getElementById('btnAddItemSubl');
  if (btn) btn.style.display = n >= MAX_ITENS_SUBL ? 'none' : '';
}

function adicionarItemSubl() {
  const el = document.getElementById('sQtdItens');
  const n = parseInt(el.value) || 1;
  if (n >= MAX_ITENS_SUBL) return;
  el.value = n + 1;
  renderItensSubl();
  document.getElementById('sublItem' + (n + 1))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('sDesc' + (n + 1))?.focus();
}

function removerItemSubl(i) {
  const el = document.getElementById('sQtdItens');
  const n = parseInt(el.value) || 1;
  if (i !== n) { toast('Remova primeiro a última sublimação (Sublimação ' + n + ')', 'warning'); return; }
  document.querySelectorAll(`#sublItem${i} input`).forEach(inp => { inp.value = ''; });
  el.value = n - 1;
  renderItensSubl();
  calcTotalSublimacao();
}

function lerItemSubl(i) {
  const val = id => document.getElementById(id + i)?.value || '';
  const num = id => parseFloat(val(id)) || 0;
  return {
    descricao: val('sDesc').trim(), tecido: val('sTecido'), cod_cor: val('sCodCor'),
    qtd_metro: num('sQtdMetro'), valor_metro: num('sValorMetro'),
    compra_tecido_metros: num('sCompraMetros'), compra_tecido_valor_metro: num('sCompraValorM')
  };
}

async function renderSublimacao(search) {
  if (search !== undefined) sublimacaoSearch = search;
  document.getElementById('pageTitle').textContent = 'Sublimação';
  try {
    let dados = await getAll('sublimacao');

    const meses = mesesComAno(dados.map(r => r.data_pedido));

    if (sublimacaoSearch) dados = dados.filter(r => itensSublDoRegistro(r).map(it => `${it.descricao||''} ${it.tecido||''} ${it.cod_cor||''}`).join(' ').concat(' ', r.nome_cliente||'').toLowerCase().includes(sublimacaoSearch.toLowerCase()));
    if (sublimacaoMes) dados = dados.filter(r => (r.data_pedido||'').startsWith(sublimacaoMes));

    let somaGasto = 0, somaVenda = 0;
    dados.forEach(r => {
      somaGasto += [r.uber, r.almoco, r.gasolina, r.estacionamento, r.brim, r.mao_obra_anderson, r.compra_tecido_total].reduce((s,v)=>s+(parseFloat(v)||0),0);
      somaVenda += parseFloat(r.valor_venda)||0;
    });
    const somaLucro = somaVenda - somaGasto;

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-6"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626">
        <div class="small text-muted">Gasto</div><strong class="text-danger">${fmtMoney(somaGasto)}</strong></div></div>
      <div class="col-6"><div class="p-2 rounded text-center" style="background:${somaLucro>=0?'#d1fae5':'#fee2e2'};border:1px solid ${somaLucro>=0?'#10b981':'#dc2626'}">
        <div class="small text-muted">Lucro</div><strong class="${somaLucro>=0?'text-success':'text-danger'}">${fmtMoney(somaLucro)}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6><i class="fas fa-paint-brush me-2"></i>${dados.length} registro(s)</h6>
        <div class="d-flex gap-2 flex-wrap">
          <select class="form-select form-select-sm" style="width:180px" onchange="sublimacaoMes=this.value;renderSublimacao()">
            <option value="">Todos os meses</option>
            ${meses.map(m=>`<option value="${m}" ${sublimacaoMes===m?'selected':''}>${new Date(m+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
          <div class="input-group input-group-sm" style="width:260px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(sublimacaoSearch)}"
              oninput="renderSublimacao(this.value)">
            <button class="btn btn-outline-secondary" onclick="sublimacaoSearch='';renderSublimacao('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formSublimacao()"><i class="fas fa-plus me-1"></i>Novo</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Data Pedido</th><th>Tecido / Cód. Cor</th><th>R$/m²</th>
              <th>Uber</th><th>Almoço</th><th>Gasolina</th><th>Estacionamento</th><th>Brim</th>
              <th class="fw-bold text-primary">Total Gasto</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => {
              const itens = itensSublDoRegistro(r);
              const extras = itens.length - 1;
              const totalMetro = itens.reduce((s,it)=>s+(parseFloat(it.valor_metro)||0)*(parseFloat(it.qtd_metro)||0),0);
              const total = [r.uber, r.almoco, r.gasolina, r.estacionamento, r.brim, r.mao_obra_anderson, r.compra_tecido_total].reduce((s,v)=>s+(parseFloat(v)||0),0);
              return `<tr>
                <td class="ps-3"><strong>${escHtml(r.descricao||r.nome_cliente||'—')}</strong>${extras?` <span class="badge bg-primary">+${extras} sublimaç${extras>1?'ões':'ão'}</span>`:''}</td>
                <td><small>${r.data_pedido?fmtDate(r.data_pedido):'—'}</small></td>
                <td>${escHtml(r.tecido||'—')}<br><small class="text-muted">${escHtml(r.cod_cor||'—')}</small></td>
                <td><small>${extras?`${itens.length} itens`:`${r.qtd_metro||0}m² × ${r.valor_metro?fmtMoney(r.valor_metro):'-'}`}</small><br><strong>${fmtMoney(totalMetro)}</strong></td>
                <td>${r.uber?fmtMoney(r.uber):'—'}</td>
                <td>${r.almoco?fmtMoney(r.almoco):'—'}</td>
                <td>${r.gasolina?fmtMoney(r.gasolina):'—'}</td>
                <td>${r.estacionamento?fmtMoney(r.estacionamento):'—'}</td>
                <td>${r.brim?fmtMoney(r.brim):'—'}</td>
                <td class="fw-bold text-primary">${fmtMoney(total)}</td>
                <td class="text-end pe-3">
                  <button class="btn btn-icon btn-outline-secondary btn-sm" title="Gerar Ordem de Fornecimento (PDF)" onclick='gerarOrdemFornecimento("sublimacao",${JSON.stringify(r)})'><i class="fas fa-file-pdf"></i></button>
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formSublimacao(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delSublimacao(${r.id},'${escHtml(r.descricao||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;}).join('')
            : emptyState('paint-brush','Nenhum registro de sublimação')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formSublimacao(r={}) {
  const v = f => escHtml(r[f]||'');
  const itensForm = r.id ? itensSublDoRegistro(r) : [{}];
  const qtdItens = Math.min(Math.max(itensForm.length, 1), MAX_ITENS_SUBL);
  const campo = (id, label, cols='col-md-3') =>
    `<div class="${cols}">
      <label class="form-label">${label}</label>
      <div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="${id}" step="0.01" min="0" value="${v(id)}" oninput="calcTotalSublimacao()"></div>
    </div>`;

  openModal(`<i class="fas fa-paint-brush me-2"></i>${r.id?'Editar':'Novo'} Registro de Sublimação`,
  `<div class="row g-3">
    <div class="col-12"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-user text-primary"></i><strong class="text-primary">DADOS DO CLIENTE</strong></div></div>
    <div class="col-12">
      <label class="form-label fw-semibold">BUSCAR CLIENTE CADASTRADO</label>
      <div class="input-group">
        <input type="text" class="form-control" id="sBuscaCliente" placeholder="Digite o nome do cliente para buscar e preencher automaticamente..."
          oninput="buscarClienteSubl(this.value)">
        <button class="btn btn-outline-secondary" onclick="limparClienteSubl()"><i class="fas fa-times"></i></button>
      </div>
      <div id="sListaClientes" class="list-group mt-1" style="position:absolute;z-index:9999;width:calc(100% - 48px);display:none"></div>
    </div>
    <div class="col-md-6"><label class="form-label fw-semibold">NOME *</label><input class="form-control" id="sNomeCliente" value="${v('nome_cliente')}" placeholder="Nome do cliente"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">TELEFONE</label><input class="form-control" id="sTelefoneCliente" value="${v('telefone_cliente')}" placeholder="(00) 00000-0000"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">DATA DO PEDIDO *</label><input type="date" class="form-control" id="sDataPedido" value="${v('data_pedido')}" onchange="document.getElementById('sDataEntrega').min=this.value"></div>
    <div class="col-12"><label class="form-label fw-semibold">ENDEREÇO</label><input class="form-control" id="sEndereco" value="${v('endereco_cliente')}" placeholder="Endereço do cliente"></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-layer-group text-primary"></i><strong class="text-primary">SUBLIMAÇÕES DO PEDIDO</strong>
      <small class="text-muted">(tecido usado, valor cobrado e compra do tecido de cada uma)</small></div></div>
    <input type="hidden" id="sQtdItens" value="${qtdItens}">
    <div class="col-12">
      ${Array.from({length: MAX_ITENS_SUBL}, (_, k) => blocoItemSubl(k + 1, itensForm[k] || {}, k < qtdItens)).join('')}
    </div>
    <div class="col-12">
      <button type="button" class="btn btn-outline-primary btn-sm" id="btnAddItemSubl" style="${qtdItens>=MAX_ITENS_SUBL?'display:none':''}" onclick="adicionarItemSubl()"><i class="fas fa-plus me-1"></i>Adicionar sublimação</button>
      <small class="text-muted ms-2">Até ${MAX_ITENS_SUBL} sublimações no mesmo pedido</small>
    </div>
    <div class="col-12"><div class="d-flex align-items-center gap-3 flex-wrap px-3 py-2 rounded" style="background:#f8f9fa;border:1px solid #dee2e6">
      <span><i class="fas fa-tag text-success me-1"></i><small class="text-muted fw-semibold">Total cobrado pelo tecido:</small> <strong class="text-success" id="subTotalMetro">R$ 0,00</strong></span>
      <span><i class="fas fa-shopping-cart text-danger me-1"></i><small class="text-muted fw-semibold">Custo total do tecido:</small> <strong class="text-danger" id="subCustoTecido">R$ 0,00</strong> <small class="text-muted">(entra no Total Gasto)</small></span>
    </div></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-receipt text-primary"></i><strong class="text-primary">CUSTOS OPERACIONAIS</strong></div></div>
    ${campo('uber','Uber')}
    ${campo('almoco','Almoço')}
    ${campo('gasolina','Gasolina')}
    ${campo('estacionamento','Estacionamento')}

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-layer-group text-primary"></i><strong class="text-primary">BRIM / TECIDO EXTRA</strong></div></div>
    ${campo('brim','Brim — Tecido')}

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #198754;padding-bottom:4px">
      <i class="fas fa-person-digging text-success"></i><strong class="text-success">MÃO DE OBRA</strong></div></div>
    <div class="col-md-3"><label class="form-label">Anderson — Qtd m²</label>
      <input type="number" class="form-control" id="mao_obra_anderson_m2" step="0.01" min="0" value="${v('mao_obra_anderson_m2')}" placeholder="0,00" oninput="calcMaoObraAnderson()">
    </div>
    <div class="col-md-3"><label class="form-label">Anderson — Valor por m² (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="mao_obra_anderson_valor" step="0.01" min="0" value="${v('mao_obra_anderson_valor')}" oninput="calcMaoObraAnderson()">
      </div>
    </div>
    <div class="col-md-3"><label class="form-label">Total Mão de Obra (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="mao_obra_anderson" step="0.01" min="0" value="${v('mao_obra_anderson')}" readonly style="background:#f0f9f4">
      </div>
    </div>

    <div class="col-12 mt-2">
      <div class="p-3 rounded d-flex align-items-center justify-content-between" style="background:#eef2ff;border:2px solid #4361ee">
        <div class="d-flex align-items-center gap-2">
          <i class="fas fa-calculator fa-lg text-primary"></i>
          <strong class="text-primary fs-6">TOTAL GASTO:</strong>
        </div>
        <span class="fs-5 fw-bold text-primary" id="sublimacaoTotalDisplay">R$ 0,00</span>
      </div>
    </div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-dollar-sign text-primary"></i><strong class="text-primary">PRAZO E VALOR DE VENDA</strong></div></div>
    <div class="col-md-3">
      <label class="form-label fw-semibold">DATA DE ENTREGA *</label>
      <input type="date" class="form-control" id="sDataEntrega" value="${v('data_entrega')}" min="${v('data_pedido')}">
    </div>
    <div class="col-md-3">
      <label class="form-label fw-semibold">VALOR COBRADO DO TECIDO (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="sValorTecidoVenda" step="0.01" min="0" value="${v('valor_venda')}" oninput="calcTotalSublimacao()" style="background:#f0fff4">
      </div>
    </div>
    <div class="col-md-3">
      <label class="form-label fw-semibold">VALOR DE VENDA TOTAL (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="sValorVenda" step="0.01" min="0" value="${v('valor_venda')}" readonly style="background:#f0fff4">
      </div>
      <small class="text-muted">Calculado automaticamente (metros × valor/metro)</small>
    </div>

    <div class="col-12">
      <div class="row g-2 mt-1 p-3 rounded" style="background:#f8f9fa;border:1px solid #dee2e6">
        <div class="col-12 mb-1"><strong><i class="fas fa-calculator me-1 text-primary"></i>RESUMO FINANCEIRO</strong></div>
        <div class="col-md-6">
          <div class="p-2 rounded text-center" style="background:#fff3cd;border:1px solid #ffc107">
            <div class="small text-muted fw-semibold">TOTAL INVESTIDO</div>
            <div class="fs-5 fw-bold text-warning" id="subResumoInvestido">R$ 0,00</div>
            <div class="small text-muted">Tecido + Custos + Brim</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981">
            <div class="small text-muted fw-semibold">LUCRO ESTIMADO</div>
            <div class="fs-5 fw-bold" id="subResumoLucro">R$ 0,00</div>
            <div class="small text-muted">Valor de Venda − Total Investido</div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   ${r.id?'':`<button class="btn btn-outline-primary" onclick="salvarSublimacao(0,true)"><i class="fas fa-plus me-1"></i>Salvar e novo</button>`}
   <button class="btn btn-primary" onclick="salvarSublimacao(${r.id||0})"><i class="fas fa-save me-1"></i>${r.id?'Atualizar':'Salvar'}</button>`,
  'lg'
  );
  setTimeout(calcTotalSublimacao, 100);
}

function calcMaoObraAnderson() {
  const m2    = parseFloat(document.getElementById('mao_obra_anderson_m2')?.value)||0;
  const valor = parseFloat(document.getElementById('mao_obra_anderson_valor')?.value)||0;
  const total = m2 * valor;
  const el = document.getElementById('mao_obra_anderson');
  if (el) el.value = total.toFixed(2);
  calcTotalSublimacao();
}

async function buscarClienteSubl(q) {
  const lista = document.getElementById('sListaClientes');
  if (!lista) return;
  if (!q || q.length < 2) { lista.style.display='none'; return; }
  const todos = await getAll('clientes_cad');
  const res = todos.filter(c => c.nome.toLowerCase().includes(q.toLowerCase())).slice(0,6);
  if (!res.length) { lista.style.display='none'; return; }
  lista.innerHTML = res.map(c => `<button type="button" class="list-group-item list-group-item-action py-1" onclick="preencherClienteSubl(${c.id})">${escHtml(c.nome)}${c.telefone?' — '+escHtml(c.telefone):''}</button>`).join('');
  lista.style.display='block';
}

async function preencherClienteSubl(id) {
  const todos = await getAll('clientes_cad');
  const c = todos.find(x=>x.id===id);
  if (!c) return;
  document.getElementById('sNomeCliente').value = c.nome||'';
  document.getElementById('sTelefoneCliente').value = c.telefone||'';
  document.getElementById('sEndereco').value = c.endereco||'';
  document.getElementById('sBuscaCliente').value = c.nome||'';
  document.getElementById('sListaClientes').style.display='none';
}

function limparClienteSubl() {
  ['sBuscaCliente','sNomeCliente','sTelefoneCliente','sEndereco'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.value='';
  });
  const lista = document.getElementById('sListaClientes');
  if (lista) lista.style.display='none';
}

function calcTotalSublimacao() {
  const n = parseInt(document.getElementById('sQtdItens')?.value) || 1;
  let totalMetro = 0, custoTecidoTotal = 0;
  for (let i = 1; i <= n; i++) {
    const it = lerItemSubl(i);
    const venda = it.qtd_metro * it.valor_metro;
    const custo = it.compra_tecido_metros * it.compra_tecido_valor_metro;
    totalMetro += venda; custoTecidoTotal += custo;
    const eV = document.getElementById('sSubVenda' + i); if (eV) eV.textContent = fmtMoney(venda);
    const eC = document.getElementById('sSubCusto' + i); if (eC) eC.textContent = fmtMoney(custo);
  }
  const subEl = document.getElementById('subTotalMetro');
  if (subEl) subEl.textContent = fmtMoney(totalMetro);
  const subCustoEl = document.getElementById('subCustoTecido');
  if (subCustoEl) subCustoEl.textContent = fmtMoney(custoTecidoTotal);

  const vendaEl = document.getElementById('sValorVenda');
  const tecidoVendaEl = document.getElementById('sValorTecidoVenda');
  if (tecidoVendaEl && totalMetro > 0) tecidoVendaEl.value = totalMetro.toFixed(2);
  if (vendaEl && totalMetro > 0) vendaEl.value = totalMetro.toFixed(2);

  const outros = ['uber','almoco','gasolina','estacionamento','brim','mao_obra_anderson'].reduce((s,id)=>s+(parseFloat(document.getElementById(id)?.value)||0),0);
  const total = outros + custoTecidoTotal;
  const el = document.getElementById('sublimacaoTotalDisplay');
  if (el) el.textContent = total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  const valorVenda = parseFloat(document.getElementById('sValorVenda')?.value)||0;
  const lucro = valorVenda - total;
  const elI = document.getElementById('subResumoInvestido');
  const elL = document.getElementById('subResumoLucro');
  if (elI) elI.textContent = fmtMoney(total);
  if (elL) {
    elL.textContent = fmtMoney(lucro);
    elL.style.color = lucro >= 0 ? '#059669' : '#dc2626';
  }
}

async function salvarSublimacao(id, outro) {
  if (salvandoSublimacao) return; // trava contra duplo clique / clique repetido enquanto salva
  const dPed = document.getElementById('sDataPedido').value;
  const dEnt = document.getElementById('sDataEntrega').value;
  if (!dPed) { toast('Informe a Data do Pedido','danger'); return; }
  if (!dEnt) { toast('Informe a Data de Entrega','danger'); return; }
  if (dEnt < dPed) { toast('A Data de Entrega não pode ser anterior à Data do Pedido','danger'); return; }
  salvandoSublimacao = true;
  const nItens = parseInt(document.getElementById('sQtdItens')?.value) || 1;
  const itens = Array.from({length: nItens}, (_, k) => lerItemSubl(k + 1));
  const item1 = itens[0];
  const descricao = item1.descricao;
  const data = {
    descricao,
    nome_cliente:     document.getElementById('sNomeCliente').value.trim(),
    telefone_cliente: document.getElementById('sTelefoneCliente').value.trim(),
    data_pedido:      document.getElementById('sDataPedido').value,
    data_entrega:     document.getElementById('sDataEntrega').value || null,
    endereco_cliente: document.getElementById('sEndereco').value.trim(),
    tecido:                   item1.tecido,
    cod_cor:                  item1.cod_cor,
    qtd_metro:                item1.qtd_metro,
    valor_metro:              item1.valor_metro,
    compra_tecido_metros:     item1.compra_tecido_metros,
    compra_tecido_valor_metro:item1.compra_tecido_valor_metro,
    // totais do pedido (todas as sublimações) — usados nos cards, relatórios e Contas a Pagar
    compra_tecido_total:      Math.round(itens.reduce((s,it)=>s+it.compra_tecido_metros*it.compra_tecido_valor_metro,0)*100)/100,
    itens_extra:              itens.slice(1),
    uber:           parseFloat(document.getElementById('uber').value)||0,
    almoco:         parseFloat(document.getElementById('almoco').value)||0,
    gasolina:       parseFloat(document.getElementById('gasolina').value)||0,
    estacionamento: parseFloat(document.getElementById('estacionamento').value)||0,
    brim:           parseFloat(document.getElementById('brim').value)||0,
    mao_obra_anderson_m2:    parseFloat(document.getElementById('mao_obra_anderson_m2').value)||0,
    mao_obra_anderson_valor: parseFloat(document.getElementById('mao_obra_anderson_valor').value)||0,
    mao_obra_anderson:       parseFloat(document.getElementById('mao_obra_anderson').value)||0,
    valor_venda:    parseFloat(document.getElementById('sValorVenda').value)||0,
    ativo: 1
  };
  const rotulo = descricao || data.nome_cliente || data.tecido || 'Sublimação';

  // Banco sem a coluna itens_extra (SQL supabase_sublimacao_itens.sql não rodado):
  // pedido com 1 sublimação salva sem ela; com mais de uma, avisa o que falta.
  const semColunaItens = e => /itens_extra/.test(e?.message || '');
  const gravar = async (fn) => {
    try { return await fn(data); }
    catch (e) {
      if (!semColunaItens(e)) throw e;
      if (itens.length > 1) throw new Error('Para salvar mais de uma sublimação no pedido, falta rodar o SQL supabase_sublimacao_itens.sql no Supabase. Com uma sublimação só, já dá para salvar.');
      const { itens_extra, ...semExtras } = data;
      return await fn(semExtras);
    }
  };

  try {
    if (id) {
      await gravar(d => update('sublimacao', id, d));

      // preenche lançamentos que faltaram (ex: registro editado depois de criado
      // sem valor de venda/gasto ainda calculado) — nunca duplica o que já existe.
      // Usa o próprio ID do registro como identificador único, já que descrição e
      // cliente costumam ficar em branco (não dá pra confiar só no texto pra comparar).
      const tag = `Sublimação #${id}`;
      const vencEdit = data.data_entrega || data.data_pedido || localDateStr();
      if (data.compra_tecido_total > 0) {
        const descTecido = `${tag} — Custo do Tecido: ${rotulo}`;
        const existentesPagar0 = await getAll('contas_pagar');
        if (!existentesPagar0.some(c => (c.descricao||'').startsWith(`${tag} — Custo do Tecido:`))) {
          const compraTecido = await insert('compras', {
            descricao: descTecido, fornecedor: 'Benetextil', categoria: 'Matéria-prima',
            valor_total: data.compra_tecido_total, parcelas: 1,
            data_compra: data.data_pedido || vencEdit,
            observacoes: `Gerado automaticamente pela ${tag}`, ativo: 1
          });
          await insert('contas_pagar', {
            descricao: `${descTecido} #${compraTecido.id}`, fornecedor: 'Benetextil',
            valor: data.compra_tecido_total, vencimento: vencEdit, status: 'pendente', ativo: 1
          });
          Cache.clear('compras');
        }
      }
      const totalGastoEdit = data.uber + data.almoco + data.gasolina + data.estacionamento + data.brim + data.mao_obra_anderson;
      if (totalGastoEdit > 0) {
        const existentesPagar = await getAll('contas_pagar');
        const itensEdit = [
          { label: 'Uber',               val: data.uber,              fornecedor: 'Benetextil' },
          { label: 'Almoço',             val: data.almoco,            fornecedor: 'Benetextil' },
          { label: 'Gasolina',           val: data.gasolina,          fornecedor: 'Benetextil' },
          { label: 'Estacionamento',     val: data.estacionamento,    fornecedor: 'Benetextil' },
          { label: 'Brim',               val: data.brim,              fornecedor: 'Benetextil' },
          { label: 'Mão de Obra Anderson', val: data.mao_obra_anderson, fornecedor: 'Anderson' },
        ].filter(i => i.val > 0);
        for (const item of itensEdit) {
          const jaExiste = existentesPagar.some(c => (c.descricao||'').startsWith(`${tag} — ${item.label}:`));
          if (jaExiste) continue;
          await insert('contas_pagar', {
            descricao:  `${tag} — ${item.label}: ${rotulo}`,
            fornecedor: item.fornecedor,
            valor:      item.val,
            vencimento: vencEdit,
            status:     'pendente',
            ativo: 1
          });
        }
        Cache.clear('contas_pagar');
      }
      if (data.valor_venda > 0) {
        const existentesReceber = await getAll('contas_receber');
        const jaTem = existentesReceber.some(r => (r.descricao||'').startsWith(`${tag} —`));
        if (!jaTem) {
          await insert('contas_receber', {
            descricao:  `${tag} — ${rotulo}`,
            cliente:    data.nome_cliente || '',
            valor:      data.valor_venda,
            vencimento: data.data_entrega || localDateStr(),
            status:     'pendente',
            ativo: 1
          });
          Cache.clear('contas_receber');
        }
      }
      toast('Registro atualizado!');
    } else {
      const novo = await gravar(d => insert('sublimacao', d));
      const tag = `Sublimação #${novo.id}`;
      const vencCusto = data.data_entrega || data.data_pedido || localDateStr();
      if (data.compra_tecido_total > 0) {
        const compraTecido = await insert('compras', {
          descricao: `${tag} — Custo do Tecido: ${rotulo}`, fornecedor: 'Benetextil', categoria: 'Matéria-prima',
          valor_total: data.compra_tecido_total, parcelas: 1,
          data_compra: data.data_pedido || vencCusto,
          observacoes: `Gerado automaticamente pela ${tag}`, ativo: 1
        });
        await insert('contas_pagar', {
          descricao: `${tag} — Custo do Tecido: ${rotulo} #${compraTecido.id}`, fornecedor: 'Benetextil',
          valor: data.compra_tecido_total, vencimento: vencCusto, status: 'pendente', ativo: 1
        });
        Cache.clear('compras');
      }
      const totalGasto = data.uber + data.almoco + data.gasolina + data.estacionamento + data.brim + data.mao_obra_anderson;
      if (totalGasto > 0) {
        const itens = [
          { label: 'Uber',               val: data.uber,              fornecedor: 'Benetextil' },
          { label: 'Almoço',             val: data.almoco,            fornecedor: 'Benetextil' },
          { label: 'Gasolina',           val: data.gasolina,          fornecedor: 'Benetextil' },
          { label: 'Estacionamento',     val: data.estacionamento,    fornecedor: 'Benetextil' },
          { label: 'Brim',               val: data.brim,              fornecedor: 'Benetextil' },
          { label: 'Mão de Obra Anderson', val: data.mao_obra_anderson, fornecedor: 'Anderson' },
        ].filter(i => i.val > 0);
        for (const item of itens) {
          await insert('contas_pagar', {
            descricao:  `${tag} — ${item.label}: ${rotulo}`,
            fornecedor: item.fornecedor,
            valor:      item.val,
            vencimento: vencCusto,
            status:     'pendente',
            ativo: 1
          });
        }
      }
      const totalLancado = totalGasto + data.compra_tecido_total;
      toast(totalLancado > 0 ? `Salvo! Total gasto ${fmtMoney(totalLancado)} lançado em Contas a Pagar.` : 'Registro salvo!');
      if (data.valor_venda > 0) {
        await insert('contas_receber', {
          descricao:  `${tag} — ${rotulo}`,
          cliente:    data.nome_cliente || '',
          valor:      data.valor_venda,
          vencimento: data.data_entrega || localDateStr(),
          status:     'pendente',
          ativo: 1
        });
      }
      try { gerarOrdemFornecimento('sublimacao', { ...data, id: novo.id }); } catch(e) {}
    }
    if (outro) reabrirModal(() => formSublimacao()); else closeModal();
    renderSublimacao();
  } catch(e) { toast(e.message,'danger'); }
  finally { salvandoSublimacao = false; }
}

async function delSublimacao(id, desc) {
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove('sublimacao',id); toast('Removido.'); renderSublimacao();
}
