'use strict';
let produtosSearch = '';

async function renderProdutos(search) {
  if (search !== undefined) produtosSearch = search;
  document.getElementById('pageTitle').textContent = 'Estoque de Produtos';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    let dados = await getAll('produtos');
    if (produtosSearch) dados = dados.filter(p => (p.nome+' '+p.codigo+' '+p.categoria).toLowerCase().includes(produtosSearch.toLowerCase()));

    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 class="mb-0"><i class="fas fa-boxes me-2 text-primary"></i>${dados.length} produto(s)</h6>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:240px">
            <input type="text" class="form-control" placeholder="Buscar produto..." value="${escHtml(produtosSearch)}" oninput="renderProdutos(this.value)">
            <button class="btn btn-outline-secondary" onclick="produtosSearch='';renderProdutos('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formProduto()"><i class="fas fa-plus me-1"></i>Novo Produto</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Código</th><th>Nome</th><th>Categoria</th>
              <th>Estoque</th><th>Un.</th><th>Custo</th><th>Preço Venda</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(p => {
              const alerta = (parseFloat(p.estoque_atual)||0) <= (parseFloat(p.estoque_minimo)||0);
              return `<tr class="${alerta?'table-warning':''}">
                <td class="ps-3"><code>${escHtml(p.codigo||'—')}</code></td>
                <td class="fw-semibold">${escHtml(p.nome||'—')}${alerta?' <span class="badge bg-warning text-dark ms-1">Baixo</span>':''}</td>
                <td><span class="badge bg-secondary">${escHtml(p.categoria||'—')}</span></td>
                <td class="fw-bold ${alerta?'text-danger':''}">${parseFloat(p.estoque_atual)||0}</td>
                <td>${escHtml(p.unidade||'un')}</td>
                <td>${p.custo ? fmtMoney(p.custo) : '—'}</td>
                <td class="text-success fw-semibold">${p.preco_venda ? fmtMoney(p.preco_venda) : '—'}</td>
                <td class="text-end pe-3">
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formProduto(${JSON.stringify(p)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delProduto(${p.id},'${escHtml(p.nome||'')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('boxes','Nenhum produto cadastrado')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formProduto(p={}) {
  openModal(`<i class="fas fa-box me-2"></i>${p.id?'Editar':'Novo'} Produto`,
  `<div class="row g-3">
    <div class="col-md-4"><label class="form-label fw-semibold">CÓDIGO</label>
      <input class="form-control" id="pCodigo" value="${escHtml(p.codigo||'')}" placeholder="Ex: PROD001"></div>
    <div class="col-md-8"><label class="form-label fw-semibold">NOME *</label>
      <input class="form-control" id="pNome" value="${escHtml(p.nome||'')}" placeholder="Nome do produto"></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <input class="form-control" id="pCat" value="${escHtml(p.categoria||'')}" list="catsProdList">
      <datalist id="catsProdList"><option value="Tecido"><option value="Aviamento"><option value="Linha"><option value="Botão"><option value="Zíper"><option value="Entretela"><option value="Outro"></datalist></div>
    <div class="col-md-3"><label class="form-label fw-semibold">UNIDADE</label>
      <select class="form-select" id="pUnidade">
        ${['un','m','m²','kg','g','rolo','cx','pc'].map(u=>`<option value="${u}" ${p.unidade===u?'selected':''}>${u}</option>`).join('')}
      </select></div>
    <div class="col-md-3"><label class="form-label fw-semibold">ESTOQUE ATUAL</label>
      <input type="number" class="form-control" id="pEstoqueAtual" step="0.01" min="0" value="${p.estoque_atual||0}"></div>
    <div class="col-md-3"><label class="form-label">ESTOQUE MÍNIMO</label>
      <input type="number" class="form-control" id="pEstoqueMin" step="0.01" min="0" value="${p.estoque_minimo||0}"></div>
    <div class="col-md-3"><label class="form-label">CUSTO (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="pCusto" step="0.01" min="0" value="${p.custo||''}"></div></div>
    <div class="col-md-3"><label class="form-label fw-semibold">PREÇO DE VENDA (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="pPrecoVenda" step="0.01" min="0" value="${p.preco_venda||''}"></div></div>
    <div class="col-md-3"><label class="form-label">LOCALIZAÇÃO</label>
      <input class="form-control" id="pLocal" value="${escHtml(p.localizacao||'')}" placeholder="Ex: Prateleira A-3"></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="pObs" rows="2">${escHtml(p.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarProduto(${p.id||0})"><i class="fas fa-save me-1"></i>${p.id?'Atualizar':'Salvar'}</button>`,
  'lg'
  );
}

async function salvarProduto(id) {
  const nome = document.getElementById('pNome').value.trim();
  if (!nome) { toast('Nome obrigatório','danger'); return; }
  const obj = {
    codigo:         document.getElementById('pCodigo').value.trim(),
    nome,
    categoria:      document.getElementById('pCat').value.trim(),
    unidade:        document.getElementById('pUnidade').value,
    estoque_atual:  parseFloat(document.getElementById('pEstoqueAtual').value)||0,
    estoque_minimo: parseFloat(document.getElementById('pEstoqueMin').value)||0,
    custo:          parseFloat(document.getElementById('pCusto').value)||0,
    preco_venda:    parseFloat(document.getElementById('pPrecoVenda').value)||0,
    localizacao:    document.getElementById('pLocal').value.trim(),
    observacao:     document.getElementById('pObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('produtos',id,obj); toast('Produto atualizado!'); }
    else    { await insert('produtos',obj);    toast('Produto cadastrado!'); }
    closeModal(); Cache.clear('produtos'); renderProdutos();
  } catch(e) { toast(e.message,'danger'); }
}

async function delProduto(id, nome) {
  if (!confirm(`Excluir "${nome}"?`)) return;
  await remove('produtos',id); Cache.clear('produtos'); toast('Produto removido.'); renderProdutos();
}
