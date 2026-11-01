import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {LabRepository} from './repository.mjs';
import {DomainError} from './domain.mjs';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const pub=join(base,'public');
const MAX_BODY=32*1024;
const staticPaths={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/styles.css':['styles.css','text/css; charset=utf-8']};
const json=(res,code,value)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','X-Lab-Only':'simulation-no-fiscal-value','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value))};
async function readJson(req){
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new DomainError('UNSUPPORTED_MEDIA','Use application/json',415);
  let len=0;const b=[];
  for await(const chunk of req){len+=chunk.length;if(len>MAX_BODY)throw new DomainError('BODY_TOO_LARGE','Limite de 32 KB',413);b.push(chunk)}
  try{return JSON.parse(Buffer.concat(b).toString('utf8'))}catch{throw new DomainError('INVALID_JSON','JSON inválido',400)}
}
const bounded=(q,k,fallback,max)=>{const raw=q.get(k);if(raw===null)return fallback;const n=Number(raw);if(!Number.isSafeInteger(n)||n<0||n>max)throw new DomainError('INVALID_PAGE',`${k} fora do limite`,400);return n};
export function createApp({dbPath=':memory:'}={}){
 const repo=new LabRepository(dbPath);
 const server=createServer(async(req,res)=>{
  try{
   const {pathname,searchParams}=new URL(req.url||'/','http://localhost');
   if(req.method==='GET'&&staticPaths[pathname]){
    const [file,type]=staticPaths[pathname];res.writeHead(200,{'content-type':type,'cache-control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});return res.end(readFileSync(join(pub,file)));
   }
   if(req.method==='GET'&&pathname==='/favicon.ico'){res.writeHead(204);return res.end()}
   if(req.method==='GET'&&pathname==='/api/health')return json(res,200,{ok:true,mode:'LOCAL_ISOLATED',fiscalEmission:false,backend:'Node.js + SQLite'});
   if(req.method==='GET'&&pathname==='/api/metrics')return json(res,200,{...repo.stats(),heapBytes:process.memoryUsage().heapUsed});
   if(req.method==='GET'&&pathname==='/api/events')return json(res,200,{rows:repo.recentEvents(bounded(searchParams,'limit',15,50))});
   if(req.method==='GET'&&pathname==='/api/clients')return json(res,200,{rows:repo.listClients(bounded(searchParams,'limit',100,100),bounded(searchParams,'offset',0,1000000))});
   if(req.method==='POST'&&pathname==='/api/clients'){const r=repo.addClient(await readJson(req));return json(res,r.created?201:200,r)}
   if(req.method==='GET'&&pathname==='/api/drafts')return json(res,200,{rows:repo.listDrafts({clientId:searchParams.get('clientId')||undefined,limit:bounded(searchParams,'limit',100,100),offset:bounded(searchParams,'offset',0,1000000)})});
   if(req.method==='POST'&&pathname==='/api/drafts'){const r=repo.createDraft(await readJson(req));return json(res,r.created?201:200,r)}
   if(req.method==='GET'&&pathname.startsWith('/api/drafts/'))return json(res,200,repo.getDraft(decodeURIComponent(pathname.slice('/api/drafts/'.length))));
   if(req.method==='POST'&&pathname==='/api/demo/seed')return json(res,200,repo.seed(await readJson(req)));
   return json(res,404,{code:'ENDPOINT_NOT_FOUND',message:'Rota não encontrada'});
  }catch(e){if(e instanceof DomainError)return json(res,e.status,{code:e.code,message:e.message});
   if(e?.code?.startsWith('SQLITE_CONSTRAINT'))return json(res,409,{code:'CONSTRAINT_CONFLICT',message:'Conflito de integridade no banco de dados'});
   console.error('[LAB_ERROR]',e);return json(res,500,{code:'INTERNAL_ERROR',message:'Falha interna do laboratório'});
  }
 });
 return {server,repo,close:()=>new Promise((resolve,reject)=>server.close(e=>{if(e)reject(e);else{repo.close();resolve()}}))};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const path=process.env.LAB_DB_PATH||join(base,'.data','ld_laboratorio.sqlite');
 const port=Number(process.env.LAB_PORT||8787);
 const app=createApp({dbPath:path});
 app.server.listen(port,'127.0.0.1',()=>console.log(`\nLD LAB — SIMULAÇÃO SEM VALOR FISCAL\nAbra: http://127.0.0.1:${app.server.address().port}\nBanco isolado: ${path}\nPara interromper: Ctrl+C\n`));
}
