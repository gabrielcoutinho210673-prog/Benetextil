'use strict';
async function renderCaixa() {
  document.getElementById('pageTitle').textContent = 'Caixa';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const [caixas, movs] = await Promise.all([getAll('caixa'), getAll('mov_caixa')]);
    const caixaAberto = caixas.find(c => c.status === 'aberto');
    const movsAtual = caixaAberto ? movs.filter(m => String(m.caixa_id) === String(caixaAberto.id)) : [];

    document.getElementById('pageContent').innerHTML = `
    ${caixaAberto ? `
    <div class="card mb-4" style="border-left:4px solid #10b981">
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div>
            <span class="badge bg-success mb-2"><i class="fas fa-circle me-1" style="font-size:8px"></i>CAIXA ABERTO</span>
            <div class="row g-3 mt-1">
              <div class="col-sm-4"><small class="text-muted d-block">Abertura</small><strong>${fmtDateTime(caixaAberto.data_abertura)}</strong></div>
              <div class="col-sm-4"><small class="text-muted d-block">Valor Inicial</small><strong>${fmtMoney(caixaAberto.valor_abertura)}</strong></div>
              <div class="col-sm-4"><small class="text-muted d-block">Entradas/Suprimentos</small><strong class="text-success">${fmtMoney(movsAtual.filter(m=>['entrada','suprimento'].includes(m.tipo)).reduce((s,m)=>s+(parseFloat(m.valor)||0),0))}</strong></div>
            </div>
          </div>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-outline-warning btn-sm" onclick="movCaixa('sangria',${caixaAberto.id})"><i class="fas fa-minus me-1"></i>Sangria</button>
            <button class="btn btn-outline-success btn-sm" onclick="movCaixa('suprimento',${caixaAberto.id})"><i class="fas fa-plus me-1"></i>Suprimento</button>
            <button class="btn btn-danger btn-sm" onclick="fecharCaixa(${caixaAberto.id})"><i class="fas fa-lock me-1"></i>Fechar Caixa</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><h6 class="mb-0"><i class="fas fa-history me-2"></i>Movimentações</h6></div>
      <div class="card-body p-0">
        <table class="table mb-0">
          <thead><tr><th class="ps-3">Data</th><th>Tipo</th><th>Descrição</th><th class="text-end pe-3">Valor</th></tr></thead>
          <tbody>
          ${movsAtual.length ? movsAtual.slice().reverse().map(m=>{
            const tc = {entrada:'success',saida:'danger',sangria:'warning',suprimento:'info'};
            const positivo = ['entrada','suprimento'].includes(m.tipo);
            return `<tr>
              <td class="ps-3"><small>${fmtDateTime(m.data)}</small></td>
              <td><span class="badge bg-${tc[m.tipo]||'secondary'}">${escHtml(m.tipo)}</span></td>
              <td>${escHtml(m.descricao||'—')}</td>
              <td class="text-end pe-3 fw-semibold ${positivo?'text-success':'text-danger'}">${positivo?'+':'−'} ${fmtMoney(m.valor)}</td>
            </tr>`;
          }).join('') : emptyState('exchange-alt','Nenhuma movimentação neste caixa')}
          </tbody>
        </table>
      </div>
    </div>` : `
    <div class="text-center py-5">
      <i class="fas fa-cash-register fa-5x text-muted opacity-25 mb-4 d-block"></i>
      <h5 class="text-muted">Nenhum caixa aberto</h5>
      <button class="btn btn-success btn-lg mt-3" onclick="abrirCaixa()"><i class="fas fa-lock-open me-2"></i>Abrir Caixa</button>
    </div>`}

    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0"><i class="fas fa-clock me-2"></i>Histórico de Caixas</h6>
        ${!caixaAberto?`<button class="btn btn-success btn-sm" onclick="abrirCaixa()"><i class="fas fa-lock-open me-1"></i>Abrir Caixa</button>`:''}
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr><th class="ps-3">Abertura</th><th>Fechamento</th><th>Valor Inicial</th><th>Valor Final</th><th>Status</th></tr></thead>
            <tbody>
            ${caixas.length ? caixas.slice().reverse().map(c=>`<tr>
              <td class="ps-3">${fmtDateTime(c.data_abertura)}</td>
              <td>${c.data_fechamento?fmtDateTime(c.data_fechamento):'—'}</td>
              <td>${fmtMoney(c.valor_abertura)}</td>
              <td>${c.data_fechamento?fmtMoney(c.valor_fechamento):'—'}</td>
              <td>${badgeStatus(c.status)}</td></tr>`).join('')
            : emptyState('calculator','Nenhum caixa registrado')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function abrirCaixa() {
  openModal('<i class="fas fa-lock-open me-2"></i>Abrir Caixa',
    `<label class="form-label fw-semibold">Valor de Abertura (R$)</label>
     <div class="input-group"><span class="input-group-text">R$</span><input type="number" id="cxAbertura" class="form-control" step="0.01" min="0" value="0.00"></div>`,
    `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
     <button class="btn btn-success" onclick="confirmAbrirCaixa()"><i class="fas fa-check me-1"></i>Abrir</button>`,
    'sm'
  );
}

async function confirmAbrirCaixa() {
  const valor = parseFloat(document.getElementById('cxAbertura').value)||0;
  try {
    await insert('caixa', { data_abertura: new Date().toISOString(), valor_abertura: valor, status: 'aberto', ativo: 1 });
    toast('Caixa aberto!'); closeModal(); Cache.clear('caixa'); renderCaixa();
  } catch(e) { toast(e.message,'danger'); }
}

function movCaixa(tipo, caixaId) {
  openModal(`<i class="fas fa-exchange-alt me-2"></i>${tipo==='sangria'?'Sangria (retirada)':'Suprimento (reforço)'}`,
    `<div class="mb-3"><label class="form-label fw-semibold">Valor (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" id="movValor" class="form-control" step="0.01" min="0.01"></div></div>
     <div><label class="form-label">Descrição</label><input type="text" id="movDesc" class="form-control" placeholder="Motivo..."></div>`,
    `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
     <button class="btn btn-primary" onclick="confirmMovCaixa('${tipo}',${caixaId})"><i class="fas fa-check me-1"></i>Confirmar</button>`,
    'sm'
  );
}

async function confirmMovCaixa(tipo, caixaId) {
  const valor = parseFloat(document.getElementById('movValor').value)||0;
  if (valor <= 0) { toast('Valor inválido','danger'); return; }
  const desc = document.getElementById('movDesc').value.trim();
  try {
    await insert('mov_caixa', { caixa_id: caixaId, tipo, valor, descricao: desc, data: new Date().toISOString(), ativo: 1 });
    toast('Movimentação registrada!'); closeModal(); Cache.clear('mov_caixa'); renderCaixa();
  } catch(e) { toast(e.message,'danger'); }
}

async function fecharCaixa(id) {
  const valor = prompt('Informe o valor contado em caixa (R$):', '0.00');
  if (valor === null) return;
  try {
    await update('caixa', id, { status: 'fechado', data_fechamento: new Date().toISOString(), valor_fechamento: parseFloat(valor)||0 });
    toast('Caixa fechado!'); Cache.clear('caixa'); renderCaixa();
  } catch(e) { toast(e.message,'danger'); }
}
