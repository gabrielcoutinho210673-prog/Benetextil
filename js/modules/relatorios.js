'use strict';
let relTab = 'uniforme';

// ── Categorização de peças pra relatório ────────────────────────────
// O "Tipo de Peça" do pedido é texto livre — pequenas variações (composição
// junto, abreviação, erro de digitação) fariam o mesmo tipo de peça virar
// linhas separadas se agrupássemos pelo texto exato. Normaliza cada texto
// numa categoria conhecida antes de somar as quantidades no relatório.
//
// Ordem da mais específica pra menos específica: uma categoria mais
// específica precisa ser testada antes da genérica que a contém (ex:
// "camisa polo" antes de "camisa"). As chaves são sempre frases completas
// (não palavras soltas), pra "CALÇA SOCIAL" não cair em "Camisa Social" só
// por ter a palavra "social".
const CATEGORIAS_PECA = [
  { categoria: 'Camisa Polo',   chaves: ['camisa polo', 'polo'] },
  { categoria: 'Camisa Social', chaves: ['camisa social'] },
  { categoria: 'Camiseta',      chaves: ['camiseta'] },
  { categoria: 'Moletom',       chaves: ['moletom', 'moleton'] },
  { categoria: 'Jaqueta',       chaves: ['jaqueta'] },
  { categoria: 'Colete',        chaves: ['colete'] },
  { categoria: 'Jaleco',        chaves: ['jaleco'] },
  { categoria: 'Avental',       chaves: ['avental'] },
  { categoria: 'Boné',          chaves: ['boné', 'bone'] },
  { categoria: 'Gravata',       chaves: ['gravata'] },
  { categoria: 'Lenço',         chaves: ['lenço', 'lenco'] },
  { categoria: 'Macacão',       chaves: ['macacão', 'macacao'] },
  { categoria: 'Vestido',       chaves: ['vestido'] },
  { categoria: 'Saia',          chaves: ['saia'] },
  { categoria: 'Bermuda',       chaves: ['bermuda'] },
  { categoria: 'Calça',         chaves: ['calça', 'calca'] },
  { categoria: 'Camisa',        chaves: ['camisa'] },
  { categoria: 'Blusa',         chaves: ['blusa'] },
];

// Função pura: recebe o texto livre do "Tipo de Peça" e devolve a categoria
// conhecida correspondente. Se não bater com nenhuma, devolve o próprio
// texto original — nunca esconde num "outros" genérico.
function normalizarCategoriaPeca(texto) {
  const t = (texto || '').toLowerCase().trim();
  if (!t) return texto || 'Sem tipo';
  for (const { categoria, chaves } of CATEGORIAS_PECA) {
    if (chaves.some(chave => t.includes(chave))) return categoria;
  }
  return texto;
}

// Extrai as peças (tipo + quantidade) de um pedido de Uniforme, incluindo
// as peças 2 a 5 (mesmo padrão usado no PDF da Ordem de Fornecimento).
function pecasDoPedido(p) {
  const pecas = [];
  for (let i = 1; i <= 5; i++) {
    const tipo = i === 1 ? p.tipo_peca : p[`peca${i}_tipo`];
    const qtd  = parseFloat(i === 1 ? p.quantidade : p[`peca${i}_qtd`]) || 0;
    if (!tipo && qtd <= 0) continue;
    pecas.push({ tipo: tipo || 'Sem tipo', qtd });
  }
  return pecas;
}

async function renderRelatorios(tab) {
  if (tab) relTab = tab;
  document.getElementById('pageTitle').textContent = 'Relatórios';
  document.getElementById('pageContent').innerHTML = `
  <ul class="nav nav-tabs mb-3">
    ${[
      ['uniforme','fas fa-tshirt','Uniformes'],
      ['sublimacao','fas fa-paint-brush','Sublimação'],
      ['financeiro','fas fa-chart-line','Financeiro'],
      ['funcionarios','fas fa-users','Funcionários'],
      ['estoque','fas fa-boxes','Estoque'],
    ].map(([t,ic,lb])=>`<li class="nav-item">
      <a class="nav-link ${relTab===t?'active':''}" href="#" onclick="renderRelatorios('${t}');return false">
        <i class="${ic} me-2"></i>${lb}</a></li>`).join('')}
  </ul>
  <div id="relConteudo">${loading()}</div>`;

  if      (relTab==='uniforme')    renderRelUniforme();
  else if (relTab==='sublimacao')  renderRelSublimacao();
  else if (relTab==='financeiro')  renderRelFinanceiro();
  else if (relTab==='funcionarios') renderRelFuncionarios();
  else if (relTab==='estoque')     renderRelEstoque();
}

