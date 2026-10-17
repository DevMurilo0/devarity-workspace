import { firebaseConfig, workspaceId } from './firebase-config.js';

const STORAGE_KEY = 'devarity-flow/tasks/v2';
const ACTIVITY_KEY = 'devarity-flow/activity/v2';
const DAY = 86400000;
const isoDay = (offset = 0) => { const d = new Date(Date.now() + offset * DAY); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const timestamp = (hours = 0) => new Date(Date.now() - hours * 3600000).toISOString();

const sample = () => [
  { id:'example-1', title:'Refinar a experiência da Devarity Tools', description:'Revisar o hero, dar mais destaque à marca e melhorar as transições na entrada das ferramentas.', assignee:'murilo', category:'Design', project:'Devarity Tools', priority:'urgent', status:'doing', dueDate:isoDay(2), createdAt:timestamp(25), updatedAt:timestamp(4), subtasks:[{id:'a',text:'Ajustar composição do hero',done:true},{id:'b',text:'Revisar animações de entrada',done:false},{id:'c',text:'Testar versão mobile',done:false}] },
  { id:'example-2', title:'Preparar proposta para novo cliente', description:'Organizar escopo, prazo e orçamento para enviar uma proposta comercial completa.', assignee:'davi', category:'Comunicação', project:'Devarity Studio', priority:'high', status:'todo', dueDate:isoDay(1), createdAt:timestamp(10), updatedAt:timestamp(10), subtasks:[] },
  { id:'example-3', title:'Definir as funcionalidades da primeira versão do SaaS', description:'Listar os problemas que o produto resolve, estruturar o MVP e priorizar as próximas entregas.', assignee:'both', category:'Produto', project:'Novo SaaS', priority:'high', status:'todo', dueDate:isoDay(5), createdAt:timestamp(48), updatedAt:timestamp(48), subtasks:[{id:'d',text:'Mapear a jornada do usuário',done:false},{id:'e',text:'Priorizar funcionalidades',done:false}] },
  { id:'example-4', title:'Publicar melhorias no site principal', description:'Subir a nova seção de projetos e conferir responsividade antes da publicação.', assignee:'murilo', category:'Desenvolvimento', project:'Site Devarity', priority:'medium', status:'done', dueDate:isoDay(-2), createdAt:timestamp(108), updatedAt:timestamp(13), completedAt:timestamp(13), subtasks:[] },
  { id:'example-5', title:'Revisar o fluxo de cadastro e onboarding', description:'Garantir que as primeiras etapas do produto sejam simples e fáceis de entender.', assignee:'davi', category:'Produto', project:'Novo SaaS', priority:'medium', status:'doing', dueDate:isoDay(7), createdAt:timestamp(60), updatedAt:timestamp(5), subtasks:[] },
  { id:'example-6', title:'Organizar o próximo ciclo de entregas', description:'Quebrar demandas grandes em tarefas menores e definir responsáveis com prazos reais.', assignee:'both', category:'Gestão', project:'Interno', priority:'low', status:'todo', dueDate:'', createdAt:timestamp(3), updatedAt:timestamp(3), subtasks:[] },
];

function read(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } }
function localInit() { const current = read(STORAGE_KEY,null); if (!Array.isArray(current)) {localStorage.setItem(STORAGE_KEY,JSON.stringify(sample()));localStorage.setItem(ACTIVITY_KEY,JSON.stringify([]));} }
function safeTask(t) {
  if (!t || typeof t !== 'object') return null;
  const allowed = (value, choices, fallback) => choices.includes(value) ? value : fallback;
  if (typeof t.title !== 'string' || !t.title.trim()) return null;
  return {
    id: typeof t.id === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(t.id) ? t.id : crypto.randomUUID(),
    title: t.title.trim().slice(0,120),
    description: String(t.description || '').slice(0,2500),
    assignee: allowed(t.assignee,['murilo','davi','both'],'murilo'),
    category: allowed(t.category,['Desenvolvimento','Design','Produto','Comunicação','Gestão','Outros'],'Outros'),
    project: String(t.project || '').trim().slice(0,80),
    priority: allowed(t.priority,['low','medium','high','urgent'],'medium'),
    status: allowed(t.status,['todo','doing','done'],'todo'),
    dueDate: typeof t.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : '',
    createdAt: typeof t.createdAt === 'string' && !Number.isNaN(Date.parse(t.createdAt)) ? t.createdAt : new Date().toISOString(),
    updatedAt: typeof t.updatedAt === 'string' && !Number.isNaN(Date.parse(t.updatedAt)) ? t.updatedAt : new Date().toISOString(),
    ...(typeof t.completedAt === 'string' ? {completedAt:t.completedAt} : {}),
    subtasks: Array.isArray(t.subtasks) ? t.subtasks.slice(0,60).filter(s=>s&&typeof s.text==='string').map(s=>({id: String(s.id||crypto.randomUUID()).slice(0,100), text:s.text.slice(0,180), done:!!s.done})) : [],
  };
}
export { safeTask };
export const firebaseEnabled = !!(firebaseConfig.apiKey.trim() && firebaseConfig.authDomain.trim() && firebaseConfig.projectId.trim() && firebaseConfig.appId.trim());

