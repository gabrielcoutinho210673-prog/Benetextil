'use strict';
let salvandoCartao = false;
let salvandoLancCartao = false;
let cartaoAtualId = null;     // qual cartão está com a fatura aberta na tela de detalhe
let faturaSelecionada = null; // 'YYYY-MM' escolhida no detalhe

// ── Lógica de fatura ──────────────────────────────────────────────
// Lançamento no dia do fechamento (ou depois) cai na fatura do mês
// seguinte; antes do fechamento, cai na fatura do mês corrente.
function calcularFatura(dataStr, diaFechamento) {
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  let anoF = ano, mesF = mes;
  if (dia >= diaFechamento) { mesF++; if (mesF > 12) { mesF = 1; anoF++; } }
  return `${anoF}-${String(mesF).padStart(2,'0')}`;
}
function proximaFatura(fatura) {
  let [ano, mes] = fatura.split('-').map(Number);
  mes++; if (mes > 12) { mes = 1; ano++; }
  return `${ano}-${String(mes).padStart(2,'0')}`;
}
function vencimentoDaFatura(fatura, diaVenc) {
  const [ano, mes] = fatura.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dia = Math.min(diaVenc || 1, ultimoDia);
  return `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
}
function fmtFatura(fatura) {
  const [ano, mes] = fatura.split('-').map(Number);
  return new Date(ano, mes - 1, 2).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// ── Tela principal ────────────────────────────────────────────────
async function renderCartoes() {
  document.getElementById('pageTitle').textContent = 'Cartões de Crédito';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const [cartoes, lancs] = await Promise.all([getAll('cartoes'), getAll('lancamentos_cartao')]);
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    const limiteTotal = cartoes.reduce((s,c)=>s+(parseFloat(c.limite)||0),0);
    let faturasEmAberto = 0;
    const cartoesInfo = cartoes.map(c => {
      const lancsCartao = lancs.filter(l => String(l.cartao_id) === String(c.id));
      const pendentes = lancsCartao.filter(l => l.status !== 'pago');
      const usado = pendentes.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
      faturasEmAberto += usado;

      // fatura "atual" = a fatura em aberto que vence mais cedo (a próxima a pagar)
      const faturasPendentes = Array.from(new Set(pendentes.map(l=>l.fatura))).sort();
      const faturaAtual = faturasPendentes[0] || null;
      const valorFaturaAtual = faturaAtual ? pendentes.filter(l=>l.fatura===faturaAtual).reduce((s,l)=>s+(parseFloat(l.valor)||0),0) : 0;
      const vencFaturaAtual = faturaAtual ? vencimentoDaFatura(faturaAtual, c.dia_vencimento) : null;
      const diasVenc = vencFaturaAtual ? Math.round((new Date(vencFaturaAtual+'T00:00:00') - hoje) / 86400000) : null;

      return { cartao: c, usado, faturaAtual, valorFaturaAtual, vencFaturaAtual, diasVenc };
    });
    const limiteDisponivel = limiteTotal - faturasEmAberto;

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-4"><div class="stat-card blue"><div class="stat-icon"><i class="fas fa-credit-card"></i></div>
        <div class="stat-label">Limite Total</div><div class="stat-value">${fmtMoney(limiteTotal)}</div></div></div>
      <div class="col-sm-4"><div class="stat-card red"><div class="stat-icon"><i class="fas fa-file-invoice-dollar"></i></div>
        <div class="stat-label">Faturas em Aberto</div><div class="stat-value">${fmtMoney(faturasEmAberto)}</div></div></div>
      <div class="col-sm-4"><div class="stat-card green"><div class="stat-icon"><i class="fas fa-wallet"></i></div>
        <div class="stat-label">Limite Disponível</div><div class="stat-value">${fmtMoney(limiteDisponivel)}</div></div></div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0"><i class="fas fa-credit-card me-2 text-primary"></i>${cartoes.length} cartão(ões)</h6>
      <button class="btn btn-primary btn-sm" onclick="formCartao()"><i class="fas fa-plus me-1"></i>Novo Cartão</button>
    </div>

    <div class="row g-3">
      ${cartoesInfo.map(info => {
        const c = info.cartao;
        const limite = parseFloat(c.limite) || 0;
        const pct = limite > 0 ? Math.min(100, (info.usado / limite) * 100) : 0;
        const alerta = info.diasVenc !== null && info.diasVenc <= 7;
        const vencido = info.diasVenc !== null && info.diasVenc < 0;
        return `
        <div class="col-md-6 col-xl-4">
          <div class="card h-100" style="cursor:pointer;border-left:5px solid ${escHtml(c.cor||'#4361ee')}" onclick="abrirFatura(${c.id})">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <strong>${escHtml(c.nome)}</strong>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" style="background:${escHtml(c.cor||'#4361ee')};color:#fff">${fmtMoney(limite)}</span>
                  <button class="btn btn-icon btn-outline-secondary btn-sm" style="width:26px;height:26px" title="Editar / Excluir cartão" onclick='event.stopPropagation();formCartao(${JSON.stringify(c)})'><i class="fas fa-cog" style="font-size:11px"></i></button>
                </div>
              </div>
              <div class="small text-muted mb-1">Fatura ${info.faturaAtual ? fmtFatura(info.faturaAtual) : 'atual'}</div>
              <div class="fs-4 fw-bold mb-2">${fmtMoney(info.valorFaturaAtual)}</div>
              <div class="progress mb-2" style="height:8px">
                <div class="progress-bar" style="width:${pct}%;background:${pct>90?'#dc2626':pct>70?'#f59e0b':(c.cor||'#4361ee')}"></div>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">${pct.toFixed(0)}% do limite usado</small>
                ${info.vencFaturaAtual ? `<small class="${vencido?'text-danger fw-bold':alerta?'text-warning fw-bold':'text-muted'}">
                  ${vencido?`⚠️ Venceu há ${Math.abs(info.diasVenc)}d`:alerta?`⏰ Vence em ${info.diasVenc}d`:`Vence em ${info.diasVenc}d`}
                </small>` : '<small class="text-muted">Sem fatura em aberto</small>'}
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}
      ${cartoes.length === 0 ? `<div class="col-12">${emptyState('credit-card','Nenhum cartão cadastrado')}</div>` : ''}
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

