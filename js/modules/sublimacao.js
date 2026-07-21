'use strict';
let sublimacaoSearch = '';
let salvandoSublimacao = false;

async function renderSublimacao(search) {
  if (search !== undefined) sublimacaoSearch = search;
  document.getElementById('pageTitle').textContent = 'Sublimação';
  try {
    let dados = await getAll('sublimacao');
    if (sublimacaoSearch) dados = dados.filter(r => (r.descricao+' '+r.tecido+' '+r.cod_cor).toLowerCase().includes(sublimacaoSearch.toLowerCase()));

    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6><i class="fas fa-paint-brush me-2"></i>${dados.length} registro(s)</h6>
        <div class="d-flex gap-2">
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
              <th class="ps-3">Descrição</th><th>Tecido / Cód. Cor</th><th>R$/m²</th>
              <th>Uber</th><th>Almoço</th><th>Gasolina</th><th>Estacionamento</th><th>Brim</th>
              <th class="fw-bold text-primary">Total Gasto</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => {
              const totalMetro = (parseFloat(r.valor_metro)||0)*(parseFloat(r.qtd_metro)||0);
              const total = [r.uber, r.almoco, r.gasolina, r.estacionamento, r.brim, r.mao_obra_anderson].reduce((s,v)=>s+(parseFloat(v)||0),0);
              return `<tr>
                <td class="ps-3"><strong>${escHtml(r.descricao||'—')}</strong></td>
                <td>${escHtml(r.tecido||'—')}<br><small class="text-muted">${escHtml(r.cod_cor||'—')}</small></td>
                <td><small>${r.qtd_metro||0}m² × ${r.valor_metro?fmtMoney(r.valor_metro):'-'}</small><br><strong>${fmtMoney(totalMetro)}</strong></td>
                <td>${r.uber?fmtMoney(r.uber):'—'}</td>
                <td>${r.almoco?fmtMoney(r.almoco):'—'}</td>
                <td>${r.gasolina?fmtMoney(r.gasolina):'—'}</td>
                <td>${r.estacionamento?fmtMoney(r.estacionamento):'—'}</td>
                <td>${r.brim?fmtMoney(r.brim):'—'}</td>
                <td class="fw-bold text-primary">${fmtMoney(total)}</td>
                <td class="text-end pe-3">
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
    <div class="col-md-3"><label class="form-label fw-semibold">DATA DO PEDIDO</label><input type="date" class="form-control" id="sDataPedido" value="${v('data_pedido')||localDateStr()}"></div>
    <div class="col-12"><label class="form-label fw-semibold">ENDEREÇO</label><input class="form-control" id="sEndereco" value="${v('endereco_cliente')}" placeholder="Endereço do cliente"></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-info-circle text-primary"></i><strong class="text-primary">IDENTIFICAÇÃO</strong></div></div>
    <div class="col-12"><label class="form-label">Observação</label><input class="form-control" id="sDesc" value="${v('descricao')}" placeholder="Ex: Camiseta polo azul marinho"></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
      <i class="fas fa-tshirt text-primary"></i><strong class="text-primary">TECIDO — USO NA PRODUÇÃO</strong></div></div>
    <div class="col-md-4"><label class="form-label">Tecido</label><input class="form-control" id="sTecido" value="${v('tecido')}" placeholder="Ex: Malha PV, Dry Fit..."></div>
    <div class="col-md-3"><label class="form-label">Código da Cor do Tecido</label><input class="form-control" id="sCodCor" value="${v('cod_cor')}" placeholder="Ex: 0001, Azul Royal..."></div>
    <div class="col-md-2"><label class="form-label">Metros usados (m²)</label><input type="number" class="form-control" id="qtd_metro" step="0.01" min="0" value="${v('qtd_metro')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div>
    <div class="col-md-3"><label class="form-label">Valor cobrado do cliente/m² (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="valor_metro" step="0.01" min="0" value="${v('valor_metro')}" oninput="calcTotalSublimacao()"></div></div>
    <div class="col-12"><div class="d-flex align-items-center gap-2 px-2 py-1 rounded" style="background:#d1fae5;border:1px solid #10b981">
      <i class="fas fa-tag text-success"></i>
      <small class="text-muted fw-semibold">Valor cobrado do cliente pelo tecido:</small>
      <strong class="text-success" id="subTotalMetro">R$ 0,00</strong>
      <small class="text-muted ms-1">(não entra no Total Gasto)</small>
    </div></div>

    <div class="col-12 mt-2"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #dc2626;padding-bottom:4px">
      <i class="fas fa-shopping-cart text-danger"></i><strong class="text-danger">COMPRA DO TECIDO</strong>
      <small class="text-muted">(custo real pago por você)</small></div></div>
    <div class="col-md-3"><label class="form-label">Metros comprados</label><input type="number" class="form-control" id="compra_tecido_metros" step="0.01" min="0" value="${v('compra_tecido_metros')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div>
    <div class="col-md-3"><label class="form-label">Valor pago por metro (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="compra_tecido_valor_metro" step="0.01" min="0" value="${v('compra_tecido_valor_metro')}" oninput="calcTotalSublimacao()" placeholder="0,00"></div></div>
    <div class="col-md-3"><label class="form-label">Total gasto na compra (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="compra_tecido_total" step="0.01" min="0" value="${v('compra_tecido_total')}" oninput="calcTotalSublimacao()" placeholder="ou digite direto" style="background:#fff5f5"></div></div>
    <div class="col-md-3 d-flex align-items-end"><div class="p-2 rounded w-100 text-center" style="background:#fee2e2;border:1px solid #dc2626">
      <div class="small text-muted">Custo do tecido</div>
      <strong class="text-danger" id="subCustoTecido">R$ 0,00</strong>
      <div class="small text-muted">(entra no Total Gasto)</div>
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
      <label class="form-label fw-semibold">DATA DE ENTREGA</label>
      <input type="date" class="form-control" id="sDataEntrega" value="${v('data_entrega')}">
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
  const qtd = parseFloat(document.getElementById('qtd_metro')?.value)||0;
  const vMetro = parseFloat(document.getElementById('valor_metro')?.value)||0;
  const totalMetro = qtd * vMetro;
  const subEl = document.getElementById('subTotalMetro');
  if (subEl) subEl.textContent = totalMetro.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  const compraMetros = parseFloat(document.getElementById('compra_tecido_metros')?.value)||0;
  const compraValorM = parseFloat(document.getElementById('compra_tecido_valor_metro')?.value)||0;
  const custoTecidoTotal = compraMetros * compraValorM;
  const elTotal = document.getElementById('compra_tecido_total');
  if (elTotal) elTotal.value = custoTecidoTotal > 0 ? custoTecidoTotal.toFixed(2) : '';
  const subCustoEl = document.getElementById('subCustoTecido');
  if (subCustoEl) subCustoEl.textContent = custoTecidoTotal.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

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

async function salvarSublimacao(id) {
  if (salvandoSublimacao) return; // trava contra duplo clique / clique repetido enquanto salva
  salvandoSublimacao = true;
  const descricao = document.getElementById('sDesc').value.trim();
  const data = {
    descricao,
    nome_cliente:     document.getElementById('sNomeCliente').value.trim(),
    telefone_cliente: document.getElementById('sTelefoneCliente').value.trim(),
    data_pedido:      document.getElementById('sDataPedido').value,
    data_entrega:     document.getElementById('sDataEntrega').value || null,
    endereco_cliente: document.getElementById('sEndereco').value.trim(),
    tecido:      document.getElementById('sTecido').value,
    cod_cor:     document.getElementById('sCodCor').value,
    qtd_metro:                parseFloat(document.getElementById('qtd_metro').value)||0,
    valor_metro:              parseFloat(document.getElementById('valor_metro').value)||0,
    compra_tecido_metros:     parseFloat(document.getElementById('compra_tecido_metros')?.value)||0,
    compra_tecido_valor_metro:parseFloat(document.getElementById('compra_tecido_valor_metro')?.value)||0,
    compra_tecido_total:      parseFloat(document.getElementById('compra_tecido_total')?.value)||0,
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

  try {
    if (id) {
      await update('sublimacao',id,data);

      // preenche lançamentos que faltaram (ex: registro editado depois de criado
      // sem valor de venda/gasto ainda calculado) — nunca duplica o que já existe.
      // Usa o próprio ID do registro como identificador único, já que descrição e
      // cliente costumam ficar em branco (não dá pra confiar só no texto pra comparar).
      const tag = `Sublimação #${id}`;
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
            vencimento: localDateStr(),
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
      const novo = await insert('sublimacao', data);
      const tag = `Sublimação #${novo.id}`;
      const totalGasto = data.uber + data.almoco + data.gasolina + data.estacionamento + data.brim + data.mao_obra_anderson;
      if (totalGasto > 0) {
        const hoje = localDateStr();
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
            vencimento: hoje,
            status:     'pendente',
            ativo: 1
          });
        }
        toast(`Salvo! Total gasto ${fmtMoney(totalGasto)} lançado em Contas a Pagar.`);
      } else {
        toast('Registro salvo!');
      }
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
    }
    closeModal(); renderSublimacao();
  } catch(e) { toast(e.message,'danger'); }
  finally { salvandoSublimacao = false; }
}

async function delSublimacao(id, desc) {
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove('sublimacao',id); toast('Removido.'); renderSublimacao();
}
