'use strict';

// Gera a "Ordem de Fornecimento" em PDF a partir de um pedido de Uniforme ou
// Sublimação, seguindo o modelo padrão da Benetextil. Campos corporativos que
// não se aplicam ao negócio (Centro de Custo, ICMS, IPI, Frete, Transportador,
// dados fixos da própria empresa) ficam no layout mas em branco, prontos pra
// preencher à mão se um dia for preciso.
function gerarOrdemFornecimento(tipo, r) {
  if (!window.jspdf) { toast('Biblioteca de PDF não carregou. Tente recarregar a página.', 'danger'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const M = 12;
  const pageW = 210;
  const contentW = pageW - 2 * M;
  const rowH = 6.5;
  let y = M;

  const secao = (titulo) => {
    doc.setFillColor(25, 25, 25);
    doc.rect(M, y, contentW, 5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold'); doc.setFontSize(8);
    doc.text(titulo, M + 2, y + 3.5);
    doc.setTextColor(0, 0, 0);
    y += 5;
  };

  const campo = (x, w, label, valor) => {
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, y, w, rowH);
    doc.setFillColor(240, 240, 240);
    const lw = Math.min(38, w * 0.42);
    doc.rect(x, y, lw, rowH, 'F');
    doc.setFont(undefined, 'bold'); doc.setFontSize(6.5);
    doc.text(label, x + 1.5, y + rowH / 2 + 1.2);
    doc.setFont(undefined, 'normal'); doc.setFontSize(7.5);
    if (valor) doc.text(String(valor), x + lw + 2, y + rowH / 2 + 1.2);
  };

  const linha2 = (labelA, valorA, labelB, valorB) => {
    campo(M, contentW / 2, labelA, valorA);
    campo(M + contentW / 2, contentW / 2, labelB, valorB);
    y += rowH;
  };

  // Cabeçalho
  doc.setFont(undefined, 'bold'); doc.setFontSize(15);
  doc.text('BENETEXTIL UNIFORMES', M, y + 5);
  doc.setFont(undefined, 'italic'); doc.setFontSize(8.5);
  doc.text('Confecção e Fornecimento de Uniformes', M, y + 10);

  doc.setFont(undefined, 'bold'); doc.setFontSize(10.5);
  doc.text('ORDEM DE FORNECIMENTO', pageW - M, y + 5, { align: 'right' });
  doc.setFont(undefined, 'normal'); doc.setFontSize(8.5);
  doc.text(`Nº ${r.id || ''}     Data: ${fmtDate(r.data_pedido)}`, pageW - M, y + 10, { align: 'right' });
  y += 15;
  doc.setDrawColor(180, 150, 60); doc.setLineWidth(0.8);
  doc.line(M, y, pageW - M, y);
  y += 4;

  // Dados do fornecedor (a própria Benetextil — sem cadastro de empresa ainda,
  // fica em branco pra preencher à mão até existir esse dado no sistema)
  secao('DADOS DO FORNECEDOR');
  linha2('CÓDIGO', '', 'CNPJ', '');
  linha2('RAZÃO SOCIAL', '', 'NOME FANTASIA', 'BENETEXTIL UNIFORMES');
  campo(M, contentW, 'ENDEREÇO', ''); y += rowH;
  linha2('CIDADE / UF', '', 'TELEFONE', '');
  campo(M, contentW, 'E-MAIL', ''); y += rowH + 3;

  // Dados do pedido
  secao('DADOS DO PEDIDO');
  linha2('EMISSÃO', fmtDate(r.data_pedido), 'ENTREGA', fmtDate(r.data_entrega));
  linha2('CENTRO DE CUSTO', '', 'CENTRO DE EVENTO', '');
  linha2('COMPROMISSO', '', 'APLICAÇÃO', '');
  y += 3;

  // Itens do pedido
  secao('ITENS DO PEDIDO');
  y += 1;
  const itens = tipo === 'uniforme' ? _ofItensUniforme(r) : _ofItensSublimacao(r);
  doc.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [['Item', 'Produto', 'Descrição', 'Qtd/Un.', '% IPI', 'Preço Un.', 'Valor Item']],
    body: itens.map((it, i) => [i + 1, it.produto, it.descricao || '-', it.qtd, '', fmtMoney(it.precoUn), fmtMoney(it.valorItem)]),
    styles: { fontSize: 7, cellPadding: 1.4, lineColor: [180, 180, 180] },
    headStyles: { fillColor: [235, 235, 235], textColor: 0, fontStyle: 'bold' },
    theme: 'grid'
  });
  y = doc.lastAutoTable.finalY + 3;

  const valorTotal = parseFloat(r.valor_total ?? r.valor_venda) || 0;

  linha2('VALOR ICMS', 'R$', 'TAXA FINANCEIRA', '');
  linha2('DESCONTO', 'R$', 'VALOR FRETE', 'R$');
  linha2('FORMA DE PAGAMENTO', r.forma_pagamento || '', 'CONDIÇÃO PAGTO.', '');

  doc.setFillColor(25, 25, 25);
  doc.rect(M, y, contentW / 2, rowH + 1, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold'); doc.setFontSize(7.5);
  doc.text('VALOR TOTAL', M + 2, y + rowH / 2 + 1.7);
  doc.setFillColor(180, 150, 60);
  doc.rect(M + contentW / 2, y, contentW / 2, rowH + 1, 'F');
  doc.text(fmtMoney(valorTotal), M + contentW / 2 + contentW / 4, y + rowH / 2 + 1.7, { align: 'center' });
  doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');
  y += rowH + 1 + 4;

  if (y > 250) { doc.addPage(); y = M; }

  // Transportador
  secao('TRANSPORTADOR');
  campo(M, contentW * 0.7, 'NOME', '');
  campo(M + contentW * 0.7, contentW * 0.3, 'FRETE POR CONTA', '');
  y += rowH + 3;

  // Condições financeiras — usa entrada/saldo já cadastrados no pedido
  secao('CONDIÇÕES FINANCEIRAS');
  y += 1;
  const entrada = parseFloat(r.entrada) || 0;
  const saldo = valorTotal - entrada;
  const parcelas = [];
  if (entrada > 0) parcelas.push(['Entrada', fmtDate(r.data_pedido), fmtMoney(entrada)]);
  if (saldo > 0) parcelas.push(['Saldo', r.data_entrega ? fmtDate(r.data_entrega) : '-', fmtMoney(saldo)]);
  if (!parcelas.length) parcelas.push(['Único', fmtDate(r.data_entrega || r.data_pedido), fmtMoney(valorTotal)]);
  doc.autoTable({
    startY: y,
    margin: { left: M, right: M },
    head: [['Parcela', 'Vencimento', 'Valor da Parcela']],
    body: parcelas,
    styles: { fontSize: 7, cellPadding: 1.4, lineColor: [180, 180, 180] },
    headStyles: { fillColor: [235, 235, 235], textColor: 0, fontStyle: 'bold' },
    theme: 'grid'
  });
  y = doc.lastAutoTable.finalY + 4;

  if (y > 250) { doc.addPage(); y = M; }

  // Observações
  secao('OBSERVAÇÕES');
  campo(M, contentW, 'COND. PAGAMENTO', r.forma_pagamento || ''); y += rowH;
  campo(M, contentW, 'E-MAIL NF-E / XML', ''); y += rowH;

  // Página de assinatura
  doc.addPage();
  y = M;
  doc.setFillColor(235, 235, 235); doc.rect(M, y, contentW, 6, 'F');
  doc.setFont(undefined, 'bold'); doc.setFontSize(8); doc.setTextColor(0, 0, 0);
  doc.text('BOLETO', M + 2, y + 4);
  y += 11;
  doc.setFont(undefined, 'italic'); doc.setFontSize(8); doc.setTextColor(150, 120, 20);
  doc.text('Favor constar em sua Nota Fiscal o número desta Ordem de Fornecimento.', M, y);
  doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');
  y += 6;
  doc.setDrawColor(180, 180, 180);
  doc.rect(M, y, contentW, 16);
  doc.setFontSize(8);
  doc.text(`Comprador: ${r.nome_cliente || r.nome || ''}`, M + 2, y + 6);
  doc.text('Solicitante: ____________________________', M + 2, y + 13);
  doc.setFont(undefined, 'bold');
  doc.text('Assinatura Autorizada', M + contentW * 0.73, y + 9, { align: 'center' });
  doc.setFont(undefined, 'normal');
  y += 26;
  doc.setDrawColor(180, 150, 60); doc.setLineWidth(0.8);
  doc.line(M, y, pageW - M, y);
  y += 8;
  doc.setFont(undefined, 'bold'); doc.setFontSize(9);
  doc.text('BENETEXTIL UNIFORMES', pageW / 2, y, { align: 'center' });
  y += 5;
  doc.setFont(undefined, 'normal'); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
  doc.text('Endereço: ________________________________________  CNPJ: ______________________', pageW / 2, y, { align: 'center' });
  y += 4;
  doc.text('Telefone: ______________________  E-mail: ________________________________________', pageW / 2, y, { align: 'center' });

  const nomeCliente = (r.nome_cliente || r.nome || 'pedido').replace(/[^a-zA-Z0-9]+/g, '_');
  doc.save(`Ordem_Fornecimento_${nomeCliente}_${r.id || ''}.pdf`);
}

function _ofItensUniforme(r) {
  const valorTotal = parseFloat(r.valor_total) || 0;
  const brutos = [];
  for (let i = 1; i <= 5; i++) {
    const tipoPeca = i === 1 ? r.tipo_peca : r[`peca${i}_tipo`];
    const qtd = parseFloat(i === 1 ? r.quantidade : r[`peca${i}_qtd`]) || 0;
    if (!tipoPeca && qtd <= 0) continue;
    const tecido    = i === 1 ? r.tecido    : r[`peca${i}_tecido`];
    const cores     = i === 1 ? r.cores     : r[`peca${i}_cores`];
    const tamanhos  = i === 1 ? r.tamanhos  : r[`peca${i}_tamanhos`];
    const precoCampo = parseFloat(i === 1 ? r.venda_valor : r[`peca${i}_venda_valor`]) || 0;
    brutos.push({
      produto: tipoPeca || `Peça ${i}`,
      descricao: [tecido, cores, tamanhos].filter(Boolean).join(' — '),
      qtd, precoCampo
    });
  }
  if (!brutos.length) return [{ produto: 'Uniforme', descricao: '', qtd: 1, precoUn: valorTotal, valorItem: valorTotal }];
  const qtdTotal = brutos.reduce((s, b) => s + b.qtd, 0);
  const precoMedio = qtdTotal > 0 ? valorTotal / qtdTotal : 0;
  return brutos.map(b => {
    const precoUn = b.precoCampo > 0 ? b.precoCampo : precoMedio;
    return { produto: b.produto, descricao: b.descricao, qtd: b.qtd, precoUn, valorItem: precoUn * b.qtd };
  });
}

function _ofItensSublimacao(r) {
  const qtd = parseFloat(r.qtd_metro) || 0;
  const precoUn = parseFloat(r.valor_metro) || 0;
  return [{
    produto: 'Sublimação',
    descricao: [r.descricao, r.tecido, r.cod_cor].filter(Boolean).join(' — '),
    qtd, precoUn, valorItem: qtd * precoUn
  }];
}
