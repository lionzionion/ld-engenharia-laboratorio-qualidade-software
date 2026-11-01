import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LabRepository} from '../src/repository.mjs';
// Testes comportamentais com nomes Dado/Quando/Então; especificações Gherkin em docs/cenarios.feature.
const cli={id:'EMP-FICTICIA',name:'Empresa fictícia para a aula'};
const pre={clientId:cli.id,idempotencyKey:'DOC-100',lines:[{description:'Visita técnica',quantity:2,unitCents:50000}]};
test('BDD | Dado um cliente existente, quando registrar pré-nota, então registrar com seu valor total',()=>{const r=new LabRepository();r.addClient(cli);const d=r.createDraft(pre);assert.equal(d.draft.totalCents,100000);assert.equal(d.draft.kind,'PRE_NOTA_SIMULADA');r.close()});
test('BDD | Dado um documento anterior, quando reenviar mesma chave, então não criar duplicado',()=>{const r=new LabRepository();r.addClient(cli);const a=r.createDraft(pre),b=r.createDraft(pre);assert.equal(b.created,false);assert.equal(a.draft.id,b.draft.id);r.close()});
test('BDD | Dado um valor negativo, quando enviar, então rejeitar e manter zero documentos',()=>{const r=new LabRepository();r.addClient(cli);assert.throws(()=>r.createDraft({...pre,lines:[{...pre.lines[0],unitCents:-1}]}));assert.equal(r.stats().drafts,0);r.close()});
test('BDD | Dadas empresas diferentes, quando compartilhar chave idempotente, então documentos são distintos',()=>{const r=new LabRepository();r.addClient(cli);r.addClient({id:'SEGUNDA',name:'Outra empresa fictícia'});const a=r.createDraft(pre),b=r.createDraft({...pre,clientId:'SEGUNDA'});assert.notEqual(a.draft.id,b.draft.id);r.close()});
