'use strict';
let pdvCarrinho = [];
let pdvSearchText = '';

async function renderPDV() {
  document.getElementById('pageTitle').textContent = 'PDV — Ponto de Venda';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const produtos = await getAll('produtos');
    const prods = produtos.filter(p => (parseFloat(p.estoque)||0) > 0);
    renderPDVLayout(prods, produtos);
  } catch(e) { toast(e.message,'danger'); }
}

function renderPDVLayout(prods, todosProdutos) {
  document.getElementById('pageContent').innerHTML = `
  <div class="row g-3">
    <div class="col-lg-7">
      <div class="card h-100">
        <div class="card-header d-flex align-items-center gap-2">
          <i class="fas fa-search text-primary"></i>
          <input type="text" class="form-control form-control-sm" id="pdvSearch" placeholder="Buscar produto por nome ou código..."
            oninput="pdvFiltrar(this.value,${JSON.stringify(todosProdutos).replace(/'/g,'&#39;')})" value="${escHtml(pdvSearchText)}">
        </div>
        <div class="card-body p-2" id="pdvProdutos">
          <div class="row g-2">
            ${prods.slice(0,24).map(p => `
            <div class="col-6 col-md-4">
              <div class="p-2 border rounded text-center h-100 d-flex flex-column justify-content-between" style="cursor:pointer;transition:.2s" onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background=''" onclick="pdvAddItem(${p.id},'${escHtml(p.nome||'')}',${parseFloat(p.preco_venda)||0},'${escHtml(p.unidade||'un')}',${parseFloat(p.estoque)||0})">
                <div class="fw-semibold" style="font-size:.85rem">${escHtml(p.nome)}</div>
                <div class="text-muted" style="font-size:.75rem">${p.codigo?`[${escHtml(p.codigo)}] `:''}</div>
                <div class="text-success fw-bold mt-1">${fmtMoney(p.preco_venda||0)}</div>
                <div class="text-muted" style="font-size:.7rem">${parseFloat(p.estoque)||0} ${p.unidade||'un'} em estoque</div>
              </div>
            </div>`).join('')}
            ${prods.length===0 ? emptyState('boxes','Nenhum produto em estoque') : ''}
          </div>
        </div>
      </div>
    </div>
    <div class="col-lg-5">
      <div class="card">
        <div class="card-header d-flex align-items-center justify-content-between">
          <h6 class="mb-0"><i class="fas fa-shopping-cart text-primary me-2"></i>Carrinho</h6>
          <button class="btn btn-outline-danger btn-sm" onclick="pdvLimpar()"><i class="fas fa-trash me-1"></i>Limpar</button>
        </div>
        <div class="card-body p-0">
          <div id="pdvCarrinhoLista">
            ${pdvRenderCarrinho()}
          </div>
        </div>
        <div class="card-footer">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <strong>TOTAL:</strong>
            <span class="fs-5 fw-bold text-primary" id="pdvTotal">${fmtMoney(pdvCalcTotal())}</span>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6"><label class="form-label small mb-1">Forma de Pagamento</label>
              <select class="form-select form-select-sm" id="pdvFormaPag">
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão Crédito</option>
                <option value="cartao_debito">Cartão Débito</option>
                <option value="fiado">Fiado</option>
              </select></div>
            <div class="col-6"><label class="form-label small mb-1">Cliente (opcional)</label>
              <input type="text" class="form-control form-control-sm" id="pdvCliente" placeholder="Nome do cliente"></div>
          </div>
          <button class="btn btn-success w-100 btn-lg" onclick="pdvFecharVenda()" ${pdvCarrinho.length?'':'disabled'}>
            <i class="fas fa-check-circle me-2"></i>FINALIZAR VENDA
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function pdvFiltrar(q, todos) {
  pdvSearchText = q;
  const filtrados = q ? todos.filter(p => (p.nome+' '+(p.codigo||'')).toLowerCase().includes(q.toLowerCase()) && (parseFloat(p.estoque)||0)>0) : todos.filter(p=>(parseFloat(p.estoque)||0)>0);
  document.getElementById('pdvProdutos').innerHTML = `<div class="row g-2">${filtrados.slice(0,24).map(p=>`
    <div class="col-6 col-md-4">
      <div class="p-2 border rounded text-center h-100 d-flex flex-column justify-content-between" style="cursor:pointer" onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background=''" onclick="pdvAddItem(${p.id},'${escHtml(p.nome||'')}',${parseFloat(p.preco_venda)||0},'${escHtml(p.unidade||'un')}',${parseFloat(p.estoque)||0})">
        <div class="fw-semibold" style="font-size:.85rem">${escHtml(p.nome)}</div>
        <div class="text-success fw-bold mt-1">${fmtMoney(p.preco_venda||0)}</div>
        <div class="text-muted" style="font-size:.7rem">${parseFloat(p.estoque)||0} ${p.unidade||'un'}</div>
      </div>
    </div>`).join('')}${filtrados.length===0?emptyState('boxes','Nenhum produto encontrado'):''}</div>`;
}

function pdvAddItem(id, nome, preco, unidade, estoque) {
  const idx = pdvCarrinho.findIndex(i=>i.id===id);
  if (idx>=0) {
    if (pdvCarrinho[idx].qtd >= estoque) { toast(`Estoque máximo: ${estoque} ${unidade}`,'warning'); return; }
    pdvCarrinho[idx].qtd++;
  } else {
    pdvCarrinho.push({ id, nome, preco, unidade, estoque, qtd:1 });
  }
  pdvAtualizarCarrinho();
}

function pdvRemoveItem(id) {
  pdvCarrinho = pdvCarrinho.filter(i=>i.id!==id);
  pdvAtualizarCarrinho();
}

function pdvAlterarQtd(id, delta) {
  const idx = pdvCarrinho.findIndex(i=>i.id===id);
  if (idx<0) return;
  pdvCarrinho[idx].qtd = Math.max(1, pdvCarrinho[idx].qtd + delta);
  if (pdvCarrinho[idx].qtd > pdvCarrinho[idx].estoque) { pdvCarrinho[idx].qtd = pdvCarrinho[idx].estoque; toast('Limite de estoque','warning'); }
  pdvAtualizarCarrinho();
}

function pdvAtualizarCarrinho() {
  const lista = document.getElementById('pdvCarrinhoLista');
  const totalEl = document.getElementById('pdvTotal');
  const btn = document.querySelector('[onclick="pdvFecharVenda()"]');
  if (lista) lista.innerHTML = pdvRenderCarrinho();
  if (totalEl) totalEl.textContent = fmtMoney(pdvCalcTotal());
  if (btn) btn.disabled = pdvCarrinho.length === 0;
}

function pdvRenderCarrinho() {
  if (!pdvCarrinho.length) return `<div class="text-center py-4 text-muted"><i class="fas fa-shopping-cart fa-2x mb-2 d-block opacity-25"></i>Carrinho vazio</div>`;
  return `<table class="table table-sm mb-0"><tbody>${pdvCarrinho.map(item=>`<tr>
    <td><div class="fw-semibold" style="font-size:.85rem">${escHtml(item.nome)}</div><small class="text-muted">${fmtMoney(item.preco)}/un</small></td>
    <td class="text-center" style="width:110px">
      <div class="d-flex align-items-center justify-content-center gap-1">
        <button class="btn btn-xs btn-outline-secondary" onclick="pdvAlterarQtd(${item.id},-1)">−</button>
        <span class="px-2 fw-bold">${item.qtd}</span>
        <button class="btn btn-xs btn-outline-secondary" onclick="pdvAlterarQtd(${item.id},1)">+</button>
      </div></td>
    <td class="fw-bold text-end text-success">${fmtMoney(item.preco*item.qtd)}</td>
    <td style="width:30px"><button class="btn btn-icon btn-link text-danger p-0" onclick="pdvRemoveItem(${item.id})"><i class="fas fa-times"></i></button></td>
  </tr>`).join('')}</tbody></table>`;
}

function pdvCalcTotal() { return pdvCarrinho.reduce((s,i)=>s+i.preco*i.qtd,0); }

function pdvLimpar() { if (pdvCarrinho.length && !confirm('Limpar carrinho?')) return; pdvCarrinho=[]; pdvAtualizarCarrinho(); }

async function pdvFecharVenda() {
  if (!pdvCarrinho.length) return;
  const total       = pdvCalcTotal();
  const formaPag    = document.getElementById('pdvFormaPag')?.value || 'dinheiro';
  const cliente     = document.getElementById('pdvCliente')?.value.trim() || '';
  const hoje        = localDateStr();

  try {
    const vendasExistentes = await getAll('vendas');
    const ultimoNumero = vendasExistentes.reduce((m,v)=>Math.max(m,parseInt(v.numero)||0),0);
    const numero = String(ultimoNumero+1).padStart(6,'0');

    const venda = await insert('vendas', {
      numero,
      cliente_nome:    cliente || 'Balcão',
      data:            hoje,
      forma_pagamento: formaPag,
      subtotal:        total,
      desconto:        0,
      total,
      status:          'fechada',
      ativo: 1
    });

    for (const item of pdvCarrinho) {
      await insert('itens_venda', {
        venda_id:     venda.id,
        produto_id:   item.id,
        produto_nome: item.nome,
        quantidade:   item.qtd,
        preco:        item.preco,
        desconto:     0,
        total:        item.preco*item.qtd,
        ativo: 1
      });
      const prods = await getAll('produtos');
      const p = prods.find(x=>x.id===item.id);
      if (p) {
        const estoqueAnterior = parseFloat(p.estoque)||0;
        const novoEstoque = Math.max(0, estoqueAnterior - item.qtd);
        await update('produtos', item.id, { estoque: novoEstoque });
        await insert('kardex', {
          produto_id:     item.id,
          produto_nome:   item.nome,
          tipo:           'saida',
          quantidade:     item.qtd,
          saldo_anterior: estoqueAnterior,
          saldo_atual:    novoEstoque,
          data:           hoje,
          descricao:      `PDV — Venda ${numero} para ${cliente||'balcão'}`,
          ativo: 1
        });
      }
    }
    Cache.clear('produtos'); Cache.clear('vendas'); Cache.clear('itens_venda'); Cache.clear('kardex');

    if (formaPag === 'fiado') {
      await insert('contas_receber', {
        descricao:  `Venda PDV — ${cliente||'balcão'}`,
        cliente:    cliente,
        valor:      total,
        vencimento: hoje,
        status:     'pendente',
        ativo: 1
      });
    }

    toast(`Venda finalizada! Total: ${fmtMoney(total)}`);
    pdvCarrinho = [];
    openModal('<i class="fas fa-check-circle text-success me-2"></i>Venda Concluída!',
    `<div class="text-center py-3">
      <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
      <h4 class="text-success">Venda Realizada com Sucesso!</h4>
      <div class="fs-4 fw-bold text-primary mt-2">${fmtMoney(total)}</div>
      <div class="text-muted mt-1">Forma de pagamento: <strong>${formaPag}</strong></div>
      ${cliente?`<div class="text-muted">Cliente: <strong>${escHtml(cliente)}</strong></div>`:''}
    </div>`,
    `<button class="btn btn-primary" data-bs-dismiss="modal" onclick="renderPDV()"><i class="fas fa-plus me-1"></i>Nova Venda</button>`);
  } catch(e) { toast(e.message,'danger'); }
}
