'use strict';
async function renderFornecedores() {
  document.getElementById('pageTitle').textContent = 'Fornecedores';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const dados = await getAll('fornecedores');
    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0"><i class="fas fa-truck me-2 text-primary"></i>${dados.length} fornecedor(es)</h6>
        <button class="btn btn-primary btn-sm" onclick="formFornecedor()"><i class="fas fa-plus me-1"></i>Novo Fornecedor</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Nome</th><th>CNPJ/CPF</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(f => `<tr>
              <td class="ps-3 fw-semibold">${escHtml(f.nome||'—')}</td>
              <td>${escHtml(f.cnpj||'—')}</td>
              <td>${escHtml(f.telefone||'—')}</td>
              <td>${escHtml(f.email||'—')}</td>
              <td>${escHtml(f.cidade||'—')}</td>
              <td class="text-end pe-3">
                <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formFornecedor(${JSON.stringify(f)})'><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delFornecedor(${f.id},'${escHtml(f.nome||'')}')"><i class="fas fa-trash"></i></button>
              </td></tr>`).join('')
            : emptyState('truck','Nenhum fornecedor cadastrado')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formFornecedor(f={}) {
  openModal(`<i class="fas fa-truck me-2"></i>${f.id?'Editar':'Novo'} Fornecedor`,
  `<div class="row g-3">
    <div class="col-md-8"><label class="form-label fw-semibold">NOME / RAZÃO SOCIAL *</label>
      <input class="form-control" id="fornNome" value="${escHtml(f.nome||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">CNPJ / CPF</label>
      <input class="form-control" id="fornCnpj" value="${escHtml(f.cnpj||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">TELEFONE</label>
      <input class="form-control" id="fornTel" value="${escHtml(f.telefone||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">E-MAIL</label>
      <input type="email" class="form-control" id="fornEmail" value="${escHtml(f.email||'')}"></div>
    <div class="col-md-4"><label class="form-label">CONTATO</label>
      <input class="form-control" id="fornContato" value="${escHtml(f.contato||'')}"></div>
    <div class="col-md-8"><label class="form-label">ENDEREÇO</label>
      <input class="form-control" id="fornEnd" value="${escHtml(f.endereco||'')}"></div>
    <div class="col-md-4"><label class="form-label">CIDADE</label>
      <input class="form-control" id="fornCidade" value="${escHtml(f.cidade||'')}"></div>
    <div class="col-md-2"><label class="form-label">ESTADO</label>
      <input class="form-control" id="fornEstado" maxlength="2" value="${escHtml(f.estado||'')}"></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="fornObs" rows="2">${escHtml(f.observacao||'')}</textarea></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarFornecedor(${f.id||0})"><i class="fas fa-save me-1"></i>${f.id?'Atualizar':'Salvar'}</button>`,
  'lg'
  );
}

async function salvarFornecedor(id) {
  const nome = document.getElementById('fornNome').value.trim();
  if (!nome) { toast('Nome obrigatório','danger'); return; }
  const obj = {
    nome,
    cnpj:       document.getElementById('fornCnpj').value.trim(),
    telefone:   document.getElementById('fornTel').value.trim(),
    email:      document.getElementById('fornEmail').value.trim(),
    contato:    document.getElementById('fornContato').value.trim(),
    endereco:   document.getElementById('fornEnd').value.trim(),
    cidade:     document.getElementById('fornCidade').value.trim(),
    estado:     document.getElementById('fornEstado').value.trim(),
    observacao: document.getElementById('fornObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('fornecedores',id,obj); toast('Fornecedor atualizado!'); }
    else    { await insert('fornecedores',obj);    toast('Fornecedor cadastrado!'); }
    closeModal(); Cache.clear('fornecedores'); renderFornecedores();
  } catch(e) { toast(e.message,'danger'); }
}

async function delFornecedor(id, nome) {
  if (!confirm(`Excluir "${nome}"?`)) return;
  await remove('fornecedores',id); Cache.clear('fornecedores'); toast('Removido.'); renderFornecedores();
}
