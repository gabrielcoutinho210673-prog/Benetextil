'use strict';
let comprasSearch = '';
let comprasMes = '';
let comprasCategoria = '';
let salvandoCompra = false;

// Acha as parcelas em Contas a Pagar geradas por uma compra, pela tag " #<id>"
// no fim da descrição. Compras antigas (sem tag) não são encontradas — só
// passam a ter status/sincronização depois de salvas de novo.
function parcelasDaCompra(compraId, todasPagar) {
  return todasPagar.filter(c => (c.descricao || '').endsWith(` #${compraId}`));
}

function statusCompra(parcelas) {
  if (!parcelas.length) return { label: '—', cls: 'bg-light text-muted border' };
  const pagas = parcelas.filter(p => p.status === 'pago').length;
  if (pagas === parcelas.length) return { label: 'Pago', cls: 'bg-success' };
  if (pagas > 0) return { label: `Parcial ${pagas}/${parcelas.length}`, cls: 'bg-warning text-dark' };
  return { label: 'Pendente', cls: 'bg-danger' };
}

async function renderCompras(search) {
  if (search !== undefined) comprasSearch = search;
  document.getElementById('pageTitle').textContent = 'Compras';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    const [todas, todasPagar] = await Promise.all([getAll('compras'), getAll('contas_pagar')]);

    const mesesSet = new Set();
    const catSet = new Set();
    todas.forEach(r => {
      if (r.data_compra) mesesSet.add(r.data_compra.slice(0, 7));
      if (r.categoria) catSet.add(r.categoria);
    });
    const meses = Array.from(mesesSet).sort().reverse();
    const categorias = Array.from(catSet).sort();

    let dados = todas;
    if (comprasSearch) dados = dados.filter(r => (r.descricao + ' ' + r.fornecedor + ' ' + r.categoria).toLowerCase().includes(comprasSearch.toLowerCase()));
    if (comprasMes) dados = dados.filter(r => (r.data_compra || '').startsWith(comprasMes));
    if (comprasCategoria) dados = dados.filter(r => r.categoria === comprasCategoria);

    // resumo do que está filtrado
    const total = dados.reduce((s, r) => s + (parseFloat(r.valor_total) || 0), 0);
    let totalPendente = 0;
    const porCategoria = {};
    dados.forEach(r => {
      const parcelas = parcelasDaCompra(r.id, todasPagar);
      totalPendente += parcelas.filter(p => p.status === 'pendente').reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
      const k = r.categoria || 'Sem categoria';
      porCategoria[k] = (porCategoria[k] || 0) + (parseFloat(r.valor_total) || 0);
    });
    const catTop = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 4);

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-md-3"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee">
        <div class="small text-muted">Total (filtro)</div><strong class="text-primary">${fmtMoney(total)}</strong></div></div>
      <div class="col-md-3"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626">
        <div class="small text-muted">Pendente a pagar</div><strong class="text-danger">${fmtMoney(totalPendente)}</strong></div></div>
      <div class="col-md-6"><div class="p-2 rounded" style="background:#f8f9fa;border:1px solid #dee2e6">
        <div class="small text-muted mb-1">Por categoria</div>
        <div class="d-flex flex-wrap gap-2">
          ${catTop.length ? catTop.map(([k, v]) => `<span class="badge bg-secondary">${escHtml(k)}: ${fmtMoney(v)}</span>`).join('') : '<span class="text-muted small">—</span>'}
        </div></div></div>
    </div>

    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 class="mb-0"><i class="fas fa-shopping-bag me-2 text-primary"></i>${dados.length} registro(s)</h6>
        <div class="d-flex gap-2 flex-wrap">
          <select class="form-select form-select-sm" style="width:160px" onchange="comprasMes=this.value;renderCompras()">
            <option value="">Todos os meses</option>
            ${meses.map(m => `<option value="${m}" ${comprasMes === m ? 'selected' : ''}>${new Date(m + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</option>`).join('')}
          </select>
          <select class="form-select form-select-sm" style="width:150px" onchange="comprasCategoria=this.value;renderCompras()">
            <option value="">Todas categorias</option>
            ${categorias.map(c => `<option value="${escHtml(c)}" ${comprasCategoria === c ? 'selected' : ''}>${escHtml(c)}</option>`).join('')}
          </select>
          <div class="input-group input-group-sm" style="width:200px">
            <input type="text" class="form-control" placeholder="Buscar..." value="${escHtml(comprasSearch)}" oninput="renderCompras(this.value)">
            <button class="btn btn-outline-secondary" onclick="comprasSearch='';renderCompras('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formCompras()"><i class="fas fa-plus me-1"></i>Nova Compra</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Descrição</th><th>Fornecedor</th><th>Categoria</th>
              <th>Data</th><th>Parcelas</th><th>Valor Total</th><th>Status</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => {
              const parcelas = parcelasDaCompra(r.id, todasPagar);
              const st = statusCompra(parcelas);
              const temPendente = parcelas.some(p => p.status === 'pendente');
              return `<tr>
                <td class="ps-3 fw-semibold">${escHtml(r.descricao || r.produto || '—')}${r.comprovante_url ? ` <a href="${escHtml(r.comprovante_url)}" target="_blank" rel="noopener" title="Ver comprovante"><i class="fas fa-paperclip text-muted"></i></a>` : ''}</td>
                <td>${escHtml(r.fornecedor || '—')}</td>
                <td><span class="badge bg-secondary">${escHtml(r.categoria || '—')}</span></td>
                <td><small>${fmtDate(r.data_compra)}</small></td>
                <td><small>${r.parcelas > 1 ? `${r.parcelas}x` : 'À vista'}</small></td>
                <td class="fw-bold text-primary">${fmtMoney(r.valor_total)}</td>
                <td><span class="badge ${st.cls}">${st.label}</span></td>
                <td class="text-end pe-3">
                  ${temPendente ? `<button class="btn btn-icon btn-outline-success btn-sm" title="Quitar parcelas pendentes" onclick="quitarCompra(${r.id})"><i class="fas fa-check"></i></button>` : ''}
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formCompras(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delCompras(${r.id},'${escHtml(r.descricao || '')}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;
            }).join('')
            : emptyState('shopping-bag', 'Nenhuma compra registrada')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message, 'danger'); }
}

async function formCompras(r = {}) {
  let produtos = [];
  try { produtos = await getAll('produtos'); } catch(e) {}

  const formasPag = ['', 'PIX', 'Cartão Crédito', 'Cartão Débito', 'Boleto', 'Dinheiro', 'Cheque', 'Transferência'];

  openModal(`<i class="fas fa-shopping-bag me-2"></i>${r.id ? 'Editar' : 'Nova'} Compra`,
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="cDescricao" value="${escHtml(r.descricao || '')}" placeholder="Ex: Compra de linha..."></div>
    <div class="col-md-6"><label class="form-label fw-semibold">FORNECEDOR</label>
      <input class="form-control" id="cFornecedor" value="${escHtml(r.fornecedor || '')}" list="listaFornecedoresCompras" placeholder="Nome do fornecedor">
      <datalist id="listaFornecedoresCompras"><option value="Paulo"><option value="Claudia"><option value="Anderson"><option value="Benetextil"></datalist></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <input class="form-control" id="cCategoria" value="${escHtml(r.categoria || '')}" list="listaCategorias" placeholder="Ex: Matéria-prima...">
      <datalist id="listaCategorias"><option value="Matéria-prima"><option value="Aviamento"><option value="Embalagem"><option value="Equipamento"><option value="Serviço"><option value="Outro"></datalist></div>
    <div class="col-md-3"><label class="form-label fw-semibold">DATA DA COMPRA *</label>
      <input type="date" class="form-control" id="cData" value="${escHtml(r.data_compra || localDateStr())}"></div>
    <div class="col-md-3"><label class="form-label fw-semibold">VALOR TOTAL (R$) *</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="cValor" step="0.01" min="0" value="${r.valor_total || ''}" oninput="atualizarPreviewParcelasCompra()"></div></div>
    <div class="col-md-3"><label class="form-label fw-semibold">FORMA DE PAGAMENTO</label>
      <select class="form-select" id="cFormaPag">
        ${formasPag.map(f => `<option value="${f}" ${(r.forma_pagamento || '') === f ? 'selected' : ''}>${f || '—'}</option>`).join('')}
      </select></div>
    <div class="col-md-3"><label class="form-label fw-semibold">PARCELAMENTO</label>
      <select class="form-select" id="cParcelas" onchange="atualizarPreviewParcelasCompra()">
        ${Array.from({length:24},(_,i)=>i+1).map(n => `<option value="${n}" ${(r.parcelas || 1) == n ? 'selected' : ''}>${n === 1 ? 'À Vista (1x)' : n + 'x'}</option>`).join('')}
      </select></div>
    <div class="col-12" id="cPreviewParcelasCompra"></div>

    <div class="col-12"><label class="form-label">LINK DO COMPROVANTE / NOTA (opcional)</label>
      <input class="form-control" id="cComprovante" value="${escHtml(r.comprovante_url || '')}" placeholder="Cole aqui o link da foto ou PDF da nota (Drive, Fotos, etc.)"></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #10b981;padding-bottom:4px">
      <i class="fas fa-warehouse text-success"></i><strong class="text-success">ENTRADA NO ESTOQUE (opcional)</strong></div></div>
    ${r.id ? `<div class="col-12"><small class="text-muted"><i class="fas fa-info-circle me-1"></i>A entrada no estoque só é lançada ao criar a compra. Para ajustar estoque de uma compra existente, use o Kardex.</small></div>` : `
    <div class="col-md-8"><label class="form-label">Produto do estoque</label>
      <select class="form-select" id="cProdutoEstoque">
        <option value="">— não vincular —</option>
        ${produtos.map(p => `<option value="${p.id}">${escHtml(p.nome || '')}${p.codigo ? ' [' + escHtml(p.codigo) + ']' : ''} — ${parseFloat(p.estoque) || 0} ${p.unidade || 'un'}</option>`).join('')}
      </select></div>
    <div class="col-md-4"><label class="form-label">Quantidade comprada</label>
      <input type="number" class="form-control" id="cProdutoQtd" step="0.01" min="0" placeholder="0"></div>
    <div class="col-12"><small class="text-muted">Se preenchido, dá entrada automática no Kardex e soma no estoque do produto.</small></div>`}

    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="cObs" rows="2" placeholder="Informações adicionais...">${escHtml(r.observacoes || '')}</textarea></div>
    ${r.id ? '<div class="col-12"><small class="text-muted"><i class="fas fa-info-circle me-1"></i>Ao editar valor/parcelamento, as parcelas <strong>ainda não pagas</strong> em Contas a Pagar são recriadas. Parcelas já pagas não são mexidas.</small></div>' : ''}
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarCompras(${r.id || 0})"><i class="fas fa-save me-1"></i>${r.id ? 'Atualizar' : 'Salvar'}</button>`,
  'lg'
  );
  setTimeout(atualizarPreviewParcelasCompra, 100);
}