// ── Detalhe da fatura ─────────────────────────────────────────────
async function abrirFatura(cartaoId, fatura) {
  cartaoAtualId = cartaoId;
  document.getElementById('pageTitle').textContent = 'Fatura do Cartão';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const [cartoes, lancs] = await Promise.all([getAll('cartoes'), getAll('lancamentos_cartao')]);
    const cartao = cartoes.find(c => String(c.id) === String(cartaoId));
    if (!cartao) { toast('Cartão não encontrado','danger'); renderCartoes(); return; }

    const lancsCartao = lancs.filter(l => String(l.cartao_id) === String(cartaoId));
    const faturasSet = Array.from(new Set(lancsCartao.map(l=>l.fatura))).sort();
    if (!fatura) {
      const pendentes = lancsCartao.filter(l=>l.status!=='pago').map(l=>l.fatura);
      fatura = Array.from(new Set(pendentes)).sort()[0] || faturasSet[faturasSet.length-1] || null;
    }
    faturaSelecionada = fatura;

    const dados = fatura ? lancsCartao.filter(l => l.fatura === fatura) : [];
    const total = dados.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
    const temPendente = dados.some(l=>l.status==='pendente');
    const venc = fatura ? vencimentoDaFatura(fatura, cartao.dia_vencimento) : null;

    document.getElementById('pageContent').innerHTML = `
    <div class="d-flex align-items-center justify-content-between mb-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-outline-secondary btn-sm" onclick="renderCartoes()"><i class="fas fa-arrow-left me-1"></i>Voltar</button>
        <h5 class="mb-0" style="color:${escHtml(cartao.cor||'#4361ee')}"><i class="fas fa-credit-card me-2"></i>${escHtml(cartao.nome)}</h5>
      </div>
      <button class="btn btn-outline-secondary btn-sm" onclick='formCartao(${JSON.stringify(cartao)})'><i class="fas fa-cog me-1"></i>Editar / Excluir Cartão</button>
    </div>

    <div class="card mb-3">
      <div class="card-body d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <select class="form-select form-select-sm" style="width:170px" onchange="abrirFatura(${cartaoId}, this.value)">
            ${faturasSet.length ? faturasSet.map(f=>`<option value="${f}" ${f===fatura?'selected':''}>${fmtFatura(f)}</option>`).join('') : `<option>${fatura?fmtFatura(fatura):'Sem faturas'}</option>`}
          </select>
          <div><div class="small text-muted">Total da fatura</div><div class="fs-4 fw-bold">${fmtMoney(total)}</div></div>
          ${venc?`<div><div class="small text-muted">Vencimento</div><strong>${fmtDate(venc)}</strong></div>`:''}
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" onclick="formLancamentoCartao(${cartaoId})"><i class="fas fa-plus me-1"></i>Novo Lançamento</button>
          ${temPendente && fatura ? `<button class="btn btn-success btn-sm" onclick="pagarFatura(${cartaoId},'${fatura}')"><i class="fas fa-check me-1"></i>Marcar Fatura como Paga</button>` : ''}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr><th class="ps-3">Descrição</th><th>Categoria</th><th>Data</th><th>Parcela</th><th>Valor</th><th>Status</th><th class="text-end pe-3">Ações</th></tr></thead>
            <tbody>
            ${dados.length ? dados.slice().sort((a,b)=>(a.data||'').localeCompare(b.data||'')).map(l => `<tr>
              <td class="ps-3 fw-semibold">${escHtml(l.descricao||'—')}</td>
              <td><span class="badge bg-secondary">${escHtml(l.categoria||'—')}</span></td>
              <td><small>${fmtDate(l.data)}</small></td>
              <td>${l.parcela_total>1?`<span class="badge bg-light text-dark border">${l.parcela_atual}/${l.parcela_total}</span>`:'<small class="text-muted">à vista</small>'}</td>
              <td class="fw-bold">${fmtMoney(l.valor)}</td>
              <td>${badgeStatus(l.status)}</td>
              <td class="text-end pe-3"><button class="btn btn-icon btn-outline-danger btn-sm" onclick="delLancamentoCartao(${l.id},${cartaoId},'${fatura}')"><i class="fas fa-trash"></i></button></td>
            </tr>`).join('') : emptyState('receipt','Nenhum lançamento nesta fatura')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

// ── Cartão: form / salvar / excluir ───────────────────────────────
function formCartao(c = {}) {
  openModal(`<i class="fas fa-credit-card me-2"></i>${c.id?'Editar':'Novo'} Cartão`,
  `<div class="row g-3">
    <div class="col-md-8"><label class="form-label fw-semibold">NOME *</label>
      <input class="form-control" id="ctNome" value="${escHtml(c.nome||'')}" placeholder="Ex: Nubank, Caixa, Riachuelo..."></div>
    <div class="col-md-4"><label class="form-label fw-semibold">COR</label>
      <input type="color" class="form-control form-control-color w-100" id="ctCor" value="${c.cor||'#4361ee'}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">LIMITE (R$) *</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="ctLimite" step="0.01" min="0" value="${c.limite||''}"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">DIA DO FECHAMENTO</label>
      <input type="number" class="form-control" id="ctFechamento" min="1" max="31" value="${c.dia_fechamento||1}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">DIA DO VENCIMENTO</label>
      <input type="number" class="form-control" id="ctVencimento" min="1" max="31" value="${c.dia_vencimento||10}"></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   ${c.id?`<button class="btn btn-outline-danger" onclick="delCartao(${c.id},'${escHtml(c.nome||'')}')"><i class="fas fa-trash me-1"></i>Excluir</button>`:''}
   <button class="btn btn-primary" onclick="salvarCartao(${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Salvar'}</button>`
  );
}

