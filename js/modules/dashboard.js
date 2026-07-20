'use strict';
async function renderDashboard() {
  try {
    let stats, chartData, recentSales;
    if (DEMO_MODE) {
      stats = apiDemo_stats();
      chartData = apiDemo_chart();
      recentSales = [...DemoData.vendas].reverse().slice(0,10);
    } else {
      const [vendas, pedidos, produtos, contasPagar] = await Promise.all([
        getAll('vendas'), getAll('clientes'), getAll('produtos'), getAll('contas_pagar')
      ]);
      const hoje = localDateStr();
      const vendasHoje = vendas.filter(v => v.status==='fechada' && v.data===hoje);
      stats = { vendasHoje: vendasHoje.reduce((s,v)=>s+(v.total||0),0), qtdVendas: vendasHoje.length, totalProdutos: produtos.length, totalClientes: pedidos.length };

      const labels=[]; const valuesReceita=[]; const valuesCusto=[];
      for(let i=11;i>=0;i--){
        const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
        const mes=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
        valuesReceita.push(pedidos.filter(p=>p.data_pedido&&p.data_pedido.startsWith(mes)).reduce((s,p)=>s+(parseFloat(p.valor_total)||0),0));
        valuesCusto.push(contasPagar.filter(c=>c.vencimento&&c.vencimento.startsWith(mes)).reduce((s,c)=>s+(parseFloat(c.valor)||0),0));
      }
      chartData = {labels, valuesReceita, valuesCusto};
      recentSales = pedidos.slice(0, 8);

      const hojeDate = new Date(); hojeDate.setHours(0,0,0,0);
      const em3dias = new Date(hojeDate); em3dias.setDate(em3dias.getDate()+3);
      window._alertasAtraso   = pedidos.filter(p => p.data_entrega && new Date(p.data_entrega+'T00:00:00') < hojeDate);
      window._alertasProximos = pedidos.filter(p => { if(!p.data_entrega) return false; const d=new Date(p.data_entrega+'T00:00:00'); return d>=hojeDate && d<=em3dias; });
      window._contasVencidas  = contasPagar.filter(c => c.status==='pendente' && c.vencimento && new Date(c.vencimento+'T00:00:00') < hojeDate);
      window._contasVencendo  = contasPagar.filter(c => { if(c.status!=='pendente'||!c.vencimento) return false; const d=new Date(c.vencimento+'T00:00:00'); return d>=hojeDate && d<=em3dias; });
    }

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card blue"><div class="stat-icon"><i class="fas fa-shopping-cart"></i></div>
          <div class="stat-label">Vendas Hoje</div>
          <div class="stat-value">${fmtMoney(stats.vendasHoje)}</div>
          <div class="stat-sub">${stats.qtdVendas} venda(s)</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card red"><div class="stat-icon"><i class="fas fa-file-invoice"></i></div>
          <div class="stat-label">Faturadas</div>
          <div class="stat-value">${fmtMoney(stats.vendasHoje)}</div>
          <div class="stat-sub">TOT. NF ${stats.qtdVendas} nota(s)</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card green"><div class="stat-icon"><i class="fas fa-boxes"></i></div>
          <div class="stat-label">Estoque</div>
          <div class="stat-value">${stats.totalProdutos}</div>
          <div class="stat-sub">Itens em estoque</div></div>
      </div>
      <div class="col-sm-6 col-xl-3">
        <div class="stat-card orange"><div class="stat-icon"><i class="fas fa-users"></i></div>
          <div class="stat-label">Uniformes</div>
          <div class="stat-value">${stats.totalClientes}</div>
          <div class="stat-sub">Pedidos cadastrados</div></div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header d-flex align-items-center gap-2"><i class="fas fa-bolt text-warning"></i><h6>Acesso Rápido</h6></div>
      <div class="card-body">
        <div class="row g-3">
          ${[['clientes','fas fa-users','Uniforme','#4361ee'],['produtos','fas fa-boxes','Produtos','#2ec4b6'],
             ['pdv','fas fa-cash-register','PDV','#ff9f1c'],['caixa','fas fa-calculator','Caixa','#ef233c'],
             ['kardex','fas fa-warehouse','Kardex','#7209b7'],['relatorios','fas fa-chart-bar','Relatórios','#06a77d']
            ].map(([p,ic,lb,cor]) => `<div class="col-6 col-md-4 col-lg-2">
            <div class="quick-btn" onclick="nav('${p}')"><i class="${ic}" style="color:${cor}"></i><span>${lb}</span></div></div>`).join('')}
        </div>
      </div>
    </div>

    ${(()=>{
      const atraso   = window._alertasAtraso   || [];
      const proximos = window._alertasProximos || [];
      let alertHtml = '';
      if (atraso.length) alertHtml += `
        <div class="alert alert-danger d-flex align-items-start gap-3 mb-3" style="border-left:5px solid #dc2626">
          <i class="fas fa-exclamation-triangle fa-lg mt-1 text-danger"></i>
          <div><strong>⚠️ ${atraso.length} pedido(s) em ATRASO!</strong>
            <div class="mt-1 d-flex flex-wrap gap-2">
              ${atraso.map(p=>`<span class="badge bg-danger">${escHtml(p.nome)} — entrega: ${fmtDate(p.data_entrega)}</span>`).join('')}
            </div></div></div>`;
      if (proximos.length) alertHtml += `
        <div class="alert alert-warning d-flex align-items-start gap-3 mb-3" style="border-left:5px solid #f59e0b">
          <i class="fas fa-clock fa-lg mt-1 text-warning"></i>
          <div><strong>🕐 ${proximos.length} pedido(s) com entrega nos próximos 3 dias!</strong>
            <div class="mt-1 d-flex flex-wrap gap-2">
              ${proximos.map(p=>`<span class="badge bg-warning text-dark">${escHtml(p.nome)} — entrega: ${fmtDate(p.data_entrega)}</span>`).join('')}
            </div></div></div>`;
      const contasVencidas = window._contasVencidas || [];
      const contasVencendo = window._contasVencendo || [];
      if (contasVencidas.length) {
        const total = contasVencidas.reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
        alertHtml += `
        <div class="alert alert-danger d-flex align-items-start gap-3 mb-3" style="border-left:5px solid #b91c1c;cursor:pointer" onclick="nav('financeiro','pagar')">
          <i class="fas fa-file-invoice-dollar fa-lg mt-1 text-danger"></i>
          <div><strong>💸 ${contasVencidas.length} conta(s) a pagar VENCIDA(S) — Total: ${fmtMoney(total)}</strong>
            <div class="mt-1 d-flex flex-wrap gap-2">
              ${contasVencidas.slice(0,5).map(c=>`<span class="badge bg-danger">${escHtml((c.descricao||'').slice(0,30))} — ${fmtDate(c.vencimento)}</span>`).join('')}
              ${contasVencidas.length>5?`<span class="badge bg-secondary">+${contasVencidas.length-5} mais</span>`:''}
            </div></div></div>`;
      }
      if (contasVencendo.length) {
        const total = contasVencendo.reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
        alertHtml += `
        <div class="alert alert-warning d-flex align-items-start gap-3 mb-3" style="border-left:5px solid #d97706;cursor:pointer" onclick="nav('financeiro','pagar')">
          <i class="fas fa-exclamation-circle fa-lg mt-1 text-warning"></i>
          <div><strong>⏰ ${contasVencendo.length} conta(s) vencendo nos próximos 3 dias — Total: ${fmtMoney(total)}</strong>
            <div class="mt-1 d-flex flex-wrap gap-2">
              ${contasVencendo.map(c=>`<span class="badge bg-warning text-dark">${escHtml((c.descricao||'').slice(0,30))} — ${fmtDate(c.vencimento)}</span>`).join('')}
            </div></div></div>`;
      }
      return alertHtml;
    })()}

    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2"><i class="fas fa-clipboard-list text-primary"></i><h6>Pedidos Recentes</h6></div>
            <button class="btn btn-sm btn-outline-primary" onclick="nav('clientes')"><i class="fas fa-plus me-1"></i>Novo</button>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0">
                <thead><tr><th class="ps-3">Cliente</th><th>Peça</th><th>Entrega</th><th>Valor</th></tr></thead>
                <tbody>
                ${recentSales.length ? recentSales.map(p => {
                  const hoje2 = new Date(); hoje2.setHours(0,0,0,0);
                  const entrega = p.data_entrega ? new Date(p.data_entrega+'T00:00:00') : null;
                  const atrasado = entrega && entrega < hoje2;
                  const proximo  = entrega && !atrasado && (entrega - hoje2) <= 3*86400000;
                  return `<tr>
                    <td class="ps-3 fw-semibold">${escHtml((p.nome||'').slice(0,22))}</td>
                    <td><small>${escHtml(p.tipo_peca||'—')}</small></td>
                    <td><small class="${atrasado?'text-danger fw-bold':proximo?'text-warning fw-semibold':'text-muted'}">${fmtDate(p.data_entrega)}${atrasado?' ⚠️':proximo?' 🕐':''}</small></td>
                    <td class="fw-semibold text-success">${fmtMoney(p.valor_total)}</td>
                  </tr>`;
                }).join('') : emptyState('clipboard-list','Nenhum pedido cadastrado')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-2"><i class="fas fa-chart-bar text-primary"></i><h6>Faturamento vs Custos — Últimos 12 meses</h6></div>
          <div class="card-body" style="position:relative;min-height:280px"><canvas id="salesChart"></canvas></div>
        </div>
      </div>
    </div>`;

    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById('salesChart');
    if (ctx && chartData.labels) {
      chartInstance = new Chart(ctx, {
        type:'bar',
        data:{ labels:chartData.labels, datasets:[
          {label:'Faturamento',data:chartData.valuesReceita,backgroundColor:'rgba(67,97,238,.75)',borderRadius:4},
          {label:'Custos',data:chartData.valuesCusto,backgroundColor:'rgba(239,68,68,.65)',borderRadius:4}
        ]},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{display:true,position:'top',labels:{font:{size:11},boxWidth:12}},
            tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${fmtMoney(c.raw)}`}}},
          scales:{x:{grid:{display:false},ticks:{font:{size:10}}},
            y:{grid:{color:'rgba(0,0,0,.04)'},ticks:{font:{size:11},callback:v=>'R$'+v.toLocaleString('pt-BR')}}}}
      });
    }
  } catch(e) { document.getElementById('pageContent').innerHTML = `<div class="alert alert-danger">Erro: ${escHtml(e.message)}</div>`; }
}
