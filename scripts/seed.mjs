import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {LabRepository} from '../src/repository.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=(name,def)=>{const i=process.argv.indexOf(name);return i<0?def:Number(process.argv[i+1])};
const clients=arg('--clients',100),draftsPerClient=arg('--drafts-per-client',5);
const db=process.env.LAB_DB_PATH||join(root,'.data','ld_laboratorio.sqlite');
const repo=new LabRepository(db);
try{const stats=repo.seed({clients,draftsPerClient,prefix:'CLI-SEED'});console.log(JSON.stringify({db,stats,note:'SOMENTE pré-notas fictícias locais'},null,2))}
finally{repo.close()}
