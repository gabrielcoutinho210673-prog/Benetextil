'use strict';
const PAGINAS_ADMIN = new Set(['dashboard','financeiro','relatorios','pdv','caixa','kardex','produtos','clientescad','contascasa','sublimacao','compras']);

async function conectar() {
  const email = (document.getElementById('loginUser').value || '').trim();
  const senha  = (document.getElementById('loginPass').value || '').trim();
  if (!email || !senha) { showSetupError('Preencha e-mail e senha.'); return; }
  const btn = document.querySelector('#setupScreen button.btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...'; }
  let authData, authError;
  try {
    const resp = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    authData = resp.data; authError = resp.error;
  } catch(e) {
    showSetupError('Erro de conexão. Verifique sua internet.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar'; }
    return;
  }
  if (authError) {
    showSetupError('E-mail ou senha incorretos.');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar'; }
    return;
  }
  await carregarRole(authData.user);
  iniciarApp();
}

async function carregarRole(user) {
  if (!user) { window.APP_ROLE = 'admin'; return; }
  window.APP_EMAIL = user.email || '';
  try {
    const { data: perfil, error } = await supabaseClient.from('perfis').select('role').eq('id', user.id).single();
    if (!error && perfil?.role) {
      window.APP_ROLE = perfil.role;
    } else {
      window.APP_ROLE = user.user_metadata?.role || 'admin';
    }
  } catch(e) {
    window.APP_ROLE = user.user_metadata?.role || 'admin';
  }
}

function usarDemo() {
  DEMO_MODE = true;
  iniciarApp();
}

async function sair() {
  if(confirm('Sair do sistema?')) {
    if (supabaseClient) await supabaseClient.auth.signOut();
    location.reload();
  }
}

function showSetupError(msg) {
  const el = document.getElementById('setupError');
  el.textContent = msg; el.classList.remove('d-none');
}

function aplicarPermissoes() {
  const isOp = window.APP_ROLE === 'operador';
  const hide = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
  const show = id => { const el = document.getElementById(id); if (el) el.style.display = ''; };
  ['menuDashboard','menuMovimento','menuFinanceiro','menuRelatorios','menuClientesCad','menuEstoque'].forEach(show);
  if (isOp) {
    hide('menuDashboard'); hide('menuMovimento'); hide('menuFinanceiro');
    hide('menuRelatorios'); hide('menuClientesCad'); hide('menuEstoque'); hide('menuContasCasa');
  }
  const roleEl = document.getElementById('sbUserRole');
  const nameEl = document.getElementById('sbUserName');
  if (roleEl) roleEl.textContent = isOp ? 'Operador' : 'Admin';
  if (nameEl && window.APP_EMAIL) nameEl.textContent = window.APP_EMAIL.split('@')[0];
}

function iniciarApp() {
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('app').style.display = '';
  document.getElementById('pageDate').textContent = new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  if (!window.APP_ROLE) window.APP_ROLE = 'admin';
  aplicarPermissoes();
  nav(window.APP_ROLE === 'operador' ? 'clientes' : 'dashboard');
}
