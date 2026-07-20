'use strict';
let comprasSearch = '';

async function renderCompras(search) {
  if (search !== undefined) comprasSearch = search;
  document.getElementById('pageTitle').textContent = 'Compras';
  document.getElementById('pageContent').innerHTML = loading();
  try {
    let dados = await getAll('compras');
    if (comprasSearch) dados = dados.filter(r => (r.descricao+' '+r.fornecedor+' '+r.categoria).toLowerCase().includes(comprasSearch.toLowerCase()));
    const total = dados.reduce((s,r) => s + (parseFloat(r.valor_total)||0), 0);

    document.getElementById('pageContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <h6 class="mb-0"><i class="fas fa-shopping-bag me-2 text-primary"></i>${dados.length} registro(s) — Total: <strong class="text-primary">${fmtMoney(total)}</strong></h6>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm" style="width:240px">
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
              <th>Data</th><th>Parcelas</th><th>Valor Total</th><th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(r => `<tr>
              <td class="ps-3 fw-semibold">${escHtml(r.descricao||r.produto||'—')}</td>
              <td>${escHtml(r.fornecedor||'—')}</td>
              <td><span class="badge bg-secondary">${escHtml(r.categoria||'—')}</span></td>
              <td><small>${fmtDate(r.data_compra)}</small></td>
              <td><small>${r.parcelas>1?`${r.parcelas}x`:'À vista'}</small></td>
              <td class="fw-bold text-primary">${fmtMoney(r.valor_total)}</td>
              <td class="text-end pe-3">
                <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formCompras(${JSON.stringify(r)})'><i class="fas fa-edit"></i></button>
                <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delCompras(${r.id},'${escHtml(r.descricao||'')}')"><i class="fas fa-trash"></i></button>
              </td></tr>`).join('')
            : emptyState('shopping-bag','Nenhuma compra registrada')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formCompras(r={}) {
  openModal(`<i class="fas fa-shopping-bag me-2"></i>${r.id?'Editar':'Nova'} Compra`,
  `<div class="row g-3">
    <div class="col-12"><label class="form-label fw-semibold">DESCRIÇÃO *</label>
      <input class="form-control" id="cDescricao" value="${escHtml(r.descricao||'')}" placeholder="Ex: Compra de linha..."></div>
    <div class="col-md-6"><label class="form-label fw-semibold">FORNECEDOR</label>
      <input class="form-control" id="cFornecedor" value="${escHtml(r.fornecedor||'')}" list="listaFornecedoresCompras" placeholder="Nome do fornecedor">
      <datalist id="listaFornecedoresCompras"><option value="Paulo"><option value="Claudia"><option value="Anderson"><option value="Benetextil"></datalist></div>
    <div class="col-md-6"><label class="form-label fw-semibold">CATEGORIA</label>
      <input class="form-control" id="cCategoria" value="${escHtml(r.categoria||'')}" list="listaCategorias" placeholder="Ex: Matéria-prima...">
      <datalist id="listaCategorias"><option value="Matéria-prima"><option value="Aviamento"><option value="Embalagem"><option value="Equipamento"><option value="Serviço"><option value="Outro"></datalist></div>
    <div class="col-md-4"><label class="form-label fw-semibold">DATA DA COMPRA *</label>
      <input type="date" class="form-control" id="cData" value="${escHtml(r.data_compra||localDateStr())}"></div>
    <div class="col-md-4"><label class="form-label fw-semibold">VALOR TOTAL (R$) *</label>
      <div class="input-group"><span class="input-group-text">R$</span>
        <input type="number" class="form-control" id="cValor" step="0.01" min="0" value="${r.valor_total||''}" oninput="atualizarPreviewParcelasCompra()"></div></div>
    <div class="col-md-4"><label class="form-label fw-semibold">PARCELAMENTO</label>
      <select class="form-select" id="cParcelas" onchange="atualizarPreviewParcelasCompra()" ${r.id?'disabled':''}>
        ${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${(r.parcelas||1)==n?'selected':''}>${n===1?'À Vista (1x)':n+'x'}</option>`).join('')}
      </select></div>
    <div class="col-12" id="cPreviewParcelasCompra"></div>
    <div class="col-12"><label class="form-label">OBSERVAÇÃO</label>
      <textarea class="form-control" id="cObs" rows="2" placeholder="Informações adicionais...">${escHtml(r.observacoes||'')}</textarea></div>
    ${r.id?'<div class="col-12"><small class="text-muted"><i class="fas fa-info-circle me-1"></i>Editar uma compra não recria as parcelas em Contas a Pagar.</small></div>':''}
  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarCompras(${r.id||0})"><i class="fas fa-save me-1"></i>${r.id?'Atualizar':'Salvar'}</button>`
  );
}

function atualizarPreviewParcelasCompra() {
  const n = parseInt(document.getElementById('cParcelas')?.value)||1;
  const total = parseFloat(document.getElementById('cValor')?.value)||0;
  const el = document.getElementById('cPreviewParcelasCompra');
  if (!el) return;
  if (n <= 1 || total === 0) { el.innerHTML=''; return; }
  const parcela = total / n;
  el.innerHTML = `<div class="p-2 rounded" style="background:#f0f4ff;border:1px solid #c7d2fe;font-size:0.85rem">
    <strong>${n}x de ${parcela.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</strong>
    — lançadas em Contas a Pagar a partir da data da compra
  </div>`;
}

async function salvarCompras(id) {
  const descricao = document.getElementById('cDescricao').value.trim();
  const valorTotal = parseFloat(document.getElementById('cValor').value)||0;
  const dataCompra = document.getElementById('cData').value;
  const parcelas   = parseInt(document.getElementById('cParcelas').value)||1;
  const fornecedor = document.getElementById('cFornecedor').value.trim();
  if (!descricao) { toast('Descrição obrigatória','danger'); return; }
  if (!valorTotal) { toast('Valor obrigatório','danger'); return; }
  const obj = {
    descricao,
    fornecedor,
    categoria:    document.getElementById('cCategoria').value.trim(),
    valor_total:  valorTotal,
    parcelas,
    data_compra:  dataCompra,
    observacoes:  document.getElementById('cObs').value.trim(),
    ativo: 1
  };
  try {
    if (id) {
      await update('compras',id,obj); toast('Compra atualizada!');
    } else {
      await insert('compras',obj);
      const parcela = parseFloat((valorTotal / parcelas).toFixed(2));
      const [ano, mes, dia] = dataCompra.split('-').map(Number);
      for (let i = 0; i < parcelas; i++) {
        const d = new Date(ano, mes - 1 + i, dia);
        const venc = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        await insert('contas_pagar', {
          descricao:  parcelas > 1 ? `${descricao} (${i+1}/${parcelas})` : descricao,
          fornecedor: fornecedor || 'Benetextil',
          valor:      parcela, vencimento: venc,
          status: 'pendente', ativo: 1
        });
      }
      Cache.clear('contas_pagar');
      toast(parcelas > 1 ? `Compra salva! ${parcelas} parcelas lançadas em Contas a Pagar.` : 'Compra salva e lançada em Contas a Pagar!');
    }
    closeModal(); renderCompras();
  } catch(e) { toast(e.message,'danger'); }
}

async function delCompras(id, desc) {
  if (!confirm(`Excluir "${desc}"?`)) return;
  await remove('compras',id); toast('Removida.'); renderCompras();
}
