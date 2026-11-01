const $=(x)=>document.getElementById(x);
const BRL=(v)=>Number(v/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const safe=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
const title={dashboard:'Visão geral',clients:'Clientes fictícios',drafts:'Pré-notas simuladas',load:'Testes de carga',guide:'Guia da turma'};
let lastResults=null, busy=false;
const fmt=(n)=>new Intl.NumberFormat('pt-BR').format(n);
function message(v,error=false){const el=$('message');el.textContent=v;el.classList.toggle('error',error)}
async function api(path,method='GET',data){const opts={method,headers:{}};if(data!==undefined){opts.headers['content-type']='application/json';opts.body=JSON.stringify(data)}const response=await fetch(path,opts);let result;try{result=await response.json()}catch{throw Error('Resposta JSON inválida')};if(!response.ok)throw Error(`${result.code||'HTTP'}: ${result.message||response.status}`);return {status:response.status,data:result}}
function page(view){for(const el of document.querySelectorAll('.view'))el.classList.toggle('current',el.id==='view-'+view);for(const el of document.querySelectorAll('.nav'))el.classList.toggle('active',el.dataset.view===view);$('page-title').textContent=title[view];message('');if(view==='clients'||view==='drafts')refresh()}
for(const el of document.querySelectorAll('[data-view]'))el.addEventListener('click',()=>page(el.dataset.view));
async function refresh(){try{const [stats,clients,drafts,events]=await Promise.all([api('/api/metrics'),api('/api/clients?limit=100'),api('/api/drafts?limit=100'),api('/api/events?limit=12')]);
 const s=stats.data;
 $('m-clients').textContent=fmt(s.clients);$('m-drafts').textContent=fmt(s.drafts);$('m-total').textContent=BRL(s.totalCents);$('m-events').textContent=fmt(s.events);
 $('clients-table').innerHTML=clients.data.rows.map(c=>`<tr><td><code>${safe(c.id)}</code></td><td>${safe(c.name)}</td><td><span class="pill">FICTÍCIO</span></td></tr>`).join('')||'<tr><td colspan="3">Nenhum cliente cadastrado.</td></tr>';
 $('drafts-table').innerHTML=drafts.data.rows.map(d=>`<tr><td><code title="${safe(d.id)}">${safe(d.id.slice(0,12))}…</code></td><td>${safe(d.clientName)}</td><td>${BRL(d.totalCents)}</td><td><span class="pill">RASCUNHO</span></td></tr>`).join('')||'<tr><td colspan="4">Nenhuma pré-nota.</td></tr>';
 $('events-list').innerHTML=events.data.rows.map(e=>`<div class="event"><span>${safe(e.eventType)} <small>(${safe(e.entity)})</small></span><small>${new Date(e.occurredAt).toLocaleString('pt-BR')}</small></div>`).join('')||'<span class="hint">Nenhum evento por enquanto.</span>';
 $('client-select').innerHTML='<option value="">Selecione um cliente fictício</option>'+clients.data.rows.map(c=>`<option value="${safe(c.id)}">${safe(c.name)}</option>`).join('');
 }catch(e){message('Erro ao consultar backend: '+e.message,true)}}
$('refresh').addEventListener('click',refresh);
$('client-form').addEventListener('submit',async e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('name');try{const x=await api('/api/clients','POST',{name});e.currentTarget.reset();message('Cliente cadastrado: '+x.data.client.name);await refresh()}catch(err){message(err.message,true)}});
$('draft-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const amount=Number(f.get('price'));const cents=Math.round(amount*100);try{const payload={clientId:f.get('clientId'),idempotencyKey:f.get('key')||crypto.randomUUID(),lines:[{description:f.get('description'),quantity:Number(f.get('quantity')),unitCents:cents}]};const x=await api('/api/drafts','POST',payload);message((x.status===201?'Pré-nota fictícia criada: ':'Requisição idempotente: ')+BRL(x.data.draft.totalCents));await refresh()}catch(err){message(err.message,true)}});
async function seed(clientCount,draftsPerClient){if(busy)return;busy=true;message('Gerando registros fictícios no banco isolado...');const prefix='AULA-'+Date.now();try{const x=await api('/api/demo/seed','POST',{clients:clientCount,draftsPerClient,prefix});message(`Lote criado: ${x.data.createdClients} clientes e ${x.data.createdDrafts} pré-notas fictícias.`);await refresh()}catch(err){message(err.message,true)}finally{busy=false}}
for(const el of document.querySelectorAll('[data-seed]'))el.addEventListener('click',()=>{const [a,b]=el.dataset.seed.split(',').map(Number);seed(a,b)});
$('seed-form').addEventListener('submit',e=>{e.preventDefault();const d=new FormData(e.currentTarget);const a=Number(d.get('clients')),b=Number(d.get('draftsPerClient'));if(a*b>5000)return message('Limite de 5.000 pré-notas por lote',true);seed(a,b)});
function percentile(values,p){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p/100)-1)]}
async function testLoad(){
 if(busy)return;
 const profile=document.querySelector('input[name="profile"]:checked').value;
 const config={light:[5,50],medium:[20,300],heavy:[40,1000]};
 const [parallel,total]=config[profile];
 busy=true;lastResults=null;$('run-load').disabled=true;$('download-results').disabled=true;message('Executando carga HTTP real somente neste servidor local...');
 const id='CARGA-'+Date.now();const lat=[],errors=[],statuses={},started=performance.now();let finished=0,created=0;
 function step(){finished++;$('progress-inner').style.width=`${Math.round(finished/total*100)}%`;$('progress-text').textContent=`${fmt(finished)} / ${fmt(total)} requisições concluídas`}
 try{
  const customers=[];for(let i=0;i<parallel;i++){const r=await api('/api/clients','POST',{id:`${id}-C-${i}`,name:`Empresa 100% Fictícia Carga ${i}`});customers.push(r.data.client.id)}
  await Promise.all(customers.map(async(clientId,i)=>{for(let idx=i;idx<total;idx+=parallel){const t=performance.now();try{
    const r=await api('/api/drafts','POST',{clientId,idempotencyKey:`${id}-DOC-${idx}`,lines:[{description:'Serviço fictício de carga',quantity:1+idx%5,unitCents:75000}]});
    statuses[r.status]=(statuses[r.status]||0)+1;if(r.status!==201)errors.push(`HTTP ${r.status}`);else created++;
   }catch(e){errors.push(e.message)}finally{lat.push(performance.now()-t);step()}}}));
  const elapsed=(performance.now()-started)/1000;
  lastResults={test:'LD Engenharia · simulação de carga HTTP',date:new Date().toISOString(),profile,parallel,requests:total,created,errors:errors.length,errorSamples:errors.slice(0,10),statuses,p50Ms:Number(percentile(lat,50).toFixed(2)),p95Ms:Number(percentile(lat,95).toFixed(2)),p99Ms:Number(percentile(lat,99).toFixed(2)),throughputRps:Number((total/elapsed).toFixed(2)),elapsedSeconds:Number(elapsed.toFixed(3)),backend:'SQLite local, apenas testes, sem emissão fiscal'};
  $('r-total').textContent=fmt(total);$('r-p95').textContent=lastResults.p95Ms+' ms';$('r-errors').textContent=(100*errors.length/total).toFixed(2)+'%';$('r-throughput').textContent=lastResults.throughputRps+' req/s';$('download-results').disabled=false;
  message(`Teste concluído: ${created} pré-notas fictícias criadas, ${errors.length} erros inesperados. p95: ${lastResults.p95Ms} ms.`,errors.length>0);
  await refresh();
 }catch(e){message('Falha na execução: '+e.message,true)}finally{busy=false;$('run-load').disabled=false}
}
$('run-load').addEventListener('click',testLoad);
$('download-results').addEventListener('click',()=>{if(!lastResults)return;const url=URL.createObjectURL(new Blob([JSON.stringify(lastResults,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ld-lab-carga-resultado.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
refresh();
