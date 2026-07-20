'use strict';
async function renderCaixa() {
  document.getElementById('pageTitle').textContent = 'Caixa';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const hoje = localDateStr();
    const [vendas, pagar, receber] = await Promise.all([
      getAll('vendas'), getAll('contas_pagar'), getAll('contas_receber')
    ]);

    const vendasHoje = vendas.filter(v => v.data === hoje && v.status === 'fechada');
    const pagarHoje  = pagar.filter(c  => c.vencimento === hoje);
    const receberHoje= receber.filter(c => c.vencimento === hoje);

    const totalEntradas  = vendasHoje.reduce((s,v)=>s+(parseFloat(v.total)||0),0);
    const totalPagar     = pagarHoje.reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalReceber   = receberHoje.reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const saldo          = totalEntradas + totalReceber - totalPagar;

    const byFormaPag = {};
    vendasHoje.forEach(v => { byFormaPag[v.forma_pag||'outros'] = (byFormaPag[v.forma_pag||'outros']||0) + (parseFloat(v.total)||0); });

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card green"><div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
          <div class="stat-label">Entradas Hoje</div>
          <div class="stat-value">${fmtMoney(totalEntradas)}</div>
          <div class="stat-sub">${vendasHoje.length} venda(s)</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card red"><div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
          <div class="stat-label">Saídas Hoje</div>
          <div class="stat-value">${fmtMoney(totalPagar)}</div>
          <div class="stat-sub">${pagarHoje.length} conta(s) a pagar</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-hand-holding-usd"></i></div>
          <div class="stat-label">A Receber</div>
          <div class="stat-value">${fmtMoney(totalReceber)}</div>
          <div class="stat-sub">${receberHoje.length} conta(s)</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card ${saldo>=0?'green':'red'}"><div class="stat-icon"><i class="fas fa-calculator"></i></div>
          <div class="stat-label">Saldo do Dia</div>
          <div class="stat-value">${fmtMoney(saldo)}</div>
          <div class="stat-sub">${saldo>=0?'Positivo':'Negativo'}</div></div>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header"><i class="fas fa-chart-pie text-primary me-2"></i><strong>Vendas por Forma de Pagamento</strong></div>
          <div class="card-body">
            ${Object.entries(byFormaPag).length ? Object.entries(byFormaPag).map(([forma,valor])=>`
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="text-capitalize"><i class="fas fa-${forma==='pix'?'qrcode':forma==='dinheiro'?'money-bill-wave':forma==='fiado'?'handshake':'credit-card'} me-2 text-muted"></i>${forma.replace('_',' ')}</span>
              <strong>${fmtMoney(valor)}</strong>
            </div>
            <div class="progress mb-3" style="height:6px"><div class="progress-bar" style="width:${(valor/totalEntradas*100).toFixed(0)}%;background:#4361ee"></div></div>`).join('')
            : '<p class="text-muted text-center py-3">Nenhuma venda hoje</p>'}
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div><i class="fas fa-clock text-primary me-2"></i><strong>Últimas Vendas</strong></div>
            <button class="btn btn-outline-primary btn-sm" onclick="nav('pdv')"><i class="fas fa-plus me-1"></i>Nova Venda</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-sm mb-0">
                <thead><tr><th class="ps-3">Cliente</th><th>Forma Pag.</th><th class="text-end pe-3">Total</th></tr></thead>
                <tbody>
                ${vendasHoje.length ? vendasHoje.slice().reverse().slice(0,8).map(v=>`<tr>
                  <td class="ps-3">${escHtml(v.cliente||'Balcão')}</td>
                  <td><small class="text-capitalize">${escHtml(v.forma_pag||'—')}</small></td>
                  <td class="text-end pe-3 fw-bold text-success">${fmtMoney(v.total)}</td></tr>`).join('')
                : `<tr><td colspan="3" class="text-center text-muted py-4">Nenhuma venda hoje</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <div><i class="fas fa-history text-primary me-2"></i><strong>Movimentação Completa — ${hoje}</strong></div>
        <button class="btn btn-outline-secondary btn-sm" onclick="renderCaixa()"><i class="fas fa-sync me-1"></i>Atualizar</button>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr><th class="ps-3">Descrição</th><th>Tipo</th><th>Hora</th><th class="text-end pe-3">Valor</th></tr></thead>
            <tbody>
            ${[
              ...vendasHoje.map(v=>({desc:`PDV — ${v.cliente||'Balcão'}`, tipo:'Entrada', cor:'text-success', valor:parseFloat(v.total)||0, hora:v.created_at||''})),
              ...pagarHoje.map(c=>({desc:c.descricao||'Conta a pagar', tipo:'Saída', cor:'text-danger', valor:parseFloat(c.valor)||0, hora:c.created_at||''})),
              ...receberHoje.map(c=>({desc:c.descricao||'Conta a receber', tipo:'A Receber', cor:'text-primary', valor:parseFloat(c.valor)||0, hora:c.created_at||''}))
            ].map(m=>`<tr>
              <td class="ps-3">${escHtml(m.desc)}</td>
              <td><span class="badge ${m.tipo==='Entrada'?'bg-success':m.tipo==='Saída'?'bg-danger':'bg-primary'}">${m.tipo}</span></td>
              <td><small class="text-muted">${m.hora?new Date(m.hora).toLocaleTimeString('pt-BR'):'—'}</small></td>
              <td class="text-end pe-3 fw-bold ${m.cor}">${m.tipo==='Saída'?'−':'+'} ${fmtMoney(m.valor)}</td></tr>`).join('')
            || `<tr><td colspan="4" class="text-center text-muted py-4">Nenhuma movimentação hoje</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}
