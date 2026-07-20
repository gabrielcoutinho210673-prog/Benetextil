'use strict';
let kardexSearch = '';
let kardexTipo   = 'todos';

async function renderKardex(tipo) {
  if (tipo !== undefined) kardexTipo = tipo;
  document.getElementById('pageTitle').textContent = 'Kardex — Movimentação de Estoque';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const [movs, produtos] = await Promise.all([getAll('kardex'), getAll('produtos')]);
    let dados = movs;
    if (kardexSearch) dados = dados.filter(m => (m.produto_nome+' '+m.obs+' '+m.tipo).toLowerCase().includes(kardexSearch.toLowerCase()));
    if (kardexTipo !== 'todos') dados = dados.filter(m => m.tipo === kardexTipo);
    dados = dados.slice().reverse();

    const totalEntradas = dados.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+(parseFloat(m.qtd)||0),0);
    const totalSaidas   = dados.filter(m=>m.tipo==='saida').reduce((s,m)=>s+(parseFloat(m.qtd)||0),0);

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">Entradas</div><strong class="text-success">${totalEntradas.toLocaleString('pt-BR')}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626"><div class="small text-muted">Saídas</div><strong class="text-danger">${totalSaidas.toLocaleString('pt-BR')}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee"><div class="small text-muted">Saldo</div><strong class="text-primary">${(totalEntradas-totalSaidas).toLocaleString('pt-BR')}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1">
          ${['todos','entrada','saida','ajuste'].map(t=>`<button class="btn btn-sm ${kardexTipo===t?'btn-primary':'btn-outline-secondary'}" onclick="renderKardex('${t}')">${t==='todos'?'Todos':t==='entrada'?'Entradas':t==='saida'?'Saídas':'Ajustes'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(kardexSearch)}" oninput="kardexSearch=this.value;renderKardex()">
            <button class="btn btn-outline-secondary" onclick="kardexSearch='';renderKardex()"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formKardex(${JSON.stringify(produtos).replace(/'/g,'&#39;')})"><i class="fas fa-plus me-1"></i>Lançar</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Produto</th><th>Tipo</th><th>Qtd</th><th>Data</th><th>Observação</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(m => `<tr>
              <td class="ps-3 fw-semibold">${escHtml(m.produto_nome||'—')}</td>
              <td><span class="badge ${m.tipo==='entrada'?'bg-success':m.tipo==='saida'?'bg-danger':'bg-warning text-dark'}">${m.tipo==='entrada'?'Entrada':m.tipo==='saida'?'Saída':'Ajuste'}</span></td>
              <td class="fw-bold ${m.tipo==='entrada'?'text-success':m.tipo==='saida'?'text-danger':''}">${m.tipo==='saida'?'−':'+'}${parseFloat(m.qtd)||0}</td>
              <td><small>${fmtDate(m.data)}</small></td>
              <td><small class="text-muted">${escHtml((m.obs||'').slice(0,40))}</small></td>
              <td class="text-end pe-3">
                <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delKardex(${m.id})"><i class="fas fa-trash"></i></button>
              </td></tr>`).join('')
            : emptyState('warehouse','Nenhuma movimentação registrada')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formKardex(produtos) {
  openModal('<i class="fas fa-warehouse me-2"></i>Lançar Movimentação de Estoque',
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">PRODUTO *</label>
      <select class="form-select" id="kardexProd">
        <option value="">Selecione um produto...</option>
        ${produtos.map(p=>`<option value="${p.id}" data-nome="${escHtml(p.nome||'')}">${escHtml(p.nome||'')}${p.codigo?' ['+escHtml(p.codigo)+']':''} — Estoque: ${parseFloat(p.estoque_atual)||0} ${p.unidade||'un'}</option>`).join('')}
      </select></div>
    <div class="col-md-4"><label class="form-label fw-semibold">TIPO *</label>
      <select class="form-select" id="kardexTipoSel">
        <option value="entrada">Entrada</option>
        <option value="saida">Saída</option>
        <option value="ajuste">Ajuste</option>
      </select></div>
    <div class="col-md-4"><label class="form-label fw-semibold">QUANTIDADE *</label>
      <input type="number" class="form-control" id="kardexQtd" step="0.01" min="0.01" placeholder="0"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">DATA</label>
      <input type="date" class="form-control" id="kardexData" value="${localDateStr()}"></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <input class="form-control" id="kardexObs" placeholder="Ex: Compra NF 001, Venda, Inventário..."></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarKardex()"><i class="fas fa-save me-1"></i>Lançar</button>`
  );
}

async function salvarKardex() {
  const sel   = document.getElementById('kardexProd');
  const id    = parseInt(sel.value)||0;
  const nome  = sel.options[sel.selectedIndex]?.getAttribute('data-nome') || '';
  const tipo  = document.getElementById('kardexTipoSel').value;
  const qtd   = parseFloat(document.getElementById('kardexQtd').value)||0;
  const data  = document.getElementById('kardexData').value;
  const obs   = document.getElementById('kardexObs').value.trim();
  if (!id)  { toast('Selecione um produto','danger'); return; }
  if (!qtd) { toast('Quantidade obrigatória','danger'); return; }
  try {
    await insert('kardex', { produto_id:id, produto_nome:nome, tipo, qtd, data, obs, ativo:1 });
    const prods = await getAll('produtos');
    const p = prods.find(x=>x.id===id);
    if (p) {
      let novoEst = parseFloat(p.estoque_atual)||0;
      if (tipo==='entrada') novoEst += qtd;
      else if (tipo==='saida') novoEst = Math.max(0, novoEst - qtd);
      else novoEst = qtd;
      await update('produtos', id, { estoque_atual: novoEst });
    }
    Cache.clear('kardex'); Cache.clear('produtos');
    toast('Lançamento registrado!'); closeModal(); renderKardex();
  } catch(e) { toast(e.message,'danger'); }
}

async function delKardex(id) {
  if (!confirm('Remover este lançamento?')) return;
  await remove('kardex', id); Cache.clear('kardex'); toast('Removido.'); renderKardex();
}
