/** CARGA CONTROLADA: somente servidores 127.0.0.1 instanciados pelo script. */
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {createApp} from '../src/server.mjs';
import {percentile} from '../src/domain.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stress=process.argv.includes('--stress');
const profiles=stress?[{name:'estresse-controlado',clients:100,drafts:5000,workers:100}]:[
 {name:'leve',clients:25,drafts:250,workers:10},
 {name:'normal',clients:80,drafts:800,workers:25},
 {name:'pico',clients:150,drafts:1600,workers:50}
];
const post=async(base,path,payload)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});let data;try{data=await r.json()}catch{data={}};return {status:r.status,data}};
async function run(profile){
 const folder=mkdtempSync(join(tmpdir(),'ld-carga-'));const app=createApp({dbPath:join(folder,'isolated.sqlite')});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${app.server.address().port}`;
 try{
  const clients=[];for(let i=0;i<profile.clients;i++){const id=`CARGA-${i}`;const r=await post(base,'/api/clients',{id,name:`Empresa Fictícia ${i}`});if(r.status!==201)throw Error(`Falha criando cliente ${i}: ${r.status}`);clients.push(id)}
  const durations=[];const errors=[];let created=0,replayed=0,finished=0;
  const started=performance.now();
  await Promise.all(Array.from({length:profile.workers},(_,w)=> (async()=>{
   for(let i=w;i<profile.drafts;i+=profile.workers){const body={clientId:clients[i%clients.length],idempotencyKey:`DOC-${i}`,lines:[{description:'Acompanhamento fictício',quantity:(i%5)+1,unitCents:75000}]};const st=performance.now();
    try{const v=await post(base,'/api/drafts',body);durations.push(performance.now()-st);if(v.status===201)created++;else if(v.status===200)replayed++;else errors.push({i,status:v.status,code:v.data?.code});}catch(e){errors.push({i,error:e.message})}finally{finished++}
   }
  })()));
  const secs=(performance.now()-started)/1000;
  const metrics=(await fetch(base+'/api/metrics')).json();const state=await metrics;
  const result={scenario:profile.name,clients:profile.clients,virtualUsers:profile.workers,requests:profile.drafts,created,replayed,unexpectedErrors:errors.length,serverDrafts:state.drafts,consistent:created===state.drafts&&created===profile.drafts&&errors.length===0,elapsedSeconds:+secs.toFixed(3),throughputRps:+(profile.drafts/secs).toFixed(2),p50Ms:+percentile(durations,50).toFixed(2),p95Ms:+percentile(durations,95).toFixed(2),p99Ms:+percentile(durations,99).toFixed(2),errorSamples:errors.slice(0,5),dbSizeBytes:state.dbSizeBytes,environment:'Node 22 + SQLite local, temporário, sem NFS-e real'};
  if(!result.consistent)process.exitCode=1;
  return result;
 } finally {await app.close();rmSync(folder,{recursive:true,force:true})}
}
const reports=[];for(const p of profiles){console.log(`Executando carga ${p.name} (${p.drafts} requisições, ${p.workers} virtuais)...`);const r=await run(p);reports.push(r);console.log(JSON.stringify(r,null,2))}
mkdirSync(join(ROOT,'results'),{recursive:true});
const file=stress?'load-stress.local.json':'load-measured.local.json';writeFileSync(join(ROOT,'results',file),JSON.stringify({runAt:new Date().toISOString(),reports},null,2));
console.log(`\nRelatório salvo: results/${file}`);
