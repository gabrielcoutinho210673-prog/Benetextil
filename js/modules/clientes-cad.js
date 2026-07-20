'use strict';
async function renderClientesCad(search) {
  const q = (search||'').toLowerCase();
  document.getElementById('pageTitle').textContent = 'Clientes Cadastrados';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const lista = (await getAll('clientes_cad')).filter(c =>
      !q || c.nome?.toLowerCase().includes(q) || c.cnpj?.includes(q) || c.telefone?.includes(q)
    );
    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex flex-wrap align-items-center gap-2">
        <i class="fas fa-users text-primary"></i><h6 class="mb-0 me-auto">Clientes Cadastrados</h6>
        <div class="input-group" style="max-width:260px">
          <span class="input-group-text"><i class="fas fa-search"></i></span>
          <input class="form-control" placeholder="Buscar cliente..." value="${escHtml(q)}"
            oninput="renderClientesCad(this.value)">
        </div>
        <button class="btn btn-primary btn-sm" onclick="novoClienteCad()">
          <i class="fas fa-plus me-1"></i>Novo Cliente
        </button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead><tr>
            <th>Nome</th><th>CNPJ/CPF</th><th>Telefone</th><th>E-mail</th><th>Cidade</th><th>Ações</th>
          </tr></thead>
          <tbody>
            ${lista.length ? lista.map(c => `
            <tr>
              <td class="fw-semibold">${escHtml(c.nome||'')}</td>
              <td>${escHtml(c.cnpj||'—')}</td>
              <td>${escHtml(c.telefone||'—')}</td>
              <td>${escHtml(c.email||'—')}</td>
              <td>${escHtml(c.cidade||'—')}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editarClienteCad(${c.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="removerClienteCad(${c.id})"><i class="fas fa-trash"></i></button>
              </td>
            </tr>`).join('') : `<tr><td colspan="6" class="text-center text-muted py-5">
              <i class="fas fa-users fa-3x mb-3 d-block opacity-25"></i>Nenhum cliente cadastrado ainda.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>`;
  } catch(e) { document.getElementById('pageContent').innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

function novoClienteCad(c={}) {
  const titulo = c.id ? 'Editar Cliente' : 'Novo Cliente';
  openModal(`<i class="fas fa-user-plus me-2"></i>${titulo}`, `
  <div class="row g-3">
    <div class="col-md-6"><label class="form-label fw-semibold">NOME *</label>
      <input class="form-control" id="ccNome" value="${escHtml(c.nome||'')}"></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CNPJ / CPF</label>
      <input class="form-control" id="ccCnpj" placeholder="00.000.000/0000-00" value="${escHtml(c.cnpj||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">TELEFONE</label>
      <input class="form-control" id="ccTelefone" placeholder="(00) 00000-0000" value="${escHtml(c.telefone||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">E-MAIL</label>
      <input type="email" class="form-control" id="ccEmail" value="${escHtml(c.email||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">CONTATO / RESPONSÁVEL</label>
      <input class="form-control" id="ccContato" value="${escHtml(c.contato||'')}"></div>
    <div class="col-md-8"><label class="form-label fw-semibold">ENDEREÇO</label>
      <input class="form-control" id="ccEndereco" value="${escHtml(c.endereco||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">BAIRRO</label>
      <input class="form-control" id="ccBairro" value="${escHtml(c.bairro||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">CIDADE</label>
      <input class="form-control" id="ccCidade" value="${escHtml(c.cidade||'')}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">ESTADO</label>
      <input class="form-control" id="ccEstado" maxlength="2" placeholder="SP" value="${escHtml(c.estado||'')}"></div>
    <div class="col-md-8"><label class="form-label fw-semibold">INSCRIÇÃO ESTADUAL</label>
      <input class="form-control" id="ccObs" value="${escHtml(c.observacoes||'')}"></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarClienteCad(${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Cadastrar'}</button>`,
  'lg');
}

async function editarClienteCad(id) {
  const lista = await getAll('clientes_cad');
  const c = lista.find(x => x.id === id);
  if (c) novoClienteCad(c);
}

async function salvarClienteCad(id) {
  const nome = document.getElementById('ccNome').value.trim();
  if (!nome) { toast('Nome é obrigatório','danger'); return; }
  const data = {
    nome,
    cnpj:       document.getElementById('ccCnpj').value.trim(),
    telefone:   document.getElementById('ccTelefone').value.trim(),
    email:      document.getElementById('ccEmail').value.trim(),
    contato:    document.getElementById('ccContato').value.trim(),
    endereco:   document.getElementById('ccEndereco').value.trim(),
    bairro:     document.getElementById('ccBairro').value.trim(),
    cidade:     document.getElementById('ccCidade').value.trim(),
    estado:     document.getElementById('ccEstado').value.trim(),
    observacoes:document.getElementById('ccObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) { await update('clientes_cad', id, data); toast('Cliente atualizado!'); }
    else     { await insert('clientes_cad', data);    toast('Cliente cadastrado!'); }
    closeModal(); Cache.clear('clientes_cad'); renderClientesCad();
  } catch(e) { toast(e.message,'danger'); }
}

async function removerClienteCad(id) {
  if (!confirm('Remover este cliente?')) return;
  await remove('clientes_cad', id);
  Cache.clear('clientes_cad');
  toast('Cliente removido.');
  renderClientesCad();
}

async function filtrarClientesCad(q) {
  const lista = document.getElementById('listaClientesCad');
  if (!lista) return;
  if (!q || q.length < 2) { lista.style.display='none'; lista.innerHTML=''; return; }
  try {
    const todos = await getAll('clientes_cad');
    const filtrados = todos.filter(c =>
      c.nome?.toLowerCase().includes(q.toLowerCase()) ||
      c.cnpj?.includes(q) || c.telefone?.includes(q)
    ).slice(0, 8);
    if (!filtrados.length) { lista.style.display='none'; return; }
    lista.innerHTML = filtrados.map(c => `
      <button type="button" class="list-group-item list-group-item-action py-2 px-3" onclick="preencherClienteCad(${c.id})">
        <div class="fw-semibold">${escHtml(c.nome)}</div>
        <small class="text-muted">${[c.cnpj, c.telefone, c.cidade].filter(Boolean).join(' · ')}</small>
      </button>`).join('');
    lista.style.display = 'block';
  } catch(e) {}
}

async function preencherClienteCad(id) {
  const todos = await getAll('clientes_cad');
  const c = todos.find(x => x.id === id);
  if (!c) return;
  const set = (elId, val) => { const el=document.getElementById(elId); if(el) el.value=val||''; };
  set('cNome',     c.nome);
  set('cCpfCnpj',  c.cnpj);
  set('cTel',      c.telefone);
  set('cEnd',      [c.endereco, c.cidade, c.estado].filter(Boolean).join(', '));
  set('buscaClienteCad', c.nome);
  document.getElementById('listaClientesCad').style.display = 'none';
  toast(`Cliente "${c.nome}" carregado!`);
}