function atualizarPreviewParcelasCompra() {
  const n = parseInt(document.getElementById('cParcelas')?.value) || 1;
  const total = parseFloat(document.getElementById('cValor')?.value) || 0;
  const el = document.getElementById('cPreviewParcelasCompra');
  if (!el) return;
  if (n <= 1 || total === 0) { el.innerHTML = ''; return; }
  const parcela = total / n;
  el.innerHTML = `<div class="p-2 rounded" style="background:#f0f4ff;border:1px solid #c7d2fe;font-size:0.85rem">
    <strong>${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
    — lançadas em Contas a Pagar a partir da data da compra
  </div>`;
}

async function criarParcelasCompra(compraId, descricao, valorTotal, parcelas, dataCompra, fornecedor) {
  const parcela = parseFloat((valorTotal / parcelas).toFixed(2));
  const [ano, mes, dia] = dataCompra.split('-').map(Number);
  for (let i = 0; i < parcelas; i++) {
    const d = new Date(ano, mes - 1 + i, dia);
    const venc = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await insert('contas_pagar', {
      descricao:  `${descricao}${parcelas > 1 ? ` (${i + 1}/${parcelas})` : ''} #${compraId}`,
      fornecedor: fornecedor || 'Benetextil',
      valor:      parcela, vencimento: venc,
      status: 'pendente', ativo: 1
    });
  }
}

