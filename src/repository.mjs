import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {DomainError,err,textField,validateDraft} from './domain.mjs';
const schema=`
CREATE TABLE IF NOT EXISTS clients (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, fictional INTEGER NOT NULL DEFAULT 1 CHECK(fictional=1), created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS draft_invoices (
 id TEXT PRIMARY KEY, client_id TEXT NOT NULL REFERENCES clients(id),
 idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
 total_cents INTEGER NOT NULL CHECK(total_cents>0),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status='draft'),
 kind TEXT NOT NULL DEFAULT 'PRE_NOTA_SIMULADA' CHECK(kind='PRE_NOTA_SIMULADA'),
 created_at TEXT NOT NULL,
 UNIQUE(client_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS draft_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT, draft_id TEXT NOT NULL REFERENCES draft_invoices(id),
 position INTEGER NOT NULL, description TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity>0), unit_cents INTEGER NOT NULL CHECK(unit_cents>0),
 subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents>0), UNIQUE(draft_id,position)
);
CREATE TABLE IF NOT EXISTS domain_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT NOT NULL, entity_id TEXT NOT NULL,
 event_type TEXT NOT NULL, occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_drafts_client_created ON draft_invoices(client_id,created_at);
CREATE INDEX IF NOT EXISTS ix_items_draft ON draft_items(draft_id);
CREATE INDEX IF NOT EXISTS ix_events_entity ON domain_events(entity,entity_id);
`;
export class LabRepository{
 constructor(dbPath=':memory:'){
  if(dbPath!==':memory:')mkdirSync(dirname(resolve(dbPath)),{recursive:true});
  this.db=new DatabaseSync(dbPath);
  this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
  this.db.exec(schema);
 }
 close(){this.db.close()}
 transact(cb){this.db.exec('BEGIN IMMEDIATE');try{const r=cb();this.db.exec('COMMIT');return r}catch(e){this.db.exec('ROLLBACK');throw e}}
 addClient({id=randomUUID(),name}={}){
  id=textField(id,'Identificador do cliente',90);name=textField(name,'Nome do cliente',160);
  const current=this.db.prepare('SELECT * FROM clients WHERE id=?').get(id);
  if(current){if(current.name!==name)err('CLIENT_CONFLICT','ID já cadastrado com outro nome',409);return {created:false,client:current}}
  const c={id,name,fictional:1,created_at:new Date().toISOString()};
  this.db.prepare('INSERT INTO clients(id,name,fictional,created_at) VALUES(?,?,?,?)').run(c.id,c.name,c.fictional,c.created_at);
  this.#event('client',id,'ClientRegistered');return {created:true,client:c};
 }
 #event(entity,id,event_type){this.db.prepare('INSERT INTO domain_events(entity,entity_id,event_type,occurred_at) VALUES(?,?,?,?)').run(entity,id,event_type,new Date().toISOString())}
 getClient(id){const c=this.db.prepare('SELECT * FROM clients WHERE id=?').get(id);if(!c)err('CLIENT_NOT_FOUND','Cliente não encontrado',404);return c}
 listClients(limit=100,offset=0){return this.db.prepare('SELECT * FROM clients ORDER BY created_at DESC,id LIMIT ? OFFSET ?').all(limit,offset)}
 createDraft(raw){
  const validated=validateDraft(raw);
  return this.transact(()=>{
   const client=this.getClient(validated.clientId);
   const existing=this.db.prepare('SELECT * FROM draft_invoices WHERE client_id=? AND idempotency_key=?').get(validated.clientId,validated.idempotencyKey);
   if(existing){if(existing.fingerprint!==validated.fingerprint)err('IDEMPOTENCY_CONFLICT','Chave repetida com conteúdo diferente',409);
     return {created:false,draft:this.getDraft(existing.id)};
   }
   const id=randomUUID(),now=new Date().toISOString();
   this.db.prepare('INSERT INTO draft_invoices(id,client_id,idempotency_key,fingerprint,total_cents,status,kind,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(id,client.id,validated.idempotencyKey,validated.fingerprint,validated.totalCents,'draft','PRE_NOTA_SIMULADA',now);
   const stmt=this.db.prepare('INSERT INTO draft_items(draft_id,position,description,quantity,unit_cents,subtotal_cents) VALUES(?,?,?,?,?,?)');
   validated.lines.forEach((ln,index)=>stmt.run(id,index+1,ln.description,ln.quantity,ln.unitCents,ln.subtotalCents));
   this.#event('draft',id,'InvoiceDraftCreated');return {created:true,draft:this.getDraft(id)};
  });
 }
 getDraft(id){
  const doc=this.db.prepare(`SELECT d.id,d.client_id AS clientId,c.name AS clientName,d.total_cents AS totalCents,d.status,d.kind,d.created_at AS createdAt FROM draft_invoices d JOIN clients c ON c.id=d.client_id WHERE d.id=?`).get(id);
  if(!doc)err('DRAFT_NOT_FOUND','Pré-nota não encontrada',404);
  const lines=this.db.prepare('SELECT description,quantity,unit_cents AS unitCents,subtotal_cents AS subtotalCents FROM draft_items WHERE draft_id=? ORDER BY position').all(id);
  return {...doc,lines};
 }
 listDrafts({clientId,limit=100,offset=0}={}){
  if(clientId){this.getClient(clientId);return this.db.prepare(`SELECT d.id,d.client_id AS clientId,c.name AS clientName,d.total_cents AS totalCents,d.status,d.kind,d.created_at AS createdAt FROM draft_invoices d JOIN clients c ON c.id=d.client_id WHERE d.client_id=? ORDER BY d.created_at DESC,d.id LIMIT ? OFFSET ?`).all(clientId,limit,offset)}
  return this.db.prepare(`SELECT d.id,d.client_id AS clientId,c.name AS clientName,d.total_cents AS totalCents,d.status,d.kind,d.created_at AS createdAt FROM draft_invoices d JOIN clients c ON c.id=d.client_id ORDER BY d.created_at DESC,d.id LIMIT ? OFFSET ?`).all(limit,offset);
 }
 stats(){
  const clients=Number(this.db.prepare('SELECT COUNT(*) AS n FROM clients').get().n);
  const drafts=Number(this.db.prepare('SELECT COUNT(*) AS n FROM draft_invoices').get().n);
  const totalCents=Number(this.db.prepare('SELECT COALESCE(SUM(total_cents),0) AS n FROM draft_invoices').get().n);
  const events=Number(this.db.prepare('SELECT COUNT(*) AS n FROM domain_events').get().n);
  const pageCount=Number(this.db.prepare('PRAGMA page_count').get().page_count);
  const pageSize=Number(this.db.prepare('PRAGMA page_size').get().page_size);
  return {clients,drafts,totalCents,events,dbSizeBytes:pageCount*pageSize,environment:'isolated-sqlite',fiscalEmission:false};
 }
 recentEvents(limit=20){return this.db.prepare('SELECT entity,entity_id AS entityId,event_type AS eventType,occurred_at AS occurredAt FROM domain_events ORDER BY id DESC LIMIT ?').all(limit)}
 seed({clients=10,draftsPerClient=4,prefix='DEMO'}={}){
  if(!Number.isSafeInteger(clients)||clients<1||clients>500||!Number.isSafeInteger(draftsPerClient)||draftsPerClient<1||draftsPerClient>20||clients*draftsPerClient>5000)err('INVALID_SEED','Limites: 1–500 clientes, 1–20 pré-notas/cliente e máximo 5.000 pré-notas');
  prefix=textField(prefix,'Prefixo',45);
  let createdClients=0,createdDrafts=0;
  for(let i=1;i<=clients;i++){
   const id=`${prefix}-C-${String(i).padStart(5,'0')}`;
   if(this.addClient({id,name:`Empresa Fictícia ${prefix} ${i}`}).created)createdClients++;
   for(let j=1;j<=draftsPerClient;j++){
    const lines=[{description:'Acompanhamento técnico FICTÍCIO',quantity:(j%4)+1,unitCents:75000}];
    if(this.createDraft({clientId:id,idempotencyKey:`${prefix}-NF-${i}-${j}`,lines}).created)createdDrafts++;
   }
  }
  return {createdClients,createdDrafts,...this.stats()};
 }
}
