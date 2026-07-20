'use strict';
let finTab    = 'pagar';
let finSearch = '';
let finFiltro = 'todos';
let funcMes   = null;

function renderFinanceiro(tab) {
  if (tab) finTab = tab;
  document.getElementById('pageTitle').textContent = 'Financeiro';
  document.getElementById('pageContent').innerHTML = `
  <ul class="nav nav-tabs mb-3" id="finTabs">
    <li class="nav-item">
      <a class="nav-link ${finTab==='pagar'?'active':''}" href="#" onclick="renderFinanceiro('pagar');return false">
        <i class="fas fa-file-invoice-dollar me-2 text-danger"></i>Contas a Pagar</a>
    </li>
    <li class="nav-item">
      <a class="nav-link ${finTab==='receber'?'active':''}" href="#" onclick="renderFinanceiro('receber');return false">
        <i class="fas fa-hand-holding-usd me-2 text-success"></i>Contas a Receber</a>
    </li>
    <li class="nav-item">
      <a class="nav-link ${finTab==='resumo'?'active':''}" href="#" onclick="renderFinanceiro('resumo');return false">
        <i class="fas fa-chart-line me-2 text-primary"></i>Fluxo de Caixa</a>
    </li>
    <li class="nav-item">
      <a class="nav-link ${finTab==='funcionarios'?'active':''}" href="#" onclick="renderFinanceiro('funcionarios');return false">
        <i class="fas fa-users me-2 text-warning"></i>Funcionários</a>
    </li>
  </ul>
  <div id="finConteudo">${loading()}</div>`;
  finSearch = '';
  finFiltro = 'todos';
  if (finTab === 'pagar')   renderContasPagar();
  else if (finTab === 'receber') renderContasReceber();
  else if (finTab === 'funcionarios') renderFinFuncionarios();
  else renderFinanceiroResumo();
}