async function salvarCompras(id) {
  if (salvandoCompra) return; // trava contra duplo clique
  const descricao  = document.getElementById('cDescricao').value.trim();
  const valorTotal = parseFloat(document.getElementById('cValor').value) || 0;
  const dataCompra = document.getElementById('cData').value;
  const parcelas   = parseInt(document.getElementById('cParcelas').value) || 1;
  const fornecedor = document.getElementById('cFornecedor').value.trim();
  const formaPag   = document.getElementById('cFormaPag')?.value || '';
  if (!descricao)  { toast('Descrição obrigatória', 'danger'); return; }
  if (!valorTotal) { toast('Valor obrigatório', 'danger'); return; }
  salvandoCompra = true;

  const obj = {
    descricao,
    fornecedor,
    categoria:       document.getElementById('cCategoria').value.trim(),
    valor_total:     valorTotal,
    parcelas,
    data_compra:     dataCompra,
    forma_pagamento: formaPag,
    comprovante_url: document.getElementById('cComprovante')?.value.trim() || '',
    observacoes:     document.getElementById('cObs').value.trim(),
    ativo: 1
  };

  try {
    if (id) {
      await update('compras', id, obj);
      const todasPagar = await getAll('contas_pagar');
      const existentes = parcelasDaCompra(id, todasPagar);
      const temPaga = existentes.some(p => p.status === 'pago');
      if (temPaga) {
        toast('Compra atualizada. Há parcelas já pagas — os lançamentos no Financeiro não foram alterados.', 'warning');
      } else {
        for (const p of existentes.filter(p => p.status === 'pendente')) await remove('contas_pagar', p.id);
        await criarParcelasCompra(id, descricao, valorTotal, parcelas, dataCompra, fornecedor);
        Cache.clear('contas_pagar');
        toast('Compra e parcelas atualizadas!');
      }
    } else {
      const novo = await insert('compras', obj);
      const compraId = novo.id;
      await criarParcelasCompra(compraId, descricao, valorTotal, parcelas, dataCompra, fornecedor);
      Cache.clear('contas_pagar');

      // entrada automática no estoque, se vinculado a um produto
      const produtoId = parseInt(document.getElementById('cProdutoEstoque')?.value) || 0;
      const produtoQtd = parseFloat(document.getElementById('cProdutoQtd')?.value) || 0;
      if (produtoId && produtoQtd > 0) {
        const prods = await getAll('produtos');
        const p = prods.find(x => String(x.id) === String(produtoId));
        if (p) {
          const antes = parseFloat(p.estoque) || 0;
          const depois = antes + produtoQtd;
          await update('produtos', produtoId, { estoque: depois });
          await insert('kardex', {
            produto_id: produtoId, produto_nome: p.nome, tipo: 'entrada',
            quantidade: produtoQtd, saldo_anterior: antes, saldo_atual: depois,
            data: dataCompra, descricao: `Compra: ${descricao} #${compraId}`, ativo: 1
          });
          await update('compras', compraId, { produto_id: produtoId, produto_qtd: produtoQtd });
          Cache.clear('produtos'); Cache.clear('kardex');
        }
      }
      toast(parcelas > 1 ? `Compra salva! ${parcelas} parcelas lançadas em Contas a Pagar.` : 'Compra salva e lançada em Contas a Pagar!');
    }
    closeModal(); renderCompras();
  } catch(e) { toast(e.message, 'danger'); }
  finally { salvandoCompra = false; }
}

async function quitarCompra(id) {
  const todasPagar = await getAll('contas_pagar');
  const pendentes = parcelasDaCompra(id, todasPagar).filter(p => p.status === 'pendente');
  if (!pendentes.length) { toast('Nenhuma parcela pendente para esta compra.', 'info'); return; }
  const total = pendentes.reduce((s, p) => s + (parseFloat(p.valor) || 0), 0);
  if (!confirm(`Marcar ${pendentes.length} parcela(s) como paga(s)? Total: ${fmtMoney(total)}`)) return;
  for (const p of pendentes) await update('contas_pagar', p.id, { status: 'pago', data_pag: localDateStr() });
  Cache.clear('contas_pagar');
  toast('Parcelas quitadas!'); renderCompras();
}

async function delCompras(id, desc) {
  if (!confirm(`Excluir "${desc}"? As parcelas ainda não pagas no Financeiro também serão canceladas.`)) return;
  const todasPagar = await getAll('contas_pagar');
  for (const p of parcelasDaCompra(id, todasPagar).filter(p => p.status === 'pendente')) {
    await remove('contas_pagar', p.id);
  }
  await remove('compras', id);
  Cache.clear('contas_pagar');
  toast('Compra removida (parcelas pendentes canceladas).'); renderCompras();
}
