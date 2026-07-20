'use strict';
let currentPage = '';
let chartInstance = null;

function nav(page, sub='') {
  if (window.APP_ROLE === 'operador' && PAGINAS_ADMIN.has(page)) {
    toast('Acesso restrito. Sem permissão para esta área.', 'warning');
    page = 'clientes';
  }
  currentPage = page;
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));

  const titles = {
    dashboard:'Dashboard', clientes:'Uniforme', produtos:'Estoque',
    categorias:'Categorias', fornecedores:'Fornecedores', pdv:'PDV — Ponto de Venda',
    caixa:'Caixa', kardex:'Kardex — Estoque', financeiro:'Financeiro', relatorios:'Relatórios'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  const content = document.getElementById('pageContent');
  content.className = 'page fade-in';
  content.innerHTML = loading();

  document.getElementById('sidebar').classList.remove('open');

  const renders = {
    dashboard:   renderDashboard,
    clientescad: renderClientesCad,
    clientes:    renderClientes,
    sublimacao:  renderSublimacao,
    produtos:    renderProdutos,
    compras:     renderCompras,
    contascasa:  renderContasCasa,
    categorias:  renderCategorias,
    fornecedores:renderFornecedores,
    pdv:         renderPDV,
    caixa:       renderCaixa,
    kardex:      renderKardex,
    financeiro:  () => renderFinanceiro(sub||'pagar'),
    relatorios:  renderRelatorios
  };

  (renders[page] || renderDashboard)();
}

function refreshPage() { Cache.clear(); nav(currentPage); }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
