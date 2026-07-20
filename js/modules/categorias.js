'use strict';
async function renderCategorias() {
  document.getElementById('pageTitle').textContent = 'Categorias';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const dados = await getAll('categorias');
    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0"><i class="fas fa-tags me-2 text-primary"></i>${dados.length} categoria(s)</h6>
        <button class="btn btn-primary btn-sm" onclick="formCategoria()"><i class="fas fa-plus me-1"></i>Nova Categoria</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Nome</th><th>Descrição</th><th>Tipo</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(c => `<tr>
              <td class="ps-3 fw-semibold"><i class="fas fa-tag text-primary me-2"></i>${escHtml(c.nome||'—')}</td>
              <td class="text-muted">${escHtml((c.descricao||'').slice(0,50))}</td>
              <td>${c.tipo?`<span class="badge bg-info">${escHtml(c.tipo)}</span>`:'—'}</td>
              <td class="text-end pe-3">
                <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formCategoria(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delCategoria(${c.id},'${escHtml(c.nome||'')}')"><i class="fas fa-trash"></i></button>
              </td></tr>`).join('')
            : emptyState('tags','Nenhuma categoria cadastrada')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formCategoria(c={}) {
  openModal(`<i class="fas fa-tag me-2"></i>${c.id?'Editar':'Nova'} Categoria`,
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">NOME *</label>
      <input class="form-control" id="catNome" value="${escHtml(c.nome||'')}" placeholder="Ex: Tecidos, Aviamentos..."></div>
    <div class="col-md-6"><label class="form-label">TIPO</label>
      <select class="form-select" id="catTipo">
        <option value="" ${!c.tipo?'selected':''}>Geral</option>
        <option value="produto" ${c.tipo==='produto'?'selected':''}>Produto</option>
        <option value="servico" ${c.tipo==='servico'?'selected':''}>Serviço</option>
        <option value="despesa" ${c.tipo==='despesa'?'selected':''}>Despesa</option>
      </select></div>
    <div class="col-12"><label class="form-label">DESCRIÇÃO</label>
      <textarea class="form-control" id="catDesc" rows="2">${escHtml(c.descricao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarCategoria(${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Salvar'}</button>`
  );
}

async function salvarCategoria(id) {
  const nome = document.getElementById('catNome').value.trim();
  if (!nome) { toast('Nome obrigatório','danger'); return; }
  const obj = {
    nome,
    tipo:      document.getElementById('catTipo').value,
    descricao: document.getElementById('catDesc').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('categorias',id,obj); toast('Categoria atualizada!'); }
    else    { await insert('categorias',obj);    toast('Categoria criada!'); }
    closeModal(); Cache.clear('categorias'); renderCategorias();
  } catch(e) { toast(e.message,'danger'); }
}

async function delCategoria(id, nome) {
  if (!confirm(`Excluir "${nome}"?`)) return;
  await remove('categorias',id); Cache.clear('categorias'); toast('Removida.'); renderCategorias();
}
