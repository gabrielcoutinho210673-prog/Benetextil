'use strict';
const mesesComAno = (datas) => {
  const set = new Set();
  const ano = new Date().getFullYear();
  for (let m = 1; m <= 12; m++) set.add(`${ano}-${String(m).padStart(2,'0')}`);
  (datas || []).forEach(d => { if (d && /^\d{4}-\d{2}/.test(d)) set.add(d.slice(0,7)); });
  return Array.from(set).sort().reverse();
};
const localDateStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtMoney    = v => 'R$ ' + parseFloat(v||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const parseMoney  = v => parseFloat(String(v).replace(/\./g,'').replace(',','.')) || 0;
// 'AAAA-MM-DD' puro é lido como UTC pelo Date, o que no Brasil mostraria o dia anterior
const fmtDate     = d => { if(!d) return '—'; const dt=new Date(/^\d{4}-\d{2}-\d{2}$/.test(d)?d+'T00:00:00':d); return isNaN(dt)?d:dt.toLocaleDateString('pt-BR'); };
const somaDias    = (dataStr, dias) => { if(!dataStr) return ''; const d=new Date(dataStr+'T00:00:00'); d.setDate(d.getDate()+dias); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// Cronograma de pagamento do pedido: entrada + saldo em N parcelas a cada X dias.
// Pedidos sem esses campos continuam como antes: entrada na data do pedido e
// saldo em 1x na data de entrega.
function condicoesPagamento(r) {
  const total     = parseFloat(r.valor_total ?? r.valor_venda) || 0;
  const entrada   = Math.min(parseFloat(r.entrada) || 0, total);
  const n         = Math.max(parseInt(r.parcelas_qtd) || 1, 1);
  const intervalo = parseInt(r.parcelas_intervalo) || 30;
  const primeiro  = r.parcelas_primeiro_venc || r.data_entrega || r.data_pedido || '';
  const saldo     = Math.round((total - entrada) * 100) / 100;

  const linhas = [];
  if (entrada > 0) linhas.push({ label: 'Entrada', venc: r.entrada_data || r.data_pedido || '', valor: entrada });
  if (saldo > 0) {
    const base = Math.floor(saldo / n * 100) / 100;
    for (let i = 0; i < n; i++) {
      const valor = i === n - 1 ? Math.round((saldo - base * (n - 1)) * 100) / 100 : base;
      linhas.push({ label: n > 1 ? `Parcela ${i + 1}/${n}` : 'Saldo', venc: somaDias(primeiro, i * intervalo), valor });
    }
  }
  if (!linhas.length) linhas.push({ label: 'Único', venc: r.data_entrega || r.data_pedido || '', valor: total });

  let resumo;
  const parcelado = n > 1 ? `${n}x de ${fmtMoney(saldo / n)} (a cada ${intervalo} dias, 1ª em ${fmtDate(primeiro)})` : `saldo de ${fmtMoney(saldo)} em ${fmtDate(primeiro)}`;
  if (entrada > 0 && saldo > 0) resumo = `Entrada de ${fmtMoney(entrada)} + ${parcelado}`;
  else if (entrada > 0)         resumo = `À vista — ${fmtMoney(entrada)} em ${fmtDate(r.entrada_data || r.data_pedido)}`;
  else if (n > 1)               resumo = parcelado.charAt(0).toUpperCase() + parcelado.slice(1);
  else                          resumo = `Pagamento único de ${fmtMoney(total)} em ${fmtDate(linhas[0].venc)}`;
  if (r.forma_pagamento) resumo = `${r.forma_pagamento} — ${resumo}`;

  return { linhas, resumo };
}
const fmtDateTime = d => { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleString('pt-BR'); };
const escHtml     = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function toast(msg, type='success') {
  const id = 'toast_'+Date.now();
  const icon = type==='success'?'check-circle':'exclamation-circle';
  document.getElementById('toastContainer').insertAdjacentHTML('beforeend',
    `<div id="${id}" class="toast show align-items-center text-white bg-${type==='success'?'success':type==='warning'?'warning':'danger'} border-0 mb-2" role="alert">
      <div class="d-flex p-2 gap-2 align-items-center">
        <i class="fas fa-${icon}"></i><div class="toast-body py-0 px-0 flex-grow-1">${escHtml(msg)}</div>
        <button type="button" class="btn-close btn-close-white" onclick="document.getElementById('${id}').remove()"></button>
      </div>
    </div>`
  );
  setTimeout(() => document.getElementById(id)?.remove(), 4000);
}

function loading() {
  return `<div class="spinner-wrap"><div class="spinner-border text-primary"></div></div>`;
}

function openModal(titulo, corpo, rodape='', size='') {
  document.getElementById('modalTitulo').innerHTML = titulo;
  document.getElementById('modalCorpo').innerHTML = corpo;
  document.getElementById('modalRodape').innerHTML = rodape;
  document.getElementById('modalDialogSize').className = 'modal-dialog' + (size?' modal-'+size:'');
  new bootstrap.Modal(document.getElementById('modalGenerico')).show();
}

function reabrirModal(fn) {
  const el = document.getElementById('modalGenerico');
  el.addEventListener('hidden.bs.modal', () => fn(), { once: true });
  closeModal();
}

function closeModal() { bootstrap.Modal.getInstance(document.getElementById('modalGenerico'))?.hide(); }

function badgeStatus(s) {
  return `<span class="bs bs-${escHtml(s)}">${escHtml(s)}</span>`;
}

function emptyState(icon, msg) {
  return `<tr><td colspan="20" class="text-center text-muted py-5">
    <i class="fas fa-${icon} fa-3x mb-3 d-block opacity-25"></i>${escHtml(msg)}</td></tr>`;
}
