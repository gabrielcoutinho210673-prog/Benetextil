// ============================================================
// ERP XR WEB — Google Apps Script Backend
// Cole este código em: script.google.com → Novo projeto
// Depois: Implantar → Novo Implantação → App da Web
// Executar como: Eu | Quem tem acesso: Qualquer pessoa
// ============================================================

const SHEETS = {
  clientes:        ['id','nome','cpf_cnpj','telefone','email','endereco','cidade','estado','observacoes','ativo'],
  produtos:        ['id','codigo','nome','categoria','unidade','preco_custo','preco_venda','estoque','estoque_minimo','ativo'],
  categorias:      ['id','nome','ativo'],
  fornecedores:    ['id','nome','cnpj','telefone','email','cidade','estado','ativo'],
  vendas:          ['id','numero','cliente_id','cliente_nome','data','forma_pagamento','subtotal','desconto','total','status'],
  itens_venda:     ['id','venda_id','produto_id','produto_nome','quantidade','preco','desconto','total'],
  caixa:           ['id','data_abertura','data_fechamento','valor_abertura','valor_fechamento','valor_sistema','status'],
  mov_caixa:       ['id','caixa_id','tipo','valor','descricao','data'],
  kardex:          ['id','produto_id','produto_nome','tipo','quantidade','saldo_anterior','saldo_atual','descricao','data'],
  contas_pagar:    ['id','descricao','fornecedor','valor','vencimento','status'],
  contas_receber:  ['id','descricao','cliente','valor','vencimento','status'],
};

function doGet(e) {
  try {
    const p = e.parameter;
    const action = p.action || 'getAll';
    let result;

    switch (action) {
      case 'getAll':    result = getAll(p.sheet, p.filtro); break;
      case 'insert':    result = insert(p.sheet, JSON.parse(decodeURIComponent(p.data))); break;
      case 'update':    result = updateRow(p.sheet, p.id, JSON.parse(decodeURIComponent(p.data))); break;
      case 'delete':    result = softDelete(p.sheet, p.id); break;
      case 'stats':     result = getStats(); break;
      case 'chart':     result = getChartData(); break;
      case 'vendas_recentes': result = getVendasRecentes(); break;
      case 'init':      result = initSheets(); break;
      default:          result = { error: 'Ação inválida' };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Inicializa planilhas e dados de exemplo ───────────────
function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.entries(SHEETS).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1a1d27').setFontColor('#ffffff').setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  });

  // Dados de exemplo
  const catSheet = ss.getSheetByName('categorias');
  if (catSheet.getLastRow() <= 1) {
    const cats = [['Tecidos','Tecidos em geral',1],['Linhas','Linhas e fios',1],['Aviamentos','Botões e zíperes',1],['Ferramentas','Agulhas e alfinetes',1],['Uniformes','Peças prontas',1]];
    cats.forEach((c,i) => catSheet.getRange(i+2,1,1,3).setValues([[i+1,...c]]));
  }

  const cliSheet = ss.getSheetByName('clientes');
  if (cliSheet.getLastRow() <= 1) {
    const clientes = [
      [1,'Consumidor Final','','','','','','','',1],
      [2,'Maria Silva','123.456.789-00','(34) 99999-1111','maria@email.com','Rua das Flores, 10','Uberlândia','MG','',1],
      [3,'Confecções Flores','12.345.678/0001-55','(34) 99999-2222','flores@email.com','Av. Central, 500','Uberlândia','MG','',1],
    ];
    clientes.forEach((c,i) => cliSheet.getRange(i+2,1,1,c.length).setValues([c]));
  }

  const prodSheet = ss.getSheetByName('produtos');
  if (prodSheet.getLastRow() <= 1) {
    const prods = [
      [1,'P001','Tecido Algodão Branco 1m','Tecidos','MT',8.50,18.00,150,20,1],
      [2,'P002','Tecido Malha PV 1m','Malhas','MT',12.00,25.00,80,15,1],
      [3,'P003','Linha Poliéster 100m Branca','Linhas','UN',1.50,4.50,200,50,1],
      [4,'P004','Zipper 20cm Azul','Aviamentos','UN',0.80,2.50,500,100,1],
      [5,'P005','Elástico Largo 2cm/m','Aviamentos','MT',0.50,1.80,300,50,1],
      [6,'P006','Agulha Máquina cx/10','Ferramentas','CX',3.50,9.90,50,10,1],
      [7,'P007','Uniforme Escolar Blusa','Uniformes','UN',22.00,55.00,45,10,1],
      [8,'P008','Uniforme Escolar Calça','Uniformes','UN',28.00,65.00,38,10,1],
    ];
    prods.forEach((p,i) => prodSheet.getRange(i+2,1,1,p.length).setValues([p]));
  }

  // Venda de exemplo
  const vendasSheet = ss.getSheetByName('vendas');
  if (vendasSheet.getLastRow() <= 1) {
    const now = new Date().toISOString();
    vendasSheet.getRange(2,1,1,10).setValues([[1,'000001',1,'Consumidor Final',now,'dinheiro',210,0,210,'fechada']]);
    const itemsSheet = ss.getSheetByName('itens_venda');
    itemsSheet.getRange(2,1,1,8).setValues([[1,1,7,'Uniforme Escolar Blusa',2,55,0,110]]);
    itemsSheet.getRange(3,1,1,8).setValues([[2,1,8,'Uniforme Escolar Calça',1,65,0,65]]);
  }

  return { success: true, msg: 'Planilhas inicializadas com sucesso!' };
}

// ── CRUD genérico ─────────────────────────────────────────
function getAll(sheetName, filtro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // Filtra inativos (exceto tabelas sem campo ativo)
  const hasAtivo = headers.includes('ativo');
  const filtered = hasAtivo ? rows.filter(r => r.ativo != 0) : rows;

  return filtered;
}

function insert(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = SHEETS[sheetName] || Object.keys(data);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1a1d27').setFontColor('#ffffff').setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();

  // Gera ID
  let newId = 1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(Number).filter(n => !isNaN(n));
    newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
  data.id = newId;
  if (SHEETS[sheetName] && SHEETS[sheetName].includes('ativo') && data.ativo === undefined) data.ativo = 1;

  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  sheet.getRange(lastRow + 1, 1, 1, row.length).setValues([row]);

  return { success: true, id: newId };
}

function updateRow(sheetName, id, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { error: 'Planilha não encontrada: ' + sheetName };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idCol]) === String(id)) {
      headers.forEach((h, j) => {
        if (data[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(data[h]);
      });
      return { success: true };
    }
  }
  return { error: 'Registro não encontrado' };
}