async function renderRelUniforme() {
  const el = document.getElementById('relConteudo');
  try {
    const [dados, contasPagar] = await Promise.all([getAll('clientes'), getAll('contas_pagar')]);
    const hoje  = new Date(); hoje.setHours(0,0,0,0);
    const custoPedido = p => {
      const desc = `${p.tipo_peca||'Uniforme'} — ${p.nome}`;
      return contasPagar.filter(c => (c.descricao||'').includes(`— ${desc}`)).reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    };
    const total = dados.reduce((s,p)=>s+(parseFloat(p.valor_total)||0),0);
    const custo = dados.reduce((s,p)=>s+custoPedido(p),0);
    const lucro = total - custo;
    const atrasados = dados.filter(p=>p.data_entrega&&!p.entregue&&new Date(p.data_entrega+'T00:00:00')<hoje).length;
    const entregues = dados.filter(p=>p.entregue).length;

    // peças produzidas por categoria — normaliza o texto livre do tipo de
    // peça pra não separar em linhas diferentes o que é o mesmo item
    const porCategoria = {};
    dados.forEach(p => {
      pecasDoPedido(p).forEach(({ tipo, qtd }) => {
        const cat = normalizarCategoriaPeca(tipo);
        porCategoria[cat] = (porCategoria[cat] || 0) + qtd;
      });
    });
    const categorias = Object.entries(porCategoria).sort((a,b)=>b[1]-a[1]);
    const maxQtd = categorias.length ? categorias[0][1] : 0;

    el.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3"><div class="stat-card blue"><div class="stat-icon"><i class="fas fa-clipboard-list"></i></div>
        <div class="stat-label">Total Pedidos</div><div class="stat-value">${dados.length}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card green"><div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
        <div class="stat-label">Faturamento</div><div class="stat-value">${fmtMoney(total)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card red"><div class="stat-icon"><i class="fas fa-receipt"></i></div>
        <div class="stat-label">Custo Total</div><div class="stat-value">${fmtMoney(custo)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card orange"><div class="stat-icon"><i class="fas fa-chart-line"></i></div>
        <div class="stat-label">Lucro Bruto</div><div class="stat-value">${fmtMoney(lucro)}</div></div></div>
    </div>
    <div class="row g-3 mb-4">
      <div class="col-md-4"><div class="p-3 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626">
        <div class="small text-muted">Pedidos em Atraso</div><div class="fs-4 fw-bold text-danger">${atrasados}</div></div></div>
      <div class="col-md-4"><div class="p-3 rounded text-center" style="background:#d1fae5;border:1px solid #10b981">
        <div class="small text-muted">Entregues</div><div class="fs-4 fw-bold text-success">${entregues}</div></div></div>
      <div class="col-md-4"><div class="p-3 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee">
        <div class="small text-muted">Margem Média</div><div class="fs-4 fw-bold text-primary">${total>0?(lucro/total*100).toFixed(1):'0'}%</div></div></div>
    </div>
    <div class="card mb-4">
      <div class="card-header"><i class="fas fa-tshirt text-primary me-2"></i><strong>Peças Produzidas por Categoria</strong></div>
      <div class="card-body">
        ${categorias.length ? categorias.map(([cat, qtd]) => `
          <div class="mb-2">
            <div class="d-flex justify-content-between small mb-1">
              <span class="fw-semibold">${escHtml(cat)}</span>
              <span class="text-muted">${qtd} peça(s)</span>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar" style="width:${maxQtd>0?(qtd/maxQtd*100):0}%;background:#4361ee"></div>
            </div>
          </div>`).join('') : '<p class="text-muted mb-0">Nenhuma peça registrada</p>'}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fas fa-table text-primary me-2"></i><strong>Todos os Pedidos</strong></div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table mb-0">
          <thead><tr><th class="ps-3">Cliente</th><th>Tipo Peça</th><th>Pedido</th><th>Entrega</th>
            <th>Valor</th><th>Custo</th><th>Lucro</th></tr></thead>
          <tbody>
          ${dados.length ? dados.slice().reverse().map(p=>{
            const c = custoPedido(p);
            const l = (parseFloat(p.valor_total)||0)-c;
            const ent = p.data_entrega?new Date(p.data_entrega+'T00:00:00'):null;
            const atrasado = ent && ent < hoje;
            return `<tr class="${atrasado?'table-danger':''}">
              <td class="ps-3 fw-semibold">${escHtml(p.nome||'—')}</td>
              <td><small>${escHtml(p.tipo_peca||'—')}</small></td>
              <td><small>${fmtDate(p.data_pedido)}</small></td>
              <td class="${atrasado?'text-danger fw-bold':''}"><small>${fmtDate(p.data_entrega)}${atrasado?' ⚠️':''}</small></td>
              <td class="text-success fw-semibold">${fmtMoney(p.valor_total)}</td>
              <td class="text-danger">${fmtMoney(c)}</td>
              <td class="${l>=0?'text-success':'text-danger'} fw-bold">${fmtMoney(l)}</td></tr>`;
          }).join('') : `<tr><td colspan="7" class="text-center text-muted py-4">Nenhum pedido</td></tr>`}
          </tbody>
        </table>
      </div></div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderRelSublimacao() {
  const el = document.getElementById('relConteudo');
  try {
    const dados  = await getAll('sublimacao');
    const totalGasto = dados.reduce((s,r)=>{
      return s + ['uber','almoco','gasolina','estacionamento','brim','mao_obra_anderson'].reduce((ss,f)=>ss+(parseFloat(r[f])||0),0) + (parseFloat(r.compra_tecido_total)||0);
    },0);
    const totalVenda = dados.reduce((s,r)=>s+(parseFloat(r.valor_venda)||0),0);
    const lucro = totalVenda - totalGasto;

    el.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-4"><div class="stat-card blue"><div class="stat-icon"><i class="fas fa-paint-brush"></i></div>
        <div class="stat-label">Registros</div><div class="stat-value">${dados.length}</div></div></div>
      <div class="col-sm-4"><div class="stat-card red"><div class="stat-icon"><i class="fas fa-shopping-bag"></i></div>
        <div class="stat-label">Total Gasto</div><div class="stat-value">${fmtMoney(totalGasto)}</div></div></div>
      <div class="col-sm-4"><div class="stat-card green"><div class="stat-icon"><i class="fas fa-chart-line"></i></div>
        <div class="stat-label">Receita</div><div class="stat-value">${fmtMoney(totalVenda)}</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fas fa-table text-primary me-2"></i><strong>Registros de Sublimação</strong></div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table mb-0">
          <thead><tr><th class="ps-3">Cliente</th><th>Obs</th><th>Tecido</th><th>Gasto</th><th>Venda</th><th>Lucro</th></tr></thead>
          <tbody>
          ${dados.length ? dados.slice().reverse().map(r=>{
            const g = ['uber','almoco','gasolina','estacionamento','brim','mao_obra_anderson'].reduce((s,f)=>s+(parseFloat(r[f])||0),0)+(parseFloat(r.compra_tecido_total)||0);
            const v = parseFloat(r.valor_venda)||0;
            const l = v - g;
            return `<tr>
              <td class="ps-3 fw-semibold">${escHtml(r.nome_cliente||'—')}</td>
              <td><small>${escHtml((r.descricao||'').slice(0,30))}</small></td>
              <td><small>${escHtml(r.tecido||'—')}</small></td>
              <td class="text-danger">${fmtMoney(g)}</td>
              <td class="text-success">${fmtMoney(v)}</td>
              <td class="${l>=0?'text-success':'text-danger'} fw-bold">${fmtMoney(l)}</td></tr>`;
          }).join('') : `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum registro</td></tr>`}
          </tbody>
        </table>
      </div></div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderRelFinanceiro() {
  const el = document.getElementById('relConteudo');
  try {
    const [pagar, receber] = await Promise.all([getAll('contas_pagar'), getAll('contas_receber')]);
    const porFornecedor = {};
    pagar.forEach(c => {
      const k = c.fornecedor || 'Outros';
      porFornecedor[k] = (porFornecedor[k]||0) + (parseFloat(c.valor)||0);
    });
    const totalPagar   = pagar.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalPago    = pagar.filter(c=>c.status==='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalAReceber= receber.filter(c=>c.status!=='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);
    const totalRecebido= receber.filter(c=>c.status==='pago').reduce((s,c)=>s+(parseFloat(c.valor)||0),0);

    el.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3"><div class="stat-card red"><div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
        <div class="stat-label">A Pagar (pendente)</div><div class="stat-value">${fmtMoney(totalPagar)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card blue"><div class="stat-icon"><i class="fas fa-check"></i></div>
        <div class="stat-label">Já Pago</div><div class="stat-value">${fmtMoney(totalPago)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card green"><div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
        <div class="stat-label">A Receber</div><div class="stat-value">${fmtMoney(totalAReceber)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card orange"><div class="stat-icon"><i class="fas fa-wallet"></i></div>
        <div class="stat-label">Já Recebido</div><div class="stat-value">${fmtMoney(totalRecebido)}</div></div></div>
    </div>
    <div class="card">
      <div class="card-header"><i class="fas fa-users text-primary me-2"></i><strong>Despesas por Fornecedor / Funcionário</strong></div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>Fornecedor / Funcionário</th><th>Total Lançado</th><th>% do Total</th></tr></thead>
            <tbody>
            ${Object.entries(porFornecedor).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr>
              <td class="fw-semibold">${escHtml(k)}</td>
              <td>${fmtMoney(v)}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height:6px"><div class="progress-bar" style="width:${((v/(totalPago+totalPagar)||0)*100).toFixed(0)}%;background:#4361ee"></div></div>
                  <small>${((v/((totalPago+totalPagar)||1))*100).toFixed(1)}%</small>
                </div>
              </td></tr>`).join('') || `<tr><td colspan="3" class="text-center text-muted">Nenhum lançamento</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderRelFuncionarios() {
  const el = document.getElementById('relConteudo');
  try {
    const [pagar, clientes] = await Promise.all([getAll('contas_pagar'), getAll('clientes')]);
    const func = {};
    pagar.forEach(c => {
      if (!c.fornecedor) return;
      if (!func[c.fornecedor]) func[c.fornecedor] = { total: 0, pendente: 0, pago: 0, qtd: 0 };
      func[c.fornecedor].total   += parseFloat(c.valor)||0;
      func[c.fornecedor].qtd++;
      if (c.status === 'pago') func[c.fornecedor].pago    += parseFloat(c.valor)||0;
      else                     func[c.fornecedor].pendente+= parseFloat(c.valor)||0;
    });

    el.innerHTML = `
    <div class="row g-3">
    ${Object.entries(func).sort((a,b)=>b[1].total-a[1].total).map(([nome, d])=>`
      <div class="col-md-6 col-xl-4">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-2">
            <i class="fas fa-user-circle fa-lg text-primary"></i>
            <strong>${escHtml(nome)}</strong>
          </div>
          <div class="card-body">
            <div class="mb-2 d-flex justify-content-between"><span class="text-muted">Total lançado</span><strong>${fmtMoney(d.total)}</strong></div>
            <div class="mb-2 d-flex justify-content-between"><span class="text-muted">Pago</span><strong class="text-success">${fmtMoney(d.pago)}</strong></div>
            <div class="mb-2 d-flex justify-content-between"><span class="text-muted">Pendente</span><strong class="text-danger">${fmtMoney(d.pendente)}</strong></div>
            <div class="mb-2 d-flex justify-content-between"><span class="text-muted">Lançamentos</span><strong>${d.qtd}</strong></div>
            <div class="progress mt-2" style="height:8px" title="Pago ${((d.pago/d.total||0)*100).toFixed(0)}%">
              <div class="progress-bar bg-success" style="width:${((d.pago/(d.total||1))*100).toFixed(0)}%"></div>
            </div>
            <small class="text-muted">${((d.pago/(d.total||1))*100).toFixed(0)}% pago</small>
          </div>
        </div>
      </div>`).join('')}
    ${Object.keys(func).length===0 ? `<div class="col-12">${emptyState('users','Nenhum lançamento por funcionário')}</div>` : ''}
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}

async function renderRelEstoque() {
  const el = document.getElementById('relConteudo');
  try {
    const produtos = await getAll('produtos');
    const totalItens = produtos.reduce((s,p)=>s+(parseFloat(p.estoque)||0),0);
    const totalValor = produtos.reduce((s,p)=>s+(parseFloat(p.estoque)||0)*(parseFloat(p.preco_custo)||0),0);
    const abaixoMin  = produtos.filter(p=>(parseFloat(p.estoque)||0)<=(parseFloat(p.estoque_minimo)||0));
    const semEstoque = produtos.filter(p=>(parseFloat(p.estoque)||0)===0);

    el.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-xl-3"><div class="stat-card blue"><div class="stat-icon"><i class="fas fa-boxes"></i></div>
        <div class="stat-label">Total Itens</div><div class="stat-value">${produtos.length}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card green"><div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
        <div class="stat-label">Valor em Estoque</div><div class="stat-value">${fmtMoney(totalValor)}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card orange"><div class="stat-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="stat-label">Abaixo Mínimo</div><div class="stat-value">${abaixoMin.length}</div></div></div>
      <div class="col-sm-6 col-xl-3"><div class="stat-card red"><div class="stat-icon"><i class="fas fa-times-circle"></i></div>
        <div class="stat-label">Sem Estoque</div><div class="stat-value">${semEstoque.length}</div></div></div>
    </div>
    ${abaixoMin.length > 0 ? `
    <div class="alert alert-warning mb-3">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <strong>${abaixoMin.length} produto(s) abaixo do estoque mínimo:</strong>
      <div class="mt-1 d-flex flex-wrap gap-2">
        ${abaixoMin.map(p=>`<span class="badge bg-warning text-dark">${escHtml(p.nome)} (${parseFloat(p.estoque)||0}/${parseFloat(p.estoque_minimo)||0})</span>`).join('')}
      </div>
    </div>` : ''}
    <div class="card">
      <div class="card-header"><i class="fas fa-table text-primary me-2"></i><strong>Estoque Geral</strong></div>
      <div class="card-body p-0"><div class="table-responsive">
        <table class="table mb-0">
          <thead><tr><th class="ps-3">Produto</th><th>Código</th><th>Categoria</th>
            <th>Atual</th><th>Mínimo</th><th>Un.</th><th>Custo</th><th>Valor Total</th></tr></thead>
          <tbody>
          ${produtos.length ? produtos.map(p=>{
            const est = parseFloat(p.estoque)||0;
            const min = parseFloat(p.estoque_minimo)||0;
            const alerta = est <= min;
            const valor = est * (parseFloat(p.preco_custo)||0);
            return `<tr class="${alerta?'table-warning':''}">
              <td class="ps-3 fw-semibold">${escHtml(p.nome||'—')}</td>
              <td><code>${escHtml(p.codigo||'—')}</code></td>
              <td><span class="badge bg-secondary">${escHtml(p.categoria||'—')}</span></td>
              <td class="${est<=0?'text-danger fw-bold':alerta?'text-warning fw-bold':'fw-bold'}">${est}</td>
              <td>${min||'—'}</td>
              <td>${escHtml(p.unidade||'un')}</td>
              <td>${p.preco_custo?fmtMoney(p.preco_custo):'—'}</td>
              <td class="fw-semibold">${valor>0?fmtMoney(valor):'—'}</td></tr>`;
          }).join('') : `<tr><td colspan="8" class="text-center text-muted py-4">Nenhum produto cadastrado</td></tr>`}
          </tbody>
        </table>
      </div></div>
    </div>`;
  } catch(e) { el.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`; }
}