async function renderFinFuncionarios() {
  const el = document.getElementById('finConteudo');
  if (!el) return;
  try {
    const hoje = new Date();
    const mesAtual  = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}`;
    const mesFiltro = funcMes || mesAtual;

    const contasPagar = await getAll('contas_pagar');
    const doMes = contasPagar.filter(c => c.fornecedor && c.fornecedor !== 'Benetextil' && c.vencimento && c.vencimento.startsWith(mesFiltro));

    const porFunc = {};
    doMes.forEach(c => {
      const nome = c.fornecedor;
      if (!porFunc[nome]) porFunc[nome] = { pendente: 0, pago: 0, itens: [] };
      const val = parseFloat(c.valor)||0;
      porFunc[nome][c.status==='pago'?'pago':'pendente'] += val;
      porFunc[nome].itens.push(c);
    });

    const nomes = Object.keys(porFunc).sort();
    const totalPendente = nomes.reduce((s,n)=>s+porFunc[n].pendente,0);
    const totalPago     = nomes.reduce((s,n)=>s+porFunc[n].pago,0);

    const meses = [];
    for (let i=0;i<12;i++) { const d=new Date(hoje.getFullYear(),hoje.getMonth()-i,1); meses.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }

    el.innerHTML = `
    <div class="d-flex align-items-center gap-3 mb-4 flex-wrap">
      <h5 class="mb-0"><i class="fas fa-users me-2 text-primary"></i>Folha de Pagamento</h5>
      <select class="form-select form-select-sm" style="max-width:200px" onchange="funcMes=this.value;renderFinFuncionarios()">
        ${meses.map(m=>`<option value="${m}" ${m===mesFiltro?'selected':''}>${new Date(m+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</option>`).join('')}
      </select>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-sm-4"><div class="p-3 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626">
        <div class="small text-muted">A Pagar este mês</div><div class="fs-5 fw-bold text-danger">${fmtMoney(totalPendente)}</div></div></div>
      <div class="col-sm-4"><div class="p-3 rounded text-center" style="background:#d1fae5;border:1px solid #10b981">
        <div class="small text-muted">Já Pago este mês</div><div class="fs-5 fw-bold text-success">${fmtMoney(totalPago)}</div></div></div>
      <div class="col-sm-4"><div class="p-3 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee">
        <div class="small text-muted">Funcionário(s)</div><div class="fs-5 fw-bold text-primary">${nomes.length}</div></div></div>
    </div>

    ${nomes.length === 0 ? `<div class="alert alert-info">Nenhum lançamento encontrado para este mês. Os lançamentos são criados automaticamente ao salvar pedidos de uniforme, sublimação, etc.</div>` :
      nomes.map(nome => {
        const f = porFunc[nome];
        const total = f.pendente + f.pago;
        const pct = total > 0 ? Math.round((f.pago/total)*100) : 0;
        return `
        <div class="card mb-3">
          <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <div style="width:36px;height:36px;border-radius:50%;background:#4361ee22;display:flex;align-items:center;justify-content:center">
                <i class="fas fa-user text-primary"></i>
              </div>
              <div>
                <div class="fw-bold">${escHtml(nome)}</div>
                <small class="text-muted">${f.itens.length} lançamento(s) no mês</small>
              </div>
            </div>
            <div class="text-end">
              <div class="fw-bold fs-5 ${f.pendente>0?'text-danger':'text-success'}">${fmtMoney(f.pendente > 0 ? f.pendente : f.pago)}</div>
              <small class="${f.pendente>0?'text-danger':'text-success'}">${f.pendente>0?'A pagar':'Pago'}</small>
            </div>
          </div>
          <div class="card-body pt-2 pb-2">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="progress flex-grow-1" style="height:8px">
                <div class="progress-bar bg-success" style="width:${pct}%"></div>
              </div>
              <small class="text-muted">${pct}% pago</small>
            </div>
            <div class="table-responsive">
              <table class="table table-sm mb-0">
                <thead><tr><th>Descrição</th><th class="text-end">Valor</th><th class="text-center">Status</th><th class="text-center">Ação</th></tr></thead>
                <tbody>
                ${f.itens.map(it=>`<tr>
                  <td><small>${escHtml(it.descricao||'')}</small></td>
                  <td class="text-end fw-semibold">${fmtMoney(it.valor)}</td>
                  <td class="text-center"><span class="badge ${it.status==='pago'?'bg-success':'bg-warning text-dark'}">${it.status==='pago'?'Pago':'Pendente'}</span></td>
                  <td class="text-center">
                    ${it.status!=='pago'?`<button class="btn btn-xs btn-success btn-sm py-0 px-2" onclick="baixarFuncionario(${it.id})"><i class="fas fa-check me-1"></i>Pagar</button>`
                    :`<span class="text-success"><i class="fas fa-check-double"></i></span>`}
                  </td>
                </tr>`).join('')}
                </tbody>
                <tfoot><tr class="table-light">
                  <td><strong>Total</strong></td>
                  <td class="text-end fw-bold">${fmtMoney(total)}</td>
                  <td colspan="2"></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
        </div>`;
      }).join('')
    }`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function baixarFuncionario(id) {
  if (!confirm('Confirmar pagamento?')) return;
  await update('contas_pagar', id, {status:'pago'});
  toast('Pagamento registrado!');
  renderFinFuncionarios();
}

async function renderContasPagar(search, filtro) {
  if (search !== undefined) finSearch = search;
  if (filtro !== undefined) finFiltro = filtro;
  const el = document.getElementById('finConteudo');
  if (!el) return;
  try {
    let dados = await getAll('contas_pagar');
    if (finSearch) dados = dados.filter(c => (c.descricao+' '+c.fornecedor).toLowerCase().includes(finSearch.toLowerCase()));
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    if (finFiltro === 'pendente') dados = dados.filter(c => c.status === 'pendente');
    if (finFiltro === 'pago')    dados = dados.filter(c => c.status === 'pago');
    if (finFiltro === 'atrasado') dados = dados.filter(c => c.status==='pendente' && c.vencimento && new Date(c.vencimento+'T00:00:00') < hoje);
    dados = dados.slice().reverse();

    const totalPendente = dados.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalPago     = dados.filter(c=>c.status==='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);

    el.innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626"><div class="small text-muted">Pendente</div><strong class="text-danger">${fmtMoney(totalPendente)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">Pago</div><strong class="text-success">${fmtMoney(totalPago)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee"><div class="small text-muted">Total</div><strong class="text-primary">${fmtMoney(totalPendente+totalPago)}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1 flex-wrap">
          ${['todos','pendente','pago','atrasado'].map(f=>`<button class="btn btn-sm ${finFiltro===f?'btn-primary':'btn-outline-secondary'}" onclick="renderContasPagar(undefined,'${f}')">${f==='todos'?'Todos':f==='pendente'?'Pendente':f==='pago'?'Pagos':'Atrasados'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(finSearch)}" oninput="renderContasPagar(this.value)">
            <button class="btn btn-outline-secondary" onclick="renderContasPagar('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-danger btn-sm" onclick="formContaPagar()"><i class="fas fa-plus me-1"></i>Nova Conta</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Fornecedor</th><th>Vencimento</th>
              <th>Valor</th><th>Status</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(c => {
              const venc = c.vencimento ? new Date(c.vencimento+'T00:00:00') : null;
              const atrasado = venc && venc < hoje && c.status !== 'pago';
              return `<tr class="${atrasado?'table-danger':''}">
                <td class="ps-3 fw-semibold">${escHtml((c.descricao||'—').slice(0,45))}</td>
                <td>${escHtml(c.fornecedor||'—')}</td>
                <td class="${atrasado?'text-danger fw-bold':''}">${fmtDate(c.vencimento)}${atrasado?' ⚠️':''}</td>
                <td class="fw-bold text-danger">${fmtMoney(c.valor)}</td>
                <td>${badgeStatus(c.status)}</td>
                <td class="text-end pe-3">
                  ${c.status!=='pago'?`<button class="btn btn-icon btn-outline-success btn-sm" title="Pagar" onclick="pagarConta('pagar',${c.id})"><i class="fas fa-check"></i></button>`:''}
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formContaPagar(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delContaFin('pagar',${c.id},'${escHtml(c.descricao||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('file-invoice-dollar','Nenhuma conta a pagar')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderContasReceber(search, filtro) {
  if (search !== undefined) finSearch = search;
  if (filtro !== undefined) finFiltro = filtro;
  const el = document.getElementById('finConteudo');
  if (!el) return;
  try {
    let dados = await getAll('contas_receber');
    if (finSearch) dados = dados.filter(c => (c.descricao+' '+c.cliente).toLowerCase().includes(finSearch.toLowerCase()));
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    if (finFiltro === 'pendente') dados = dados.filter(c => c.status === 'pendente');
    if (finFiltro === 'pago')    dados = dados.filter(c => c.status === 'pago');
    if (finFiltro === 'atrasado') dados = dados.filter(c => c.status==='pendente' && c.vencimento && new Date(c.vencimento+'T00:00:00') < hoje);
    dados = dados.slice().reverse();

    const totalPendente = dados.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalRecebido = dados.filter(c=>c.status==='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);

    el.innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#fff3cd;border:1px solid #ffc107"><div class="small text-muted">A Receber</div><strong class="text-warning">${fmtMoney(totalPendente)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">Recebido</div><strong class="text-success">${fmtMoney(totalRecebido)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee"><div class="small text-muted">Total</div><strong class="text-primary">${fmtMoney(totalPendente+totalRecebido)}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1 flex-wrap">
          ${['todos','pendente','pago','atrasado'].map(f=>`<button class="btn btn-sm ${finFiltro===f?'btn-primary':'btn-outline-secondary'}" onclick="renderContasReceber(undefined,'${f}')">${f==='todos'?'Todos':f==='pendente'?'Pendente':f==='pago'?'Recebidos':'Atrasados'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(finSearch)}" oninput="renderContasReceber(this.value)">
            <button class="btn btn-outline-secondary" onclick="renderContasReceber('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-success btn-sm" onclick="formContaReceber()"><i class="fas fa-plus me-1"></i>Nova</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Cliente</th><th>Vencimento</th>
              <th>Valor</th><th>Status</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(c => {
              const venc = c.vencimento ? new Date(c.vencimento+'T00:00:00') : null;
              const hoje2 = new Date(); hoje2.setHours(0,0,0,0);
              const atrasado = venc && venc < hoje2 && c.status !== 'pago';
              return `<tr class="${atrasado?'table-warning':''}">
                <td class="ps-3 fw-semibold">${escHtml((c.descricao||'—').slice(0,45))}</td>
                <td>${escHtml(c.cliente||'—')}</td>
                <td class="${atrasado?'text-warning fw-bold':''}">${fmtDate(c.vencimento)}${atrasado?' ⚠️':''}</td>
                <td class="fw-bold text-success">${fmtMoney(c.valor)}</td>
                <td>${badgeStatus(c.status)}</td>
                <td class="text-end pe-3">
                  ${c.status!=='pago'?`<button class="btn btn-icon btn-outline-success btn-sm" title="Recebido" onclick="pagarConta('receber',${c.id})"><i class="fas fa-check"></i></button>`:''}
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formContaReceber(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delContaFin('receber',${c.id},'${escHtml(c.descricao||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('hand-holding-usd','Nenhuma conta a receber')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderFinanceiroResumo() {
  const el = document.getElementById('finConteudo');
  if (!el) return;
  try {
    const [pagar, receber, vendas] = await Promise.all([getAll('contas_pagar'), getAll('contas_receber'), getAll('vendas')]);
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const meses = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
      const mes = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'});
      const entrada = receber.filter(c=>c.status==='pago'&&c.vencimento&&c.vencimento.startsWith(mes)).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
      const saida   = pagar.filter(c=>c.status==='pago'&&c.vencimento&&c.vencimento.startsWith(mes)).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
      meses.push({ label, entrada, saida, saldo: entrada - saida });
    }
    const totPagar   = pagar.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totReceber = receber.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const atrasadoP  = pagar.filter(c=>c.status==='pendente'&&c.vencimento&&new Date(c.vencimento+'T00:00:00')<hoje).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const atrasadoR  = receber.filter(c=>c.status==='pendente'&&c.vencimento&&new Date(c.vencimento+'T00:00:00')<hoje).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);

    el.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="p-3 rounded text-center" style="background:#fee2e2;border:2px solid #dc2626">
          <div class="small text-muted fw-semibold">CONTAS A PAGAR</div>
          <div class="fs-4 fw-bold text-danger">${fmtMoney(totPagar)}</div>
          ${atrasadoP>0?`<div class="small text-danger mt-1">⚠️ ${fmtMoney(atrasadoP)} vencido</div>`:''}
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="p-3 rounded text-center" style="background:#d1fae5;border:2px solid #10b981">
          <div class="small text-muted fw-semibold">A RECEBER</div>
          <div class="fs-4 fw-bold text-success">${fmtMoney(totReceber)}</div>
          ${atrasadoR>0?`<div class="small text-warning mt-1">⚠️ ${fmtMoney(atrasadoR)} em atraso</div>`:''}
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="p-3 rounded text-center" style="background:${(totReceber-totPagar)>=0?'#eef2ff':'#fee2e2'};border:2px solid ${(totReceber-totPagar)>=0?'#4361ee':'#dc2626'}">
          <div class="small text-muted fw-semibold">SALDO PROJETADO</div>
          <div class="fs-4 fw-bold ${(totReceber-totPagar)>=0?'text-primary':'text-danger'}">${fmtMoney(totReceber-totPagar)}</div>
        </div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="p-3 rounded text-center" style="background:#fff3cd;border:2px solid #ffc107">
          <div class="small text-muted fw-semibold">VENDAS (PDV)</div>
          <div class="fs-4 fw-bold text-warning">${fmtMoney(vendas.filter(v=>v.status==='fechada').reduce((s,v)=>s+(parseFloat(v.total)||0),0))}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><i class="fas fa-chart-bar text-primary me-2"></i><strong>Fluxo dos Últimos 6 Meses</strong></div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>Mês</th><th>Recebido</th><th>Pago</th><th>Saldo</th></tr></thead>
            <tbody>
            ${meses.map(m=>`<tr>
              <td class="fw-semibold">${m.label}</td>
              <td class="text-success">${fmtMoney(m.entrada)}</td>
              <td class="text-danger">${fmtMoney(m.saida)}</td>
              <td class="fw-bold ${m.saldo>=0?'text-success':'text-danger'}">${fmtMoney(m.saldo)}</td>
            </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

function formContaPagar(c={}) {
  openModal('<i class="fas fa-file-invoice-dollar me-2 text-danger"></i>Conta a Pagar',
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="fpDesc" value="${escHtml(c.descricao||'')}" placeholder="Ex: Fatura de energia..."></div>
    <div class="col-md-6"><label class="form-label">FORNECEDOR</label>
      <input class="form-control" id="fpForn" value="${escHtml(c.fornecedor||'')}"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">VENCIMENTO</label>
      <input type="date" class="form-control" id="fpVenc" value="${escHtml(c.vencimento||localDateStr())}"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">VALOR (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="fpValor" step="0.01" min="0" value="${c.valor||''}"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">STATUS</label>
      <select class="form-select" id="fpStatus">
        <option value="pendente" ${c.status==='pendente'||!c.status?'selected':''}>Pendente</option>
        <option value="pago" ${c.status==='pago'?'selected':''}>Pago</option>
      </select></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="fpObs" rows="2">${escHtml(c.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-danger" onclick="salvarContaFin('pagar',${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Salvar'}</button>`
  );
}

function formContaReceber(c={}) {
  openModal('<i class="fas fa-hand-holding-usd me-2 text-success"></i>Conta a Receber',
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="frDesc" value="${escHtml(c.descricao||'')}" placeholder="Ex: Pedido uniforme..."></div>
    <div class="col-md-6"><label class="form-label">CLIENTE</label>
      <input class="form-control" id="frCliente" value="${escHtml(c.cliente||'')}"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">VENCIMENTO</label>
      <input type="date" class="form-control" id="frVenc" value="${escHtml(c.vencimento||localDateStr())}"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">VALOR (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="frValor" step="0.01" min="0" value="${c.valor||''}"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">STATUS</label>
      <select class="form-select" id="frStatus">
        <option value="pendente" ${c.status==='pendente'||!c.status?'selected':''}>Pendente</option>
        <option value="pago" ${c.status==='pago'?'selected':''}>Recebido</option>
      </select></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="frObs" rows="2">${escHtml(c.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-success" onclick="salvarContaFin('receber',${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Salvar'}</button>`
  );
}

async function salvarContaFin(tipo, id) {
  const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
  const pref  = tipo === 'pagar' ? 'fp' : 'fr';
  const desc  = document.getElementById(`${pref}Desc`).value.trim();
  if (!desc) { toast('Descrição obrigatória','danger'); return; }
  const obj = {
    descricao:  desc,
    vencimento: document.getElementById(`${pref}Venc`).value || null,
    valor:      parseFloat(document.getElementById(`${pref}Valor`).value)||0,
    status:     document.getElementById(`${pref}Status`).value,
    observacao: document.getElementById(`${pref}Obs`).value.trim(),
    ativo: 1
  };
  if (tipo === 'pagar') obj.fornecedor = document.getElementById('fpForn').value.trim();
  else                  obj.cliente    = document.getElementById('frCliente').value.trim();
  try {
    if (id) { await update(table,id,obj); toast('Atualizado!'); }
    else    { await insert(table,obj);    toast('Salvo!'); }
    closeModal();
    if (tipo==='pagar') { finTab='pagar'; renderFinanceiro('pagar'); }
    else                { finTab='receber'; renderFinanceiro('receber'); }
  } catch(e) { toast(e.message,'danger'); }
}

async function pagarConta(tipo, id) {
  const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
  const msg   = tipo === 'pagar' ? 'Marcar como pago?' : 'Marcar como recebido?';
  if (!confirm(msg)) return;
  await update(table, id, { status: 'pago', data_pag: localDateStr() });
  toast('Status atualizado!');
  if (tipo==='pagar') renderContasPagar();
  else renderContasReceber();
}

async function delContaFin(tipo, id, desc) {
  const table = tipo === 'pagar' ? 'contas_pagar' : 'contas_receber';
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove(table, id); toast('Removido.');
  if (tipo==='pagar') renderContasPagar();
  else renderContasReceber();
}