async function salvarCartao(id) {
  if (salvandoCartao) return;
  const nome = document.getElementById('ctNome').value.trim();
  const limite = parseFloat(document.getElementById('ctLimite').value)||0;
  if (!nome) { toast('Nome obrigatório','danger'); return; }
  if (!limite) { toast('Limite obrigatório','danger'); return; }
  salvandoCartao = true;
  const obj = {
    nome, limite,
    cor: document.getElementById('ctCor').value || '#4361ee',
    dia_fechamento: parseInt(document.getElementById('ctFechamento').value)||1,
    dia_vencimento: parseInt(document.getElementById('ctVencimento').value)||10,
    ativo: 1
  };
  try {
    if (id) { await update('cartoes',id,obj); toast('Cartão atualizado!'); }
    else    { await insert('cartoes',obj);    toast('Cartão cadastrado!'); }
    closeModal(); renderCartoes();
  } catch(e) { toast(e.message,'danger'); }
  finally { salvandoCartao = false; }
}

async function delCartao(id, nome) {
  if (!confirm(`Excluir o cartão "${nome}"? Os lançamentos dele continuam no histórico, mas ele some da lista.`)) return;
  await remove('cartoes', id);
  toast('Cartão removido.'); closeModal(); renderCartoes();
}

// ── Lançamento: form / salvar / excluir ───────────────────────────
function formLancamentoCartao(cartaoId) {
  openModal('<i class="fas fa-receipt me-2"></i>Novo Lançamento',
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="lcDesc" placeholder="Ex: Supermercado, Roupa..."></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <input class="form-control" id="lcCat" list="listaCatCartao" placeholder="Ex: Alimentação...">
      <datalist id="listaCatCartao"><option value="Alimentação"><option value="Vestuário"><option value="Casa"><option value="Lazer"><option value="Transporte"><option value="Saúde"><option value="Outro"></datalist></div>
    <div class="col-md-6"><label class="form-label fw-semibold">DATA DA COMPRA *</label>
      <input type="date" class="form-control" id="lcData" value="${localDateStr()}"></div>
    <div class="col-md-6"><label class="form-label fw-semibold">VALOR ${'TOTAL '}(R$) *</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="lcValor" step="0.01" min="0"></div></div>
    <div class="col-md-6"><label class="form-label fw-semibold">PARCELAS</label>
      <select class="form-select" id="lcParcelas">
        ${Array.from({length:24},(_,i)=>i+1).map(n=>`<option value="${n}">${n===1?'À Vista (1x)':n+'x'}</option>`).join('')}
      </select></div>
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarLancamentoCartao(${cartaoId})"><i class="fas fa-save me-1"></i>Salvar</button>`
  );
}

