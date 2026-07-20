'use strict';
const Cache = {
  clientes: null, produtos: null, categorias: null, fornecedores: null,
  vendas: null, itens_venda: null, caixa: null, mov_caixa: null,
  kardex: null, contas_pagar: null, contas_receber: null, sublimacao: null,
  compras: null, contas_casa: null, clientes_cad: null, perfis: null,
  clear(sheet) { if(sheet) this[sheet]=null; else Object.keys(this).forEach(k=>{ if(typeof this[k]!=='function') this[k]=null; }); }
};

const DemoData = {
  clientes:[], produtos:[], categorias:[], fornecedores:[], vendas:[],
  itens_venda:[], caixa:[], mov_caixa:[], kardex:[], contas_pagar:[],
  contas_receber:[], sublimacao:[], compras:[], clientes_cad:[]
};

function apiDemo_getAll(sheet) { return (DemoData[sheet] || []).filter(r => r.ativo !== 0); }
function apiDemo_stats() {
  const hoje = new Date().toDateString();
  const vendasHoje = DemoData.vendas.filter(v => v.status==='fechada' && new Date(v.data).toDateString()===hoje);
  return { vendasHoje: vendasHoje.reduce((s,v)=>s+(v.total||0),0), qtdVendas: vendasHoje.length, totalProdutos: DemoData.produtos.length, totalClientes: DemoData.clientes.filter(c=>c.ativo!==0).length };
}
function apiDemo_chart() { const labels=[]; const values=[]; for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);labels.push(d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));values.push(0);} return {labels,values}; }

async function getAll(sheet) {
  if (DEMO_MODE) {
    if (Cache[sheet]) return Cache[sheet];
    Cache[sheet] = apiDemo_getAll(sheet);
    return Cache[sheet];
  }
  if (Cache[sheet]) return Cache[sheet];
  const { data, error } = await supabaseClient.from(sheet).select('*').eq('ativo', 1).order('id', {ascending: false});
  if (error) throw new Error(error.message);
  Cache[sheet] = data || [];
  return Cache[sheet];
}

async function insert(sheet, obj) {
  if (DEMO_MODE) {
    const arr = DemoData[sheet] || [];
    const newId = arr.length ? Math.max(...arr.map(r=>r.id))+1 : 1;
    obj.id = newId; obj.ativo = obj.ativo !== undefined ? obj.ativo : 1;
    arr.push(obj); DemoData[sheet] = arr;
    Cache.clear(sheet);
    return { success:true, id:newId };
  }
  const { data, error } = await supabaseClient.from(sheet).insert(obj).select().single();
  if (error) throw new Error(error.message);
  Cache.clear(sheet);
  return { success:true, id: data.id };
}

async function update(sheet, id, obj) {
  if (DEMO_MODE) {
    const arr = DemoData[sheet] || [];
    const idx = arr.findIndex(r => String(r.id) === String(id));
    if (idx >= 0) Object.assign(arr[idx], obj);
    Cache.clear(sheet);
    return { success:true };
  }
  const { error } = await supabaseClient.from(sheet).update(obj).eq('id', id);
  if (error) throw new Error(error.message);
  Cache.clear(sheet);
  return { success:true };
}

async function remove(sheet, id) {
  if (DEMO_MODE) {
    const arr = DemoData[sheet] || [];
    const idx = arr.findIndex(r => String(r.id) === String(id));
    if (idx >= 0) arr[idx].ativo = 0;
    Cache.clear(sheet);
    return { success:true };
  }
  const { error } = await supabaseClient.from(sheet).update({ativo: 0}).eq('id', id);
  if (error) throw new Error(error.message);
  Cache.clear(sheet);
  return { success:true };
}
