/** Regras puras de negócio. Os registros são sempre simulações SEM VALOR FISCAL. */
import {createHash} from 'node:crypto';
export class DomainError extends Error {
  constructor(code, message, status=400) { super(message); this.code=code; this.status=status; this.name='DomainError'; }
}
export const err=(code,message,status=400)=>{throw new DomainError(code,message,status)};
export function textField(value,label,max=160){
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)err('INVALID_FIELD',`${label}: informe texto entre 1 e ${max} caracteres`);
  return value.trim();
}
export function positiveInt(value,label){
  if(!Number.isSafeInteger(value)||value<=0)err('INVALID_NUMBER',`${label}: informe inteiro positivo seguro`);
  return value;
}
export function validateDraft(input){
  if(!input||typeof input!=='object'||Array.isArray(input))err('INVALID_DOCUMENT','Pré-nota inválida');
  const clientId=textField(input.clientId,'ID do cliente',90);
  const idempotencyKey=textField(input.idempotencyKey,'Chave de idempotência',120);
  if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>50)err('INVALID_LINES','Informe de 1 a 50 itens');
  let totalCents=0;
  const lines=input.lines.map((item,i)=>{
    if(!item||typeof item!=='object')err('INVALID_LINES',`Item ${i+1} inválido`);
    const description=textField(item.description,'Descrição',200);
    const quantity=positiveInt(item.quantity,'Quantidade');
    const unitCents=positiveInt(item.unitCents,'Valor unitário em centavos');
    const subtotalCents=quantity*unitCents;
    if(!Number.isSafeInteger(subtotalCents))err('AMOUNT_OVERFLOW','Subtotal excedeu limite');
    totalCents+=subtotalCents;
    if(!Number.isSafeInteger(totalCents))err('AMOUNT_OVERFLOW','Total excedeu limite');
    return {description,quantity,unitCents,subtotalCents};
  });
  const fingerprint=createHash('sha256').update(JSON.stringify({clientId,lines})).digest('hex');
  return Object.freeze({clientId,idempotencyKey,lines,totalCents,fingerprint});
}
export function percentile(numbers,p){
  if(!numbers.length)return 0;
  const sorted=[...numbers].sort((a,b)=>a-b);
  return sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p/100)-1)];
}