export function createLocalAdapter(onData, onStatus) {
  localInit();
  let tasks = read(STORAGE_KEY,[]), activity = read(ACTIVITY_KEY,[]);
  const notify = () => onData([...tasks], [...activity]);
  const write = () => { localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));localStorage.setItem(ACTIVITY_KEY,JSON.stringify(activity));notify();};
  const addEvent = (action, task) => { activity.unshift({id:crypto.randomUUID(),action,taskTitle:task.title,taskId:task.id,actor:localStorage.getItem('devarity-flow/person')||'murilo',at:new Date().toISOString()});activity=activity.slice(0,80); };
  const adapter = {
    mode:'local', personId:localStorage.getItem('devarity-flow/person')||'murilo',
    async save(task, event='created') { const safe=safeTask(task); if (!safe) throw Error('Título inválido.');const i=tasks.findIndex(t=>t.id===safe.id);if(i>=0)tasks[i]=safe;else tasks.unshift(safe); if(event)addEvent(event,safe);write(); },
    async delete(task){tasks=tasks.filter(t=>t.id!==task.id);addEvent('deleted',task);write();},
    async import(values){if(!Array.isArray(values)||values.length>1000)throw Error('Arquivo inválido ou grande demais (limite: 1000 tarefas).');const imported=values.map(safeTask);if(imported.some(t=>!t))throw Error('O arquivo contém tarefas inválidas.');tasks=[...new Map([...tasks,...imported].map(t=>[t.id,t])).values()];write();},
    async reset(){tasks=sample();activity=[];write();},
    getTasks:()=>[...tasks],
    stop(){}
  };
  window.addEventListener('storage', e=>{if(e.key===STORAGE_KEY||e.key===ACTIVITY_KEY){tasks=read(STORAGE_KEY,[]);activity=read(ACTIVITY_KEY,[]);notify();}});
  onStatus('local'); notify();return adapter;
}

/** Firebase modules load only in connected mode; the local app has no dependency. */
export async function createCloudGateway({onTasks,onActivity,onStatus,onAuth}) {
  const BASE = 'https://www.gstatic.com/firebasejs/11.10.0/';
  const [{initializeApp},{getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut},{getFirestore,collection,doc,getDoc,onSnapshot,setDoc,deleteDoc,addDoc}] = await Promise.all([
    import(BASE+'firebase-app.js'),import(BASE+'firebase-auth.js'),import(BASE+'firebase-firestore.js'),
  ]);
  const app=initializeApp(firebaseConfig);const auth=getAuth(app);const db=getFirestore(app);
  const root=['workspaces',workspaceId];let unsubTasks=()=>{}, unsubActivity=()=>{}, currentUser=null;
  const fail=(err)=>{console.error('[Flow/Firebase]',err);onStatus('error',err.message||'Falha de sincronização.');};
  const observer=onAuthStateChanged(auth,async user=>{
    unsubTasks();unsubActivity();currentUser=null;
    if(!user){onAuth(false);onStatus('signin');return;}
    try{
      const member=await getDoc(doc(db,...root,'members',user.uid));
      if (!member.exists() || member.data().active!==true || !['murilo','davi'].includes(member.data().personId)) {await signOut(auth);onAuth(false,'Essa conta ainda não foi autorizada no workspace. Configure os membros no Firebase.');return;}
      currentUser={...member.data(), uid:user.uid, email:user.email};onAuth(true,null,currentUser);onStatus('online');
      unsubTasks=onSnapshot(collection(db,...root,'tasks'), snap=>onTasks(snap.docs.map(d=>({...d.data(),id:d.id})).map(safeTask).filter(Boolean)),fail);
      unsubActivity=onSnapshot(collection(db,...root,'activity'),snap=>onActivity(snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,80)),fail);
    }catch(err){fail(err);onAuth(false,'Não foi possível verificar o acesso. Confira a conexão e as regras do Firebase.');}
  },fail);
  const addEvent=async(action,task)=>{try{await addDoc(collection(db,...root,'activity'),{action,taskTitle:task.title,taskId:task.id,actor:currentUser?.personId||'murilo',at:new Date().toISOString()});}catch(err){console.warn('Falha ao salvar atividade:',err);}};
  return {
    mode:'cloud',get personId(){return currentUser?.personId||'murilo';},
    async login(email,password){await signInWithEmailAndPassword(auth,email,password);},
    async signout(){await signOut(auth);},
    async save(task,event='created'){if(!currentUser)throw Error('Faça login para salvar.');const safe=safeTask(task);if(!safe)throw Error('Título inválido.');await setDoc(doc(db,...root,'tasks',safe.id),safe);if(event)void addEvent(event,safe);},
    async delete(task){if(!currentUser)throw Error('Faça login para excluir.');await deleteDoc(doc(db,...root,'tasks',task.id));void addEvent('deleted',task);},
    stop(){unsubTasks();unsubActivity();observer();},
  };
}
