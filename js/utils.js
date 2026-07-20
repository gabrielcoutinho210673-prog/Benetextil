'use strict';
const localDateStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtMoney    = v => 'R$ ' + parseFloat(v||0).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const parseMoney  = v => parseFloat(String(v).replace(/\./g,'').replace(',','.')) || 0;
const fmtDate     = d => { if(!d) return '—'; const dt=new Date(d); return isNaN(dt)?d:dt.toLocaleDateString('pt-BR'); };
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

function closeModal() { bootstrap.Modal.getInstance(document.getElementById('modalGenerico'))?.hide(); }

function badgeStatus(s) {
  return `<span class="bs bs-${escHtml(s)}">${escHtml(s)}</span>`;
}

function emptyState(icon, msg) {
  return `<tr><td colspan="20" class="text-center text-muted py-5">
    <i class="fas fa-${icon} fa-3x mb-3 d-block opacity-25"></i>${escHtml(msg)}</td></tr>`;
}