function softDelete(sheetName, id) {
  return updateRow(sheetName, id, { ativo: 0 });
}

// ── Stats para o Dashboard ────────────────────────────────
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  let vendasHoje = 0, qtdVendas = 0;

  const vSheet = ss.getSheetByName('vendas');
  if (vSheet && vSheet.getLastRow() > 1) {
    const vData = vSheet.getDataRange().getValues();
    const vh = vData[0];
    const dIdx = vh.indexOf('data'), tIdx = vh.indexOf('total'), sIdx = vh.indexOf('status');
    vData.slice(1).forEach(row => {
      const d = row[dIdx] ? Utilities.formatDate(new Date(row[dIdx]), Session.getScriptTimeZone(), 'yyyy-MM-dd') : '';
      if (d === hoje && row[sIdx] === 'fechada') {
        vendasHoje += parseFloat(row[tIdx]) || 0;
        qtdVendas++;
      }
    });
  }

  let totalProdutos = 0;
  const pSheet = ss.getSheetByName('produtos');
  if (pSheet && pSheet.getLastRow() > 1) {
    const pData = pSheet.getDataRange().getValues();
    const ph = pData[0]; const aIdx = ph.indexOf('ativo');
    totalProdutos = pData.slice(1).filter(r => r[aIdx] != 0).length;
  }

  let totalClientes = 0;
  const cSheet = ss.getSheetByName('clientes');
  if (cSheet && cSheet.getLastRow() > 1) {
    const cData = cSheet.getDataRange().getValues();
    const ch = cData[0]; const aIdx = ch.indexOf('ativo');
    totalClientes = cData.slice(1).filter(r => r[aIdx] != 0).length;
  }

  return { vendasHoje, qtdVendas, totalProdutos, totalClientes };
}

function getChartData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vSheet = ss.getSheetByName('vendas');
  const tz = Session.getScriptTimeZone();
  const byDay = {};

  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    byDay[Utilities.formatDate(d, tz, 'dd/MM')] = 0;
  }

  if (vSheet && vSheet.getLastRow() > 1) {
    const data = vSheet.getDataRange().getValues();
    const h = data[0];
    const dIdx = h.indexOf('data'), tIdx = h.indexOf('total'), sIdx = h.indexOf('status');
    data.slice(1).forEach(row => {
      if (row[sIdx] === 'fechada') {
        const key = Utilities.formatDate(new Date(row[dIdx]), tz, 'dd/MM');
        if (byDay[key] !== undefined) byDay[key] += parseFloat(row[tIdx]) || 0;
      }
    });
  }

  return { labels: Object.keys(byDay), values: Object.values(byDay) };
}

function getVendasRecentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const vSheet = ss.getSheetByName('vendas');
  if (!vSheet || vSheet.getLastRow() <= 1) return [];

  const data = vSheet.getDataRange().getValues();
  const h = data[0];
  const rows = data.slice(1).reverse().slice(0, 10).map(row => {
    const obj = {};
    h.forEach((k, i) => obj[k] = row[i]);
    return obj;
  });
  return rows;
}
