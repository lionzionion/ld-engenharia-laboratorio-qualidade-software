// AULA 06: somente servidor local 127.0.0.1:8787. Nunca alterar para Vercel/Supabase/produção.
import http from 'k6/http';
import {check,sleep} from 'k6';
const BASE='http://127.0.0.1:8787';
export const options={vus:10,iterations:150,thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<500']}};
export function setup(){return {run:'K6-'+Date.now()}}
export default function(data){
  const clientId=`${data.run}-C-${__VU}`;
  const client=http.post(`${BASE}/api/clients`,JSON.stringify({id:clientId,name:`Empresa fictícia VU ${__VU}`}),{headers:{'Content-Type':'application/json'}});
  check(client,{'cliente criado ou existente':r=>r.status===201||r.status===200});
  const key=`${data.run}-DOC-${__VU}-${__ITER}`;
  const draft=http.post(`${BASE}/api/drafts`,JSON.stringify({clientId,idempotencyKey:key,lines:[{description:'Visita simulada',quantity:1,unitCents:75000}]}),{headers:{'Content-Type':'application/json'}});
  check(draft,{'pré-nota fictícia criada':r=>r.status===201});
  sleep(0.1);
}
