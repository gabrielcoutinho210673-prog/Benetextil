'use strict';
let construcaoSearch = '';
let construcaoFiltro = 'todos';

async function renderConstrucao(filtro) {
  if (filtro !== undefined) construcaoFiltro = filtro;
  document.getElementById('pageTitle').textContent = 'Construção';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    let dados = await getAll('construcao');
    if (construcaoSearch) dados = dados.filter(r => (r.descricao+' '+r.categoria+' '+r.fornecedor).toLowerCase().includes(construcaoSearch.toLowerCase()));
    if (construcaoFiltro === 'pago')     dados = dados.filter(r => r.status === 'pago');
    if (construcaoFiltro === 'pendente') dados = dados.filter(r => r.status !== 'pago');
    const total    = dados.reduce((s,r) => s+(parseFloat(r.valor)||0),0);
    const pagos    = dados.filter(r=>r.status==='pago').reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
    const pendente = dados.filter(r=>r.status!=='pago').reduce((s,r)=>s+(parseFloat(r.valor)||0),0);
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    document.getElementById('pageContent').innerHTML = `
    <div class="card mb-3" style="background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff">
      <div class="card-body d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex align-items-center gap-3">
          <i class="fas fa-hard-hat fa-2x opacity-75"></i>
          <div>
            <div class="small text-uppercase opacity-75">Gasto Total da Obra</div>
            <div class="fs-3 fw-bold">${fmtMoney(total)}</div>
          </div>
        </div>
        <div class="d-flex gap-4">
          <div class="text-end"><div class="small opacity-75">Pago</div><strong>${fmtMoney(pagos)}</strong></div>
          <div class="text-end"><div class="small opacity-75">Pendente</div><strong>${fmtMoney(pendente)}</strong></div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1">
          ${['todos','pendente','pago'].map(f=>`<button class="btn btn-sm ${construcaoFiltro===f?'btn-primary':'btn-outline-secondary'}" onclick="renderConstrucao('${f}')">${f==='todos'?'Todos':f==='pendente'?'Pendente':'Pagos'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(construcaoSearch)}" oninput="construcaoSearch=this.value;renderConstrucao()">
            <button class="btn btn-outline-secondary" onclick="construcaoSearch='';renderConstrucao()"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formConstrucao()"><i class="fas fa-plus me-1"></i>Novo Gasto</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Categoria</th><th>Fornecedor</th><th>Vencimento</th>
              <th>Valor</th><th>Status</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => {
              const venc = r.vencimento ? new Date(r.vencimento+'T00:00:00') : null;
              const atrasado = venc && venc < hoje && r.status !== 'pago';
              return `<tr class="${atrasado?'table-danger':''}">
                <td class="ps-3 fw-semibold">${escHtml(r.descricao||'—')}</td>
                <td><span class="badge bg-secondary">${escHtml(r.categoria||'—')}</span></td>
                <td>${escHtml(r.fornecedor||'—')}</td>
                <td class="${atrasado?'text-danger fw-bold':''}">${fmtDate(r.vencimento)}${atrasado?' ⚠️':''}</td>
                <td class="fw-bold">${fmtMoney(r.valor)}</td>
                <td>${badgeStatus(r.status)}</td>
                <td class="text-end pe-3">
                  ${r.status !== 'pago' ? `<button class="btn btn-icon btn-outline-success btn-sm" title="Marcar como pago" onclick="pagarConstrucao(${r.id})"><i class="fas fa-check"></i></button>` : ''}
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formConstrucao(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delConstrucao(${r.id},'${escHtml(r.descricao||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('hard-hat','Nenhum gasto de obra registrado')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formConstrucao(r={}) {
  const categorias = ['Material','Mão de Obra','Elétrica','Hidráulica','Pintura','Aluguel de Equipamento','Transporte','Projeto/Engenharia','Outro'];
  openModal(`<i class="fas fa-hard-hat me-2"></i>${r.id?'Editar':'Novo'} Gasto da Obra`,
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="construcaoDesc" value="${escHtml(r.descricao||'')}" placeholder="Ex: Compra de cimento, Pedreiro..."></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <select class="form-select" id="construcaoCat">
        ${categorias.map(c=>`<option value="${c}" ${r.categoria===c?'selected':''}>${c}</option>`).join('')}
      </select></div>
    <div class="col-md-6"><label class="form-label">FORNECEDOR / PROFISSIONAL</label>
      <input class="form-control" id="construcaoForn" value="${escHtml(r.fornecedor||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">VENCIMENTO</label>
      <input type="date" class="form-control" id="construcaoVenc" value="${escHtml(r.vencimento||localDateStr())}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">VALOR (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="construcaoValor" step="0.01" min="0" value="${r.valor||''}"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">STATUS</label>
      <select class="form-select" id="construcaoStatus">
        <option value="pendente" ${r.status==='pendente'||!r.status?'selected':''}>Pendente</option>
        <option value="pago" ${r.status==='pago'?'selected':''}>Pago</option>
      </select></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="construcaoObs" rows="2">${escHtml(r.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarConstrucao(${r.id||0})"><i class="fas fa-save me-1"></i>${r.id?'Atualizar':'Salvar'}</button>`
  );
}

async function salvarConstrucao(id) {
  const descricao = document.getElementById('construcaoDesc').value.trim();
  if (!descricao) { toast('Descrição obrigatória','danger'); return; }
  const obj = {
    descricao,
    categoria:  document.getElementById('construcaoCat').value,
    fornecedor: document.getElementById('construcaoForn').value.trim(),
    vencimento: document.getElementById('construcaoVenc').value || null,
    valor:      parseFloat(document.getElementById('construcaoValor').value)||0,
    status:     document.getElementById('construcaoStatus').value,
    observacao: document.getElementById('construcaoObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('construcao',id,obj); toast('Gasto atualizado!'); }
    else    { await insert('construcao',obj);    toast('Gasto registrado!'); }
    closeModal(); renderConstrucao();
  } catch(e) { toast(e.message,'danger'); }
}

async function pagarConstrucao(id) {
  if (!confirm('Marcar como pago?')) return;
  await update('construcao', id, { status: 'pago' });
  toast('Gasto marcado como pago!'); renderConstrucao();
}

async function delConstrucao(id, desc) {
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove('construcao',id); toast('Removido.'); renderConstrucao();
}
