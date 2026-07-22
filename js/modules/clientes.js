'use strict';
let clienteSearch = '';
let clienteFiltro = 'todos';
let clienteMes    = '';
let salvandoCliente = false;

const AVIAMENTOS_LIST = [
  {key:'botao',           label:'BOTÃO'},
  {key:'ziper',           label:'ZÍPER'},
  {key:'elastico',        label:'ELÁSTICO'},
  {key:'ilhos',           label:'ILHÓS'},
  {key:'entretela',       label:'ENTRETELA'},
  {key:'cordao',          label:'CORDÃO'},
  {key:'cadarco',         label:'CADARÇO'},
  {key:'composicao',      label:'COMPOSIÇÃO'},
  {key:'etiqueta',        label:'ETIQUETA'},
  {key:'velcro',          label:'VELCRO'},
  {key:'botao_pressao',   label:'BOTÃO DE PRESSÃO'},
  {key:'faixa_refletiva', label:'FAIXA REFLETIVA'},
  {key:'tnt',             label:'TNT'},
  {key:'tinta',           label:'TINTA'},
  {key:'tela',            label:'TELA'},
];

async function renderClientes(search) {
  if (search !== undefined) clienteSearch = search;
  try {
    const todos = await getAll('clientes');

    const mesesSet = new Set();
    todos.forEach(c => { if (c.data_pedido) mesesSet.add(c.data_pedido.slice(0,7)); });
    const meses = Array.from(mesesSet).sort().reverse();

    let base = todos;
    if (clienteSearch) base = base.filter(c => (c.nome+' '+c.telefone+' '+c.tipo_peca).toLowerCase().includes(clienteSearch.toLowerCase()));
    if (clienteMes) base = base.filter(c => (c.data_pedido||'').startsWith(clienteMes));

    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const isAtraso = c => c.data_entrega && new Date(c.data_entrega+'T00:00:00') < hoje;
    const qtdAtraso = base.filter(isAtraso).length;
    const qtdPrazo  = base.length - qtdAtraso;

    let dados = base;
    if (clienteFiltro === 'atraso') dados = dados.filter(isAtraso);
    if (clienteFiltro === 'prazo')  dados = dados.filter(c => !isAtraso(c));

    document.getElementById('pageContent').innerHTML = `
    <div class="row g-2 mb-3">
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#eef2ff;border:1px solid #4361ee"><div class="small text-muted">Total</div><strong class="text-primary">${base.length}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#fee2e2;border:1px solid #dc2626"><div class="small text-muted">Em Atraso</div><strong class="text-danger">${qtdAtraso}</strong></div></div>
      <div class="col-4"><div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981"><div class="small text-muted">No Prazo</div><strong class="text-success">${qtdPrazo}</strong></div></div>
    </div>
    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div class="d-flex gap-1 flex-wrap">
          ${['todos','atraso','prazo'].map(f=>`<button class="btn btn-sm ${clienteFiltro===f?'btn-primary':'btn-outline-secondary'}" onclick="clienteFiltro='${f}';renderClientes()">${f==='todos'?'Todos':f==='atraso'?'Em Atraso':'No Prazo'}</button>`).join('')}
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <select class="form-select form-select-sm" style="width:180px" onchange="clienteMes=this.value;renderClientes()">
            <option value="">Todos os meses</option>
            ${meses.map(m=>`<option value="${m}" ${clienteMes===m?'selected':''}>${new Date(m+'-02').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</option>`).join('')}
          </select>
          <div class="input-group input-group-sm" style="width:220px">
            <input type="text" class="form-control" placeholder="Buscar nome, peça..." value="${escHtml(clienteSearch)}"
              oninput="renderClientes(this.value)" id="clienteSearchInput">
            <button class="btn btn-outline-secondary" onclick="clienteSearch='';renderClientes('')"><i class="fas fa-times"></i></button>
          </div>
          <button class="btn btn-primary btn-sm" onclick="formCliente()"><i class="fas fa-plus me-1"></i>Novo Pedido</button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0">
            <thead><tr>
              <th class="ps-3">Cliente</th><th>Telefone</th><th>Tipo de Peça</th><th>Qtd</th>
              <th>Data Pedido</th><th>Entrega</th><th>Valor Total</th><th>Status Pgto</th>
              <th class="text-end pe-3">Ações</th>
            </tr></thead>
            <tbody>
            ${dados.length ? dados.map(c => {
              const saldo = (parseFloat(c.valor_total)||0) - (parseFloat(c.entrada)||0);
              const statusPgto = saldo <= 0 ? '<span class="badge bg-success">Pago</span>' : (parseFloat(c.entrada)>0 ? '<span class="badge bg-warning text-dark">Parcial</span>' : '<span class="badge bg-danger">Pendente</span>');
              const atrasado = isAtraso(c);
              return `<tr class="${atrasado?'table-danger':''}">
                <td class="ps-3"><strong>${escHtml(c.nome)}</strong><br><small class="text-muted">${escHtml(c.endereco||'')}</small></td>
                <td>${escHtml(c.telefone||'—')}</td>
                <td>${escHtml(c.tipo_peca||'—')}</td>
                <td>${escHtml(c.quantidade||'—')}</td>
                <td><small>${c.data_pedido?fmtDate(c.data_pedido):'—'}</small></td>
                <td><small class="${atrasado?'text-danger fw-bold':''}">${c.data_entrega?fmtDate(c.data_entrega):'—'}${atrasado?' ⚠️ Atrasado':''}</small></td>
                <td class="fw-semibold">${c.valor_total?fmtMoney(c.valor_total):'—'}</td>
                <td>${statusPgto}</td>
                <td class="text-end pe-3">
                  <button class="btn btn-icon btn-outline-primary btn-sm" onclick='formCliente(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button>
                  <button class="btn btn-icon btn-outline-danger btn-sm" onclick="delCliente(${c.id},'${escHtml(c.nome)}')"><i class="fas fa-trash"></i></button>
                </td></tr>`;}).join('')
            : emptyState('users','Nenhum pedido encontrado')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  } catch(e) { toast(e.message,'danger'); }
}

function formCliente(c={}) {
  const v = (f) => escHtml(c[f]||'');
  const aviaData = [null].concat([1,2,3,4,5].map(i => {
    const col = i === 1 ? 'peca1_aviamentos' : `peca${i}_aviamentos`;
    try { return JSON.parse(c[col] || '{}'); } catch(e) { return {}; }
  }));
  const aviaVal = (i, key, field) => {
    const val = aviaData[i]?.[key]?.[field];
    return (val != null && val !== '') ? val : '';
  };
  const hoje = localDateStr();
  const secTitle = (icon, txt) => `<div class="col-12 mt-2"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #4361ee;padding-bottom:4px"><i class="fas fa-${icon} text-primary"></i><strong class="text-primary">${txt}</strong></div></div>`;

  openModal(`<i class="fas fa-user me-2"></i>${c.id?'Editar':'Novo'} Pedido / Cliente`,
  `<div class="row g-3">

    ${secTitle('user','DADOS DO CLIENTE')}
    <div class="col-12">
      <label class="form-label fw-semibold"><i class="fas fa-search me-1 text-primary"></i>Buscar Cliente Cadastrado</label>
      <div class="input-group">
        <input class="form-control" id="buscaClienteCad" placeholder="Digite o nome do cliente para buscar e preencher automaticamente..."
          oninput="filtrarClientesCad(this.value)" autocomplete="off">
        <button class="btn btn-outline-secondary" type="button" onclick="document.getElementById('buscaClienteCad').value='';document.getElementById('listaClientesCad').innerHTML='';document.getElementById('listaClientesCad').style.display='none'">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div id="listaClientesCad" class="list-group mt-1 shadow-sm" style="display:none;position:absolute;z-index:9999;max-height:200px;overflow-y:auto;width:calc(100% - 30px)"></div>
    </div>
    <div class="col-md-5"><label class="form-label">Nome *</label><input class="form-control" id="cNome" value="${v('nome')}"></div>
    <div class="col-md-3"><label class="form-label">CPF / CNPJ</label><input class="form-control" id="cCpfCnpj" placeholder="000.000.000-00" value="${v('cpf_cnpj')}"></div>
    <div class="col-md-2"><label class="form-label">Telefone</label><input class="form-control" id="cTel" value="${v('telefone')}"></div>
    <div class="col-md-2"><label class="form-label">Data do Pedido</label><input type="date" class="form-control" id="cDataPedido" value="${v('data_pedido')||hoje}"></div>
    <div class="col-12"><label class="form-label">Endereço</label><input class="form-control" id="cEnd" value="${v('endereco')}"></div>

    ${secTitle('tshirt','DESCRIÇÃO DO SERVIÇO')}
    <input type="hidden" id="cQtdTipos" value="1">
    <div class="col-12" id="cLinhasPeca">
      ${[1,2,3,4,5].map(i=>`
      <div class="peca-linha" id="pecaLinha${i}" style="${i>1?'display:none':''}">
        <div class="d-flex align-items-center gap-2 my-2" style="border-bottom:2px solid #4361ee;padding-bottom:4px">
          <i class="fas fa-tshirt text-primary"></i><strong class="text-primary">PEÇA ${i}</strong>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-md-4"><label class="form-label">Tipo de Peça</label><input class="form-control" id="cTipoPeca${i}" value="${v(i===1?'tipo_peca':`peca${i}_tipo`)}"></div>
          <div class="col-md-2"><label class="form-label">Quantidade</label><input type="number" class="form-control" id="cQtd${i}" min="0" value="${v(i===1?'quantidade':`peca${i}_qtd`)}"></div>
          <div class="col-md-3"><label class="form-label">Tamanho(s)</label><input class="form-control" id="cTamanhos${i}" placeholder="P, M, G, GG" value="${v(i===1?'tamanhos':`peca${i}_tamanhos`)}"></div>
          <div class="col-md-3"><label class="form-label">Cor(s)</label><input class="form-control" id="cCores${i}" value="${v(i===1?'cores':`peca${i}_cores`)}"></div>
          <div class="col-md-3"><label class="form-label">Tecido</label><input class="form-control" id="cTecido${i}" value="${v(i===1?'tecido':`peca${i}_tecido`)}"></div>
          <div class="col-md-2"><label class="form-label">Metros / Qtd Tecido</label><div class="input-group"><input type="number" class="form-control" id="cTecidoQtd${i}" step="0.01" min="0" placeholder="0,00" value="${v(i===1?'tecido_qtd':`peca${i}_tecido_qtd`)}"><span class="input-group-text">m</span></div></div>
          <div class="col-md-2"><label class="form-label">Valor Gasto no Tecido (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cTecidoValor${i}" step="0.01" min="0" value="${v(i===1?'tecido_valor':`peca${i}_tecido_valor`)}" oninput="calcResumo()"></div></div>
          <div class="col-md-3"><label class="form-label">Observações</label><input class="form-control" id="cObsServico${i}" value="${v(i===1?'obs_servico':`peca${i}_obs`)}"></div>
          <div class="col-md-2"><label class="form-label">Valor de Venda/Un (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cVendaValor${i}" step="0.01" min="0" value="${v(i===1?'venda_valor':`peca${i}_venda_valor`)}" oninput="calcResumo()" placeholder="0,00"></div></div>
          <div class="col-12 mt-1">
            <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:10px">
              <div class="fw-semibold mb-2" style="font-size:0.83rem;color:#4361ee"><i class="fas fa-tags me-1"></i>AVIAMENTOS DA PEÇA ${i}</div>
              <table class="table table-sm table-bordered mb-2" style="font-size:0.82rem">
                <thead class="table-primary"><tr><th>Aviamento</th><th style="width:80px">Qtd</th><th style="width:130px">Valor por Unidade (R$)</th><th style="width:100px">Total</th></tr></thead>
                <tbody>
                  ${AVIAMENTOS_LIST.map(a=>`<tr>
                    <td class="align-middle">${a.label}</td>
                    <td><input type="number" class="form-control form-control-sm" id="p${i}_avia_${a.key}_qtd" min="0" step="1" value="${aviaVal(i,a.key,'qtd')}" oninput="calcResumo()"></td>
                    <td><div class="input-group input-group-sm"><span class="input-group-text">R$</span><input type="number" class="form-control" id="p${i}_avia_${a.key}_val" min="0" step="0.01" value="${aviaVal(i,a.key,'val')}" oninput="calcResumo()"></div></td>
                    <td class="text-end align-middle fw-semibold" id="p${i}_avia_${a.key}_tot">R$ 0,00</td>
                  </tr>`).join('')}
                </tbody>
              </table>
              <div style="background:#e8f4fd;border:1px solid #4361ee;border-radius:8px;padding:8px 14px;font-size:0.9rem;color:#1a237e;display:flex;gap:20px;align-items:center;flex-wrap:wrap">
                <span><strong>Tecido:</strong> <span id="custoPeca${i}_tecido">R$ 0,00</span></span>
                <span><strong>Aviamentos:</strong> <span id="custoPeca${i}_avia">R$ 0,00</span></span>
                <span><strong>Costura:</strong> <span id="custoPeca${i}_costura">R$ 0,00</span></span>
                <span id="custoPeca${i}_costuraDetalhe" style="font-size:0.8rem;color:#636e72"></span>
                <span><strong>Silk/Caseado/Travete/Bordado/Corte/Operacional:</strong> <span id="custoPeca${i}_extras">R$ 0,00</span></span>
                <span style="font-size:1rem;font-weight:700;color:#4361ee"><i class="fas fa-calculator me-1"></i>Total da Peça: <span id="custoPeca${i}_total">R$ 0,00</span></span>
                <span style="font-size:1rem;font-weight:700;color:#7c3aed"><i class="fas fa-tag me-1"></i>Custo/Un: <span id="custoPeca${i}_unit">R$ 0,00</span></span>
                <span style="font-size:1rem;font-weight:700;color:#059669"><i class="fas fa-arrow-trend-up me-1"></i>Lucro da Peça: <span id="custoPeca${i}_lucro">—</span></span>
                <span style="font-size:1rem;font-weight:700;color:#059669"><i class="fas fa-coins me-1"></i>Lucro/Un: <span id="custoPeca${i}_lucroUnit">—</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>

    ${secTitle('dollar-sign','PRAZO E VALORES')}
    <div class="col-md-3"><label class="form-label">Data de Entrega</label><input type="date" class="form-control" id="cDataEntrega" value="${v('data_entrega')}"></div>
    <div class="col-md-3"><label class="form-label">Valor Total (R$)</label><input type="number" class="form-control" id="cValorTotal" step="0.01" value="${v('valor_total')}" oninput="calcResumo()"></div>
    <div class="col-md-3"><label class="form-label">Entrada (R$)</label><input type="number" class="form-control" id="cEntrada" step="0.01" value="${v('entrada')}"></div>
    <div class="col-md-3"><label class="form-label">Forma de Pagamento</label>
      <select class="form-select" id="cFormaPag">
        ${['','Dinheiro','PIX','Cartão Crédito','Cartão Débito','Cheque','Fiado'].map(o=>`<option${v('forma_pagamento')===o?' selected':''}>${o}</option>`).join('')}
      </select></div>

    ${secTitle('receipt','CUSTOS OPERACIONAIS')}
    <div class="col-md-3"><label class="form-label">Uber (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cUber" step="0.01" min="0" value="${v('uber')}" oninput="calcResumo()"></div></div>
    <div class="col-md-3"><label class="form-label">Almoço (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cAlmoco" step="0.01" min="0" value="${v('almoco')}" oninput="calcResumo()"></div></div>
    <div class="col-md-3"><label class="form-label">Gasolina (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cGasolina" step="0.01" min="0" value="${v('gasolina')}" oninput="calcResumo()"></div></div>
    <div class="col-md-3"><label class="form-label">Estacionamento (R$)</label><div class="input-group"><span class="input-group-text">R$</span><input type="number" class="form-control" id="cEstacionamento" step="0.01" min="0" value="${v('estacionamento')}" oninput="calcResumo()"></div></div>

    ${secTitle('industry','OBSERVAÇÃO DO SETOR')}
    <div class="col-12"><label class="form-label">Acabamento</label><textarea class="form-control" id="cObsAcabamento" rows="2">${v('obs_acabamento')}</textarea></div>

    <div class="col-12 mt-1"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #7c3aed;padding-bottom:4px">
      <i class="fas fa-user-tie" style="color:#7c3aed"></i><strong style="color:#7c3aed">SERVIÇOS DO PAULO</strong>
      <small class="text-muted">(Silk, Caseado, Travete)</small></div></div>

    <div class="col-12"><label class="form-label fw-semibold">SILK — Quantas cores?</label>
      <div class="d-flex align-items-center gap-2 mb-2">
        <select class="form-select form-select-sm" style="width:120px" id="silkQtd" onchange="updateDinamico('silk','silkQtd','silkCampos','Código de Cor',4)">
          <option value="0">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
        </select>
        <small class="text-muted">Selecione a quantidade de cores de SILK</small>
      </div>
      <div id="silkCampos" class="row g-2"></div>
    </div>

    <div class="col-md-4">
      <label class="form-label fw-semibold">CASEADO — Qtd de peças</label>
      <div class="input-group"><input type="number" class="form-control" id="caseadoQtd" min="0" step="1" placeholder="0" value="${v('caseado_qtd')}" oninput="calcPauloTotal()">
      <span class="input-group-text">un</span></div>
    </div>
    <div class="col-md-4">
      <label class="form-label fw-semibold">CASEADO — Valor/peça (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="caseadoVal" min="0" step="0.01" placeholder="0,00" value="${v('caseado_val')}" oninput="calcPauloTotal()"></div>
    </div>
    <div class="col-md-4">
      <label class="form-label fw-semibold">CASEADO — Total (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="caseadoTotal" readonly style="background:#f5f0ff" value="${((parseFloat(c.caseado_qtd)||0)*(parseFloat(c.caseado_val)||0)).toFixed(2)}"></div>
    </div>

    <div class="col-md-4">
      <label class="form-label fw-semibold">TRAVETE — Qtd de peças</label>
      <div class="input-group"><input type="number" class="form-control" id="traveteQtd" min="0" step="1" placeholder="0" value="${v('travete_qtd')}" oninput="calcPauloTotal()">
      <span class="input-group-text">un</span></div>
    </div>
    <div class="col-md-4">
      <label class="form-label fw-semibold">TRAVETE — Valor/peça (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="traveteVal" min="0" step="0.01" placeholder="0,00" value="${v('travete_val')}" oninput="calcPauloTotal()"></div>
    </div>
    <div class="col-md-4">
      <label class="form-label fw-semibold">TRAVETE — Total (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="traveteTotal" readonly style="background:#f5f0ff" value="${((parseFloat(c.travete_qtd)||0)*(parseFloat(c.travete_val)||0)).toFixed(2)}"></div>
    </div>

    <div class="col-12 mt-2"><div class="d-flex align-items-center gap-2 mb-1" style="border-bottom:2px solid #db2777;padding-bottom:4px">
      <i class="fas fa-user-tie" style="color:#db2777"></i><strong style="color:#db2777">SERVIÇOS DA CLAUDIA</strong>
      <small class="text-muted">(Bordado e Corte)</small></div></div>

    <div class="col-12"><label class="form-label fw-semibold">BORDADO — Quantos códigos?</label>
      <div class="d-flex align-items-center gap-2 mb-2">
        <select class="form-select form-select-sm" style="width:120px" id="bordadoQtd" onchange="updateDinamico('bordado','bordadoQtd','bordadoCampos','Código de Cor',5)">
          <option value="0">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        </select>
        <small class="text-muted">Selecione a quantidade de códigos de BORDADO</small>
      </div>
      <div id="bordadoCampos" class="row g-2"></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">BORDADO — Qtd</label>
      <div class="input-group"><input type="number" class="form-control" id="bordadoPecasQtd" min="0" step="1" placeholder="0" value="${v('bordado_pecas_qtd')}" oninput="calcClaudiaTotal()">
      <span class="input-group-text">un</span></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">BORDADO — Valor/un (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="bordadoPecasVal" min="0" step="0.01" placeholder="0,00" value="${v('bordado_pecas_val')}" oninput="calcClaudiaTotal()"></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">BORDADO — Total</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="bordadoPecasTotal" readonly style="background:#fff0f7" value="${((parseFloat(c.bordado_pecas_qtd)||0)*(parseFloat(c.bordado_pecas_val)||0)).toFixed(2)}"></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">CORTE — Qtd</label>
      <div class="input-group"><input type="number" class="form-control" id="corteClaudiaQtd" min="0" step="1" placeholder="0" value="${v('corte_qtd')}" oninput="calcClaudiaTotal()">
      <span class="input-group-text">un</span></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">CORTE — Valor/un (R$)</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="corteClaudiaVal" min="0" step="0.01" placeholder="0,00" value="${v('corte_valor')}" oninput="calcClaudiaTotal()"></div>
    </div>
    <div class="col-md-2"><label class="form-label fw-semibold">CORTE — Total</label>
      <div class="input-group"><span class="input-group-text">R$</span>
      <input type="number" class="form-control" id="corteClaudiaTotal" readonly style="background:#fff0f7" value="${((parseFloat(c.corte_qtd)||0)*(parseFloat(c.corte_valor)||0)).toFixed(2)}"></div>
    </div>

    <div class="col-12"><label class="form-label fw-semibold">COSTURA — Quantas costureiras?</label>
      <div class="d-flex align-items-center gap-2 mb-2">
        <select class="form-select form-select-sm" style="width:120px" id="costuraQtd" onchange="updateCostura()">
          <option value="0">—</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
        </select>
        <small class="text-muted">Selecione a quantidade de costureiras</small>
      </div>
      <div id="costuraCampos" class="row g-2"></div>
      <div id="costuraTotalWrap" class="mt-2" style="display:none">
        <div class="d-flex align-items-center gap-2 p-2 rounded" style="background:#f0f4ff;border:1px solid #c7d2fe">
          <i class="fas fa-calculator text-primary"></i>
          <strong class="text-primary">Total Gasto em Costura: <span id="costuraTotalValor">R$ 0,00</span></strong>
          <small class="text-muted ms-2">(para comparar com o valor de venda)</small>
        </div>
      </div>
    </div>

    <div class="col-12">
      <div class="row g-2 mt-1 p-3 rounded" style="background:#f8f9fa;border:1px solid #dee2e6">
        <div class="col-12 mb-1"><strong><i class="fas fa-calculator me-1 text-primary"></i>RESUMO FINANCEIRO DO PEDIDO</strong></div>
        <div class="col-md-6">
          <div class="p-2 rounded text-center" style="background:#fff3cd;border:1px solid #ffc107">
            <div class="small text-muted fw-semibold">CUSTO TOTAL</div>
            <div class="fs-5 fw-bold text-warning" id="resumoCustoTotal">R$ 0,00</div>
            <div class="small text-muted">Tecido + Aviamentos + Costura + Corte + SILK + Caseado + Travete + Bordado + Operacional</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-2 rounded text-center" style="background:#d1fae5;border:1px solid #10b981">
            <div class="small text-muted fw-semibold">LUCRO ESTIMADO</div>
            <div class="fs-5 fw-bold text-success" id="resumoLucro">R$ 0,00</div>
            <div class="small text-muted">Valor do Pedido − Custo Total</div>
          </div>
        </div>
      </div>
    </div>

  </div>`,
  `<button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
   <button class="btn btn-primary" onclick="salvarCliente(${c.id||0})"><i class="fas fa-save me-1"></i>${c.id?'Atualizar':'Cadastrar'}</button>`,
  'xl'
  );

  if (c.silk_qtd > 0) {
    document.getElementById('silkQtd').value = c.silk_qtd;
    updateDinamico('silk','silkQtd','silkCampos','Código de Cor',4);
    for(let i=1;i<=c.silk_qtd;i++) {
      const el=document.getElementById(`silk_${i}`); if(el) el.value=c[`silk_${i}`]||'';
      const eq=document.getElementById(`silk_qtd_${i}`); if(eq) eq.value=c[`silk_qtd_${i}`]||0;
      const ev=document.getElementById(`silk_val_${i}`); if(ev) ev.value=c[`silk_val_${i}`]||0;
      const et=document.getElementById(`silk_tot_${i}`); if(et) et.value=((c[`silk_qtd_${i}`]||0)*(c[`silk_val_${i}`]||0)).toFixed(2);
    }
  }
  if (c.bordado_qtd > 0) {
    document.getElementById('bordadoQtd').value = c.bordado_qtd;
    updateDinamico('bordado','bordadoQtd','bordadoCampos','Código de Cor',5);
    for(let i=1;i<=c.bordado_qtd;i++) { const el=document.getElementById(`bordado_${i}`); if(el) el.value=c[`bordado_${i}`]||''; }
  }
  if (c.costura_qtd > 0) {
    document.getElementById('costuraQtd').value = c.costura_qtd;
    updateCostura();
    for(let i=1;i<=c.costura_qtd;i++) {
      const en = document.getElementById(`costura_${i}`);       if(en) en.value=c[`costura_${i}`]||'';
      const eq = document.getElementById(`costura_qtd_${i}`);   if(eq) eq.value=c[`costura_qtd_${i}`]||'';
      const ev = document.getElementById(`costura_val_${i}`);   if(ev) ev.value=c[`costura_val_${i}`]||'';
    }
    calcTotalCostura();
  }
  const qtdPecas = [2,3,4,5].filter(i => c[`peca${i}_tipo`]).length + 1;
  const selTipos = document.getElementById('cQtdTipos');
  if (selTipos) { selTipos.value = qtdPecas; renderLinhasPeca(); }

  setTimeout(calcResumo, 150);
}

function updateDinamico(prefixo, selectId, containerId, labelBase, max) {
  const qtd = parseInt(document.getElementById(selectId).value)||0;
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for(let i=1;i<=qtd;i++) {
    if (prefixo === 'silk') {
      container.innerHTML += `
        <div class="col-12">
          <div class="p-2 rounded mb-1" style="background:#f8f9fa;border:1px solid #dee2e6">
            <div class="row g-2 align-items-end">
              <div class="col-md-3"><label class="form-label small mb-1">CÓDIGO DE COR ${i}</label>
                <input class="form-control form-control-sm" id="${prefixo}_${i}" placeholder="Ex: 0001, Azul Royal..."></div>
              <div class="col-md-2"><label class="form-label small mb-1">QUANTIDADE</label>
                <input type="number" class="form-control form-control-sm" id="${prefixo}_qtd_${i}" min="0" step="1" placeholder="0" oninput="calcSilkTotal()"></div>
              <div class="col-md-2"><label class="form-label small mb-1">VALOR/UN (R$)</label>
                <div class="input-group input-group-sm"><span class="input-group-text">R$</span>
                <input type="number" class="form-control" id="${prefixo}_val_${i}" min="0" step="0.01" placeholder="0,00" oninput="calcSilkTotal()"></div></div>
              <div class="col-md-2"><label class="form-label small mb-1">TOTAL</label>
                <div class="input-group input-group-sm"><span class="input-group-text">R$</span>
                <input type="number" class="form-control" id="${prefixo}_tot_${i}" readonly style="background:#f0f4ff"></div></div>
            </div>
          </div>
        </div>`;
    } else {
      container.innerHTML += `<div class="col-md-3"><label class="form-label small">${labelBase} ${i}</label><input class="form-control form-control-sm" id="${prefixo}_${i}" placeholder="${labelBase} ${i}"></div>`;
    }
  }
}

function calcClaudiaTotal() {
  const bordadoQ = parseFloat(document.getElementById('bordadoPecasQtd')?.value)||0;
  const bordadoV = parseFloat(document.getElementById('bordadoPecasVal')?.value)||0;
  const bordadoT = bordadoQ * bordadoV;
  const el1 = document.getElementById('bordadoPecasTotal'); if(el1) el1.value = bordadoT.toFixed(2);

  const corteQ = parseFloat(document.getElementById('corteClaudiaQtd')?.value)||0;
  const corteV = parseFloat(document.getElementById('corteClaudiaVal')?.value)||0;
  const corteT = corteQ * corteV;
  const el2 = document.getElementById('corteClaudiaTotal'); if(el2) el2.value = corteT.toFixed(2);

  calcResumo();
}

function calcPauloTotal() {
  const caseadoQ = parseFloat(document.getElementById('caseadoQtd')?.value)||0;
  const caseadoV = parseFloat(document.getElementById('caseadoVal')?.value)||0;
  const caseadoT = caseadoQ * caseadoV;
  const el1 = document.getElementById('caseadoTotal'); if(el1) el1.value = caseadoT.toFixed(2);

  const traveteQ = parseFloat(document.getElementById('traveteQtd')?.value)||0;
  const traveteV = parseFloat(document.getElementById('traveteVal')?.value)||0;
  const traveteT = traveteQ * traveteV;
  const el2 = document.getElementById('traveteTotal'); if(el2) el2.value = traveteT.toFixed(2);

  calcResumo();
}

function calcSilkTotal() {
  const qtd = parseInt(document.getElementById('silkQtd')?.value)||0;
  let total = 0;
  for(let i=1;i<=qtd;i++) {
    const q = parseFloat(document.getElementById(`silk_qtd_${i}`)?.value)||0;
    const vv = parseFloat(document.getElementById(`silk_val_${i}`)?.value)||0;
    const t = q * vv;
    total += t;
    const el = document.getElementById(`silk_tot_${i}`);
    if (el) el.value = t.toFixed(2);
  }
  calcResumo();
}

function updateCostura() {
  const qtd = parseInt(document.getElementById('costuraQtd').value)||0;
  const container = document.getElementById('costuraCampos');
  const totalWrap = document.getElementById('costuraTotalWrap');
  container.innerHTML = '';
  if (qtd === 0) { totalWrap.style.display='none'; return; }
  totalWrap.style.display='block';
  for(let i=1;i<=qtd;i++) {
    container.innerHTML += `
      <div class="col-12">
        <div class="p-2 rounded mb-1" style="background:#f8f9fa;border:1px solid #dee2e6">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style="width:24px;height:24px;font-size:12px;flex-shrink:0">${i}</span>
            <strong class="small text-primary">COSTUREIRA ${i}</strong>
          </div>
          <div class="row g-2 align-items-end">
            <div class="col-md-4">
              <label class="form-label small mb-1">COSTUREIRA</label>
              <input class="form-control form-control-sm" id="costura_${i}" placeholder="Nome da costureira ${i}">
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-1">QTD. PEÇAS</label>
              <input type="number" class="form-control form-control-sm" id="costura_qtd_${i}" placeholder="0" min="0" oninput="calcTotalCostura()">
            </div>
            <div class="col-md-3">
              <label class="form-label small mb-1">VALOR POR PEÇA (R$)</label>
              <div class="input-group input-group-sm">
                <span class="input-group-text">R$</span>
                <input type="number" class="form-control form-control-sm" id="costura_val_${i}" placeholder="0,00" step="0.01" min="0" oninput="calcTotalCostura()">
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label small mb-1">TOTAL PAGO</label>
              <div class="input-group input-group-sm">
                <span class="input-group-text">R$</span>
                <input type="text" class="form-control form-control-sm bg-light" id="costura_total_${i}" placeholder="0,00" readonly>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }
  calcTotalCostura();
}

function calcTotalCostura() {
  const qtd = parseInt(document.getElementById('costuraQtd')?.value)||0;
  let total = 0;
  for(let i=1;i<=qtd;i++) {
    const pecas = parseFloat(document.getElementById(`costura_qtd_${i}`)?.value)||0;
    const valPeca = parseFloat(document.getElementById(`costura_val_${i}`)?.value)||0;
    const subtotal = pecas * valPeca;
    total += subtotal;
    const elT = document.getElementById(`costura_total_${i}`);
    if (elT) elT.value = subtotal.toFixed(2).replace('.',',');
  }
  const el = document.getElementById('costuraTotalValor');
  if (el) el.textContent = total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  calcResumo();
}

function renderLinhasPeca() {
  const n = parseInt(document.getElementById('cQtdTipos')?.value)||1;
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('pecaLinha'+i);
    if (el) el.style.display = i <= n ? '' : 'none';
  }
}

function calcResumo() {
  const nPecas    = parseInt(document.getElementById('cQtdTipos')?.value)||1;
  const valorTotal = parseFloat(document.getElementById('cValorTotal')?.value)||0;
  let qtdTotal = 0;
  for (let i = 1; i <= nPecas; i++) qtdTotal += parseFloat(document.getElementById(`cQtd${i}`)?.value)||0;

  const qtdC = parseInt(document.getElementById('costuraQtd')?.value)||0;
  let costura = 0;
  const costuraDetalhes = [];
  for(let i=1;i<=qtdC;i++) {
    const nome = document.getElementById(`costura_${i}`)?.value||`Costureira ${i}`;
    const q = parseFloat(document.getElementById(`costura_qtd_${i}`)?.value)||0;
    const vv = parseFloat(document.getElementById(`costura_val_${i}`)?.value)||0;
    const tot = q * vv;
    costura += tot;
    if (tot > 0) costuraDetalhes.push({ nome, tot });
  }
  // Serviços/custos que não são de uma peça específica (calculados antes do
  // loop pra poder ratear em cada peça, proporcional à quantidade dela)
  const operacional = (parseFloat(document.getElementById('cUber')?.value)||0)
                    + (parseFloat(document.getElementById('cAlmoco')?.value)||0)
                    + (parseFloat(document.getElementById('cGasolina')?.value)||0)
                    + (parseFloat(document.getElementById('cEstacionamento')?.value)||0);
  const silkQtdN = parseInt(document.getElementById('silkQtd')?.value)||0;
  let silkTotal = 0;
  for(let s=1;s<=silkQtdN;s++) {
    const sq = parseFloat(document.getElementById(`silk_qtd_${s}`)?.value)||0;
    const sv = parseFloat(document.getElementById(`silk_val_${s}`)?.value)||0;
    silkTotal += sq * sv;
  }
  const caseadoTotal  = (parseFloat(document.getElementById('caseadoQtd')?.value)||0) * (parseFloat(document.getElementById('caseadoVal')?.value)||0);
  const traveteTotal  = (parseFloat(document.getElementById('traveteQtd')?.value)||0) * (parseFloat(document.getElementById('traveteVal')?.value)||0);
  const bordadoCusto  = (parseFloat(document.getElementById('bordadoPecasQtd')?.value)||0) * (parseFloat(document.getElementById('bordadoPecasVal')?.value)||0);
  const corteCusto    = (parseFloat(document.getElementById('corteClaudiaQtd')?.value)||0) * (parseFloat(document.getElementById('corteClaudiaVal')?.value)||0);
  const extrasGlobais = silkTotal + caseadoTotal + traveteTotal + bordadoCusto + corteCusto + operacional;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmtMoney(val); };

  let custoTotal = 0;
  let extrasDistribuidos = 0;
  let costuraDistribuida = 0;
  for (let i = 1; i <= 5; i++) {
    const ativo = i <= nPecas;
    const tec = parseFloat(document.getElementById(`cTecidoValor${i}`)?.value)||0;
    const qtdPeca = parseFloat(document.getElementById(`cQtd${i}`)?.value)||0;
    let aviaSum = 0;
    AVIAMENTOS_LIST.forEach(a => {
      const qtd = parseFloat(document.getElementById(`p${i}_avia_${a.key}_qtd`)?.value)||0;
      const val = parseFloat(document.getElementById(`p${i}_avia_${a.key}_val`)?.value)||0;
      const tot = qtd * val;
      aviaSum += tot;
      setEl(`p${i}_avia_${a.key}_tot`, tot);
    });
    // rateio dos serviços globais (Silk/Caseado/Travete/Bordado/Corte/Operacional)
    // e da Costura, proporcional à quantidade desta peça — senão o custo
    // compartilhado inteiro é somado em cada peça e duplica no Custo Total
    const extraRateio = (ativo && qtdTotal > 0) ? extrasGlobais * (qtdPeca / qtdTotal) : 0;
    const costuraRateio = (ativo && qtdTotal > 0) ? costura * (qtdPeca / qtdTotal) : 0;
    if (ativo) { extrasDistribuidos += extraRateio; costuraDistribuida += costuraRateio; }
    const total = ativo ? (tec + aviaSum + costuraRateio + extraRateio) : 0;
    const qtd   = parseFloat(document.getElementById(`cQtd${i}`)?.value)||0;
    const unit  = (total > 0 && qtd > 0) ? total / qtd : 0;
    setEl(`custoPeca${i}_tecido`,   tec);
    setEl(`custoPeca${i}_avia`,     ativo ? aviaSum      : 0);
    setEl(`custoPeca${i}_costura`,  ativo ? costuraRateio : 0);
    setEl(`custoPeca${i}_extras`,   ativo ? extraRateio   : 0);
    const detEl = document.getElementById(`custoPeca${i}_costuraDetalhe`);
    if (detEl) detEl.innerHTML = ativo && costuraDetalhes.length > 1
      ? costuraDetalhes.map(d=>`${d.nome}: ${fmtMoney(d.tot)}`).join(' | ')
      : '';
    const vendaUnitCampo = parseFloat(document.getElementById(`cVendaValor${i}`)?.value)||0;
    const vendaUnit = vendaUnitCampo > 0 ? vendaUnitCampo
                    : (qtdTotal > 0 ? valorTotal / qtdTotal : 0);
    const receita    = ativo && vendaUnit > 0 ? vendaUnit * qtdPeca : 0;
    const lucro      = ativo && vendaUnit > 0 ? receita - total : null;
    const lucroUnit  = ativo && vendaUnit > 0 ? vendaUnit - unit : null;
    setEl(`custoPeca${i}_total`,    total);
    setEl(`custoPeca${i}_unit`,     unit);
    const setLucro = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val === null) { el.textContent = '—'; el.style.color = ''; return; }
      el.textContent = (val >= 0 ? '+' : '') + fmtMoney(val);
      el.style.color = val >= 0 ? '#059669' : '#dc2626';
    };
    setLucro(`custoPeca${i}_lucro`,     lucro);
    setLucro(`custoPeca${i}_lucroUnit`, lucroUnit);
    if (ativo) custoTotal += total;
  }

  // se não deu pra ratear (nenhuma quantidade preenchida), soma direto pra não perder o valor
  if (qtdTotal <= 0) custoTotal += (extrasGlobais - extrasDistribuidos) + (costura - costuraDistribuida);

  const lucro = valorTotal - custoTotal;
  const elC = document.getElementById('resumoCustoTotal');
  const elL = document.getElementById('resumoLucro');
  if (elC) elC.textContent = fmtMoney(custoTotal);
  if (elL) {
    elL.textContent = fmtMoney(lucro);
    elL.style.color = lucro >= 0 ? '#059669' : '#dc2626';
  }
}

async function salvarCliente(id) {
  if (salvandoCliente) return; // trava contra duplo clique / clique repetido enquanto salva
  const nome = document.getElementById('cNome').value.trim();
  if (!nome) { toast('Nome é obrigatório','danger'); return; }
  salvandoCliente = true;

  const silkQtd    = parseInt(document.getElementById('silkQtd')?.value)||0;
  const bordadoQtd = parseInt(document.getElementById('bordadoQtd')?.value)||0;
  const costuraQtd = parseInt(document.getElementById('costuraQtd')?.value)||0;

  const dinamicos = {};
  for(let i=1;i<=4;i++) {
    dinamicos[`silk_${i}`]     = document.getElementById(`silk_${i}`)?.value||'';
    dinamicos[`silk_qtd_${i}`] = parseFloat(document.getElementById(`silk_qtd_${i}`)?.value)||0;
    dinamicos[`silk_val_${i}`] = parseFloat(document.getElementById(`silk_val_${i}`)?.value)||0;
  }
  for(let i=1;i<=5;i++) dinamicos[`bordado_${i}`] = document.getElementById(`bordado_${i}`)?.value||'';
  let costuraTotal = 0;
  for(let i=1;i<=5;i++) {
    dinamicos[`costura_${i}`]     = document.getElementById(`costura_${i}`)?.value||'';
    dinamicos[`costura_qtd_${i}`] = parseFloat(document.getElementById(`costura_qtd_${i}`)?.value)||0;
    dinamicos[`costura_val_${i}`] = parseFloat(document.getElementById(`costura_val_${i}`)?.value)||0;
    costuraTotal += dinamicos[`costura_qtd_${i}`] * dinamicos[`costura_val_${i}`];
  }
  dinamicos.costura_total = costuraTotal;

  const data = {
    nome,
    cpf_cnpj:       document.getElementById('cCpfCnpj').value.trim(),
    telefone:       document.getElementById('cTel').value,
    endereco:       document.getElementById('cEnd').value,
    data_pedido:    document.getElementById('cDataPedido').value,
    tipo_peca:      document.getElementById('cTipoPeca1').value,
    quantidade:     parseInt(document.getElementById('cQtd1').value)||0,
    tamanhos:       document.getElementById('cTamanhos1').value,
    cores:          document.getElementById('cCores1').value,
    tecido:         document.getElementById('cTecido1').value,
    tecido_qtd:     parseFloat(document.getElementById('cTecidoQtd1')?.value)||0,
    tecido_valor:   parseFloat(document.getElementById('cTecidoValor1').value)||0,
    venda_valor:    parseFloat(document.getElementById('cVendaValor1').value)||0,
    obs_servico:    document.getElementById('cObsServico1').value,
    peca2_tipo:     document.getElementById('cTipoPeca2').value,
    peca2_qtd:      document.getElementById('cQtd2').value,
    peca2_tamanhos: document.getElementById('cTamanhos2').value,
    peca2_cores:    document.getElementById('cCores2').value,
    peca2_tecido:        document.getElementById('cTecido2').value,
    peca2_tecido_qtd:    parseFloat(document.getElementById('cTecidoQtd2')?.value)||0,
    peca2_tecido_valor:  parseFloat(document.getElementById('cTecidoValor2').value)||0,
    peca2_venda_valor:    parseFloat(document.getElementById('cVendaValor2').value)||0,
    peca2_obs:            document.getElementById('cObsServico2').value,
    peca3_tipo:     document.getElementById('cTipoPeca3').value,
    peca3_qtd:      document.getElementById('cQtd3').value,
    peca3_tamanhos: document.getElementById('cTamanhos3').value,
    peca3_cores:    document.getElementById('cCores3').value,
    peca3_tecido:        document.getElementById('cTecido3').value,
    peca3_tecido_qtd:    parseFloat(document.getElementById('cTecidoQtd3')?.value)||0,
    peca3_tecido_valor:  parseFloat(document.getElementById('cTecidoValor3').value)||0,
    peca3_venda_valor:    parseFloat(document.getElementById('cVendaValor3').value)||0,
    peca3_obs:            document.getElementById('cObsServico3').value,
    peca4_tipo:     document.getElementById('cTipoPeca4').value,
    peca4_qtd:      document.getElementById('cQtd4').value,
    peca4_tamanhos: document.getElementById('cTamanhos4').value,
    peca4_cores:    document.getElementById('cCores4').value,
    peca4_tecido:        document.getElementById('cTecido4').value,
    peca4_tecido_qtd:    parseFloat(document.getElementById('cTecidoQtd4')?.value)||0,
    peca4_tecido_valor:  parseFloat(document.getElementById('cTecidoValor4').value)||0,
    peca4_venda_valor:    parseFloat(document.getElementById('cVendaValor4').value)||0,
    peca4_obs:            document.getElementById('cObsServico4').value,
    peca5_tipo:     document.getElementById('cTipoPeca5').value,
    peca5_qtd:      document.getElementById('cQtd5').value,
    peca5_tamanhos: document.getElementById('cTamanhos5').value,
    peca5_cores:    document.getElementById('cCores5').value,
    peca5_tecido:        document.getElementById('cTecido5').value,
    peca5_tecido_qtd:    parseFloat(document.getElementById('cTecidoQtd5')?.value)||0,
    peca5_tecido_valor:  parseFloat(document.getElementById('cTecidoValor5').value)||0,
    peca5_venda_valor:    parseFloat(document.getElementById('cVendaValor5').value)||0,
    peca5_obs:            document.getElementById('cObsServico5').value,
    ...(()=>{
      const avias = {};
      for(let i=1;i<=5;i++){
        const obj = {};
        AVIAMENTOS_LIST.forEach(a=>{
          const qtd = parseFloat(document.getElementById(`p${i}_avia_${a.key}_qtd`)?.value)||0;
          const val = parseFloat(document.getElementById(`p${i}_avia_${a.key}_val`)?.value)||0;
          if(qtd||val) obj[a.key] = {qtd, val, total: parseFloat((qtd*val).toFixed(2))};
        });
        const col = i===1 ? 'peca1_aviamentos' : `peca${i}_aviamentos`;
        avias[col] = JSON.stringify(obj);
      }
      return avias;
    })(),
    data_entrega:   document.getElementById('cDataEntrega').value,
    valor_total:    parseFloat(document.getElementById('cValorTotal').value)||0,
    entrada:        parseFloat(document.getElementById('cEntrada').value)||0,
    forma_pagamento:document.getElementById('cFormaPag').value,
    obs_corte:      document.getElementById('cObsCorte')?.value||'',
    corte_qtd:      parseFloat(document.getElementById('corteClaudiaQtd')?.value)||0,
    corte_valor:    parseFloat(document.getElementById('corteClaudiaVal')?.value)||0,
    uber:           parseFloat(document.getElementById('cUber')?.value)||0,
    almoco:         parseFloat(document.getElementById('cAlmoco')?.value)||0,
    gasolina:       parseFloat(document.getElementById('cGasolina')?.value)||0,
    estacionamento: parseFloat(document.getElementById('cEstacionamento')?.value)||0,
    obs_acabamento: document.getElementById('cObsAcabamento').value,
    silk_qtd:       silkQtd,
    bordado_qtd:    bordadoQtd,
    costura_qtd:    costuraQtd,
    caseado_qtd:    parseFloat(document.getElementById('caseadoQtd')?.value)||0,
    caseado_val:    parseFloat(document.getElementById('caseadoVal')?.value)||0,
    travete_qtd:    parseFloat(document.getElementById('traveteQtd')?.value)||0,
    travete_val:    parseFloat(document.getElementById('traveteVal')?.value)||0,
    bordado_pecas_qtd: parseFloat(document.getElementById('bordadoPecasQtd')?.value)||0,
    bordado_pecas_val: parseFloat(document.getElementById('bordadoPecasVal')?.value)||0,
    ...dinamicos,
    ativo: 1
  };

  try {
    let pedidoId = id;
    if (id) {
      await update('clientes', id, data);
    } else {
      const novo = await insert('clientes', data);
      pedidoId = novo.id;
    }

    const hoje = localDateStr();
    const venc = data.data_entrega || hoje;
    const desc = `${data.tipo_peca||'Uniforme'} — ${nome}`;
    // identificador único do pedido — usado pra achar os custos ligados a ELE,
    // e não a outro pedido que por acaso tenha o mesmo tipo de peça + nome
    const tag  = `#${pedidoId}`;

    if (!id && data.valor_total > 0) {
      const statusRec = data.entrada >= data.valor_total ? 'pago' : 'pendente';
      await insert('contas_receber', {
        descricao: `Venda: ${desc} ${tag}`, cliente: nome,
        valor: data.valor_total, vencimento: venc, status: statusRec, ativo: 1
      });
    }

    const custos = [];
    if (data.tecido_valor > 0) custos.push({ label: 'Tecido', val: data.tecido_valor });

    const nCostureiras = parseInt(data.costura_qtd)||0;
    for (let ci = 1; ci <= nCostureiras; ci++) {
      const nomeCost = dinamicos[`costura_${ci}`] || `Costureira ${ci}`;
      const qCost    = parseFloat(dinamicos[`costura_qtd_${ci}`])||0;
      const vCost    = parseFloat(dinamicos[`costura_val_${ci}`])||0;
      const totCost  = qCost * vCost;
      if (totCost > 0) custos.push({ label: `Costura — ${nomeCost}`, val: totCost, fornecedor: nomeCost });
    }

    let totalAviamentos = 0;
    for (let pi = 1; pi <= 5; pi++) {
      try {
        const avObj = JSON.parse(data[`peca${pi}_aviamentos`] || '{}');
        Object.values(avObj).forEach(vv => { totalAviamentos += (vv.total || (vv.qtd * vv.val) || 0); });
      } catch(e) {}
    }
    if (totalAviamentos > 0) custos.push({ label: 'Aviamentos', val: totalAviamentos });

    const totalCorte = (parseFloat(data.corte_qtd)||0) * (parseFloat(data.corte_valor)||0);
    if (totalCorte > 0) custos.push({ label: 'Corte', val: totalCorte, fornecedor: 'Claudia' });

    let totalSilk = 0;
    for (let s = 1; s <= 4; s++) totalSilk += (parseFloat(data[`silk_qtd_${s}`])||0) * (parseFloat(data[`silk_val_${s}`])||0);
    if (totalSilk > 0) custos.push({ label: 'SILK', val: totalSilk, fornecedor: 'Paulo' });

    const totalBordadoCusto = (parseFloat(data.bordado_pecas_qtd)||0) * (parseFloat(data.bordado_pecas_val)||0);
    if (totalBordadoCusto > 0) custos.push({ label: 'Bordado', val: totalBordadoCusto, fornecedor: 'Claudia' });

    const totalCaseado = (parseFloat(data.caseado_qtd)||0) * (parseFloat(data.caseado_val)||0);
    if (totalCaseado > 0) custos.push({ label: 'Caseado', val: totalCaseado, fornecedor: 'Paulo' });

    const totalTravete = (parseFloat(data.travete_qtd)||0) * (parseFloat(data.travete_val)||0);
    if (totalTravete > 0) custos.push({ label: 'Travete', val: totalTravete, fornecedor: 'Paulo' });

    if (data.uber          > 0) custos.push({ label: 'Uber',           val: data.uber });
    if (data.almoco        > 0) custos.push({ label: 'Almoço',         val: data.almoco });
    if (data.gasolina      > 0) custos.push({ label: 'Gasolina',       val: data.gasolina });
    if (data.estacionamento > 0) custos.push({ label: 'Estacionamento', val: data.estacionamento });

    let descricoesJaPagas = new Set();
    if (id) {
      // busca por duas formas: pelo número do pedido (#id, forma nova e confiável) e
      // pelo texto antigo (tipo de peça + nome, forma antiga — mantida só pra não perder
      // o vínculo com lançamentos criados antes desta correção existir).
      // Usa getAll (não supabaseClient direto) pra respeitar cache e modo demonstração.
      const todosPagar = await getAll('contas_pagar');
      const existentes = todosPagar.filter(e => {
        const d = e.descricao || '';
        return d.includes(` ${tag}`) || d.endsWith(`— ${desc}`);
      });
      const pendentesIds = existentes.filter(e=>e.status==='pendente').map(e=>e.id);
      for (const pid of pendentesIds) { await remove('contas_pagar', pid); }
      // custos já pagos não são recriados, pra não duplicar cobrança de algo que já foi quitado
      descricoesJaPagas = new Set(existentes.filter(e=>e.status==='pago').map(e=>e.descricao));
    }

    for (const c of custos) {
      const descricaoCompleta = `${c.label} — ${desc} ${tag}`;
      const jaEstaPago = [...descricoesJaPagas].some(d => d === descricaoCompleta || d === `${c.label} — ${desc}`);
      if (jaEstaPago) continue;
      await insert('contas_pagar', {
        descricao:  descricaoCompleta,
        fornecedor: c.fornecedor || 'Benetextil',
        valor:      c.val, vencimento: venc, status: 'pendente', ativo: 1
      });
    }
    Cache.clear('contas_pagar');

    const totalCustos = custos.reduce((s,c)=>s+c.val, 0);
    const lucro = data.valor_total - totalCustos;
    if (id) {
      toast(`Pedido atualizado! Custos: ${fmtMoney(totalCustos)} lançados em Contas a Pagar`);
    } else {
      toast(`Pedido cadastrado! ✔ A Receber: ${fmtMoney(data.valor_total)} | Custos: ${fmtMoney(totalCustos)} | Margem: ${fmtMoney(lucro)}`);
    }
    closeModal(); renderClientes();
  } catch(e) { toast(e.message,'danger'); }
  finally { salvandoCliente = false; }
}

async function delCliente(id, nome) {
  if (!confirm(`Excluir o cliente "${nome}"?`)) return;
  await remove('clientes',id); toast('Cliente removido.'); renderClientes();
}