async function salvarLancamentoCartao(cartaoId) {
  if (salvandoLancCartao) return;
  const descricao = document.getElementById('lcDesc').value.trim();
  const categoria = document.getElementById('lcCat').value.trim();
  const data = document.getElementById('lcData').value;
  const valorTotal = parseFloat(document.getElementById('lcValor').value)||0;
  const parcelas = parseInt(document.getElementById('lcParcelas').value)||1;
  if (!descricao) { toast('Descrição obrigatória','danger'); return; }
  if (!valorTotal) { toast('Valor obrigatório','danger'); return; }
  if (!data) { toast('Data obrigatória','danger'); return; }
  salvandoLancCartao = true;
  try {
    const cartao = (await getAll('cartoes')).find(c => String(c.id) === String(cartaoId));
    const fechamento = cartao?.dia_fechamento || 1;
    const parcela = parseFloat((valorTotal / parcelas).toFixed(2));
    let fatura = calcularFatura(data, fechamento);
    for (let i = 0; i < parcelas; i++) {
      await insert('lancamentos_cartao', {
        cartao_id: cartaoId, descricao, categoria, data,
        valor: parcela, parcela_atual: i+1, parcela_total: parcelas,
        fatura, status: 'pendente', ativo: 1
      });
      fatura = proximaFatura(fatura);
    }
    Cache.clear('lancamentos_cartao');
    toast(parcelas>1 ? `Lançamento salvo! ${parcelas} parcelas geradas.` : 'Lançamento salvo!');
    closeModal();
    abrirFatura(cartaoId, faturaSelecionada);
  } catch(e) { toast(e.message,'danger'); }
  finally { salvandoLancCartao = false; }
}

async function delLancamentoCartao(id, cartaoId, fatura) {
  if (!confirm('Excluir este lançamento?')) return;
  await remove('lancamentos_cartao', id);
  Cache.clear('lancamentos_cartao');
  toast('Lançamento removido.');
  abrirFatura(cartaoId, fatura);
}

// ── Pagar fatura ───────────────────────────────────────────────────
async function pagarFatura(cartaoId, fatura) {
  const lancs = (await getAll('lancamentos_cartao')).filter(l => String(l.cartao_id) === String(cartaoId) && l.fatura === fatura && l.status !== 'pago');
  if (!lancs.length) { toast('Nenhum lançamento pendente nesta fatura.','info'); return; }
  const cartao = (await getAll('cartoes')).find(c => String(c.id) === String(cartaoId));
  const total = lancs.reduce((s,l)=>s+(parseFloat(l.valor)||0),0);
  if (!confirm(`Marcar a fatura de ${fmtFatura(fatura)} do cartão ${cartao?.nome||''} como paga? Total: ${fmtMoney(total)}`)) return;
  try {
    for (const l of lancs) await update('lancamentos_cartao', l.id, { status: 'pago' });
    await insert('contas_pagar', {
      descricao:  `Fatura ${cartao?.nome||'Cartão'} (Cartão de Crédito) — ${fmtFatura(fatura)} #cartao${cartaoId}-${fatura}`,
      fornecedor: cartao?.nome || 'Cartão de Crédito',
      valor:      total,
      vencimento: vencimentoDaFatura(fatura, cartao?.dia_vencimento),
      status:     'pago',
      data_pag:   localDateStr(),
      ativo: 1
    });
    Cache.clear('lancamentos_cartao'); Cache.clear('contas_pagar');
    toast('Fatura marcada como paga!');
    abrirFatura(cartaoId, fatura);
  } catch(e) { toast(e.message,'danger'); }
}
