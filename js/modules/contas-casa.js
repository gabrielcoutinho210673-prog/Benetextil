'use strict';
let contasCasaSearch = '';
let contasCasaFiltro = 'todos';

async function renderContasCasa(filtro) {
  if (filtro !== undefined) contasCasaFiltro = filtro;
  document.getElementById('pageTitle').textContent = 'Contas da Casa';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    let dados = await getAll('contas_casa');
    if (contasCasaSearch) dados = dados.filter(r => (r.descricao+' '+r.categoria+' '+r.fornecedor).toLowerCase().includes(contasCasaSearch.toLowerCase()));
    if (contasCasaFiltro === 'pago')    dados = dados.filter(r => r.status === 'pago');
    if (contasCasaFiltro === 'pendente') dados = dados.filter(r => r.status !== 'pago');
    const total   = dados.reduce((s,r) => s+(parseFloat(r.valor)||0),0);
    const pagos   = dados.filter(r=>r.status==='pago').reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
    const pendente= dados.filter(r=>r.status!=='pago').reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee"><div class="small text-muted">Total</div><strong class="text-primary">${fmtMoney(total)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">Pagos</div><strong class="text-success">${fmtMoney(pagos)}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626"><div class="small text-muted">Pendente</div><strong class="text-danger">${fmtMoney(pendente)}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1">
          ${['todos','pendente','pago'].map(f=>`<button class="btn btn-sm ${contasCasaFiltro===f?'btn-primary':'btn-outline-secondary'}" onclick="renderContasCasa('${f}')">${f==='todos'?'Todos':f==='pendente'?'Pendente':'Pagos'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(contasCasaSearch)}" oninput="contasCasaSearch=this.value;renderContasCasa()">
            <button class="btn btn-outline-secondary" onclick="contasCasaSearch='';renderContasCasa()"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formContasCasa()"><i class="fas fa-plus me-1"></i>Nova</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Categoria</th><th>Vencimento</th>
              <th>Valor</th><th>Status</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => {
              const venc = r.vencimento ? new Date(r.vencimento+'T00:00:00') : null;
              const atrasado = venc && venc < hoje && r.status !== 'pago';
              return `<tr class="${atrasado?'table-danger':''}">
                <td class="ps-3 fw-semibold">${escHtml(r.descricao||'—')}</td>
                <td><span class="badge bg-secondary">${escHtml(r.categoria||'—')}</span></td>
                <td class="${atrasado?'text-danger fw-bold':''}">${fmtDate(r.vencimento)}${atrasado?' ⚠️':''}</td>
                <td class="fw-bold">${fmtMoney(r.valor)}</td>
                <td>${badgeStatus(r.status)}</td>
                <td class="text-end pe-3">
                  ${r.status !== 'pago' ? `<button class="btn btn-icon btn-outline-success btn-sm" title="Marcar como pago" onclick="pagarContaCasa(${r.id})"><i class="fas fa-check"></i></button>` : ''}
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formContasCasa(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delContasCasa(${r.id},'${escHtml(r.descricao||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('home','Nenhuma conta da casa')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formContasCasa(r={}) {
  const categorias = ['Aluguel','Água','Energia','Internet','Telefone','Alimentação','Combustível','Manutenção','Imposto','Outro'];
  openModal(`<i class="fas fa-home me-2"></i>${r.id?'Editar':'Nova'} Conta da Casa`,
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="ccasaDesc" value="${escHtml(r.descricao||'')}" placeholder="Ex: Conta de luz de julho..."></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <select class="form-select" id="ccasaCat">
        ${categorias.map(c=>`<option value="${c}" ${r.categoria===c?'selected':''}>${c}</option>`).join('')}
      </select></div>
    <div class="col-md-6"><label class="form-label">FORNECEDOR / EMPRESA</label>
      <input class="form-control" id="ccasaForn" value="${escHtml(r.fornecedor||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">VENCIMENTO</label>
      <input type="date" class="form-control" id="ccasaVenc" value="${escHtml(r.vencimento||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">VALOR (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="ccasaValor" step="0.01" min="0" value="${r.valor||''}"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">STATUS</label>
      <select class="form-select" id="ccasaStatus">
        <option value="pendente" ${r.status==='pendente'||!r.status?'selected':''}>Pendente</option>
        <option value="pago" ${r.status==='pago'?'selected':''}>Pago</option>
      </select></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="ccasaObs" rows="2">${escHtml(r.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarContasCasa(${r.id||0})"><i class="fas fa-save me-1"></i>${r.id?'Atualizar':'Salvar'}</button>`
  );
}

async function salvarContasCasa(id) {
  const descricao = document.getElementById('ccasaDesc').value.trim();
  if (!descricao) { toast('Descrição obrigatória','danger'); return; }
  const obj = {
    descricao,
    categoria:  document.getElementById('ccasaCat').value,
    fornecedor: document.getElementById('ccasaForn').value.trim(),
    vencimento: document.getElementById('ccasaVenc').value || null,
    valor:      parseFloat(document.getElementById('ccasaValor').value)||0,
    status:     document.getElementById('ccasaStatus').value,
    observacao: document.getElementById('ccasaObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('contas_casa',id,obj); toast('Conta atualizada!'); }
    else    { await insert('contas_casa',obj);    toast('Conta registrada!'); }
    closeModal(); renderContasCasa();
  } catch(e) { toast(e.message,'danger'); }
}

async function pagarContaCasa(id) {
  if (!confirm('Marcar como pago?')) return;
  await update('contas_casa', id, { status: 'pago' });
  toast('Conta marcada como paga!'); renderContasCasa();
}

async function delContasCasa(id, desc) {
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove('contas_casa',id); toast('Removida.'); renderContasCasa();
}
