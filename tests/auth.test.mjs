import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../js/storage.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const member=(data={active:true,personId:'murilo',name:'Murilo'})=>({exists:()=>data!==null,data:()=>data,metadata:{fromCache:false}});
const user={uid:'test-member',email:'member@example.test'};
async function fixture({restored=null,read=async()=>member(),logout=null}={}){
  const events=[],listeners=[],calls=[];let authObserver;
  const auth={currentUser:restored};
  const context=vm.createContext({setTimeout,clearTimeout,console,crypto,localStorage:{getItem:()=>null}});
  const modules={
    './firebase-config.js':{firebaseConfig:{apiKey:'test',authDomain:'test',projectId:'test',appId:'test'},workspaceId:'devarity'},
    'firebase-app.js':{initializeApp:()=>({}),getApps:()=>[],getApp:()=>({})},
    'firebase-auth.js':{
      getAuth:()=>auth,browserLocalPersistence:{type:'LOCAL'},
      setPersistence:async(a,p)=>{calls.push(['persist',p.type]);},
      onAuthStateChanged:(a,next)=>{authObserver=next;queueMicrotask(()=>next(a.currentUser));return()=>{};},
      signInWithEmailAndPassword:async(a,email,password)=>{calls.push(['login']);if(password==='wrong')throw Object.assign(Error('wrong'),{code:'auth/invalid-credential'});a.currentUser=user;authObserver(user);},
      signOut:async a=>{calls.push(['logout']);if(logout)return logout(a);a.currentUser=null;authObserver(null);},
    },
    'firebase-firestore.js':{
      getFirestore:()=>({}),doc:(_, ...path)=>path.join('/'),collection:(_, ...path)=>path.join('/'),
      getDocFromServer:ref=>{calls.push(['member',ref]);return read(ref);},
      onSnapshot:(ref,...args)=>{const next=typeof args[0]==='function'?args[0]:args[1],error=args.at(-1);const l={ref,next,error,stopped:false};listeners.push(l);return()=>l.stopped=true;},
      setDoc:async(ref)=>calls.push(['write',ref]),deleteDoc:async ref=>calls.push(['delete',ref]),addDoc:async()=>{},
    },
  };
  const cache=new Map();
  async function moduleFor(spec){
    const key=spec.startsWith('https:')?spec.split('/').at(-1):spec;
    if(!cache.has(key)){const exports=modules[key];const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const [name,value] of Object.entries(exports))this.setExport(name,value);},{context});cache.set(key,m);await m.link(()=>{});await m.evaluate();}
    return cache.get(key);
  }
  const mod=new vm.SourceTextModule(source,{context,importModuleDynamically:moduleFor});await mod.link(moduleFor);await mod.evaluate();
  const gateway=await mod.namespace.createCloudGateway({onTasks:t=>events.push(['tasks',t]),onActivity:a=>events.push(['activity',a]),onStatus:s=>events.push(['status',s]),onAuth:(s,m,u)=>events.push(['auth',s,m,u])});
  await tick();
  return {gateway,auth,events,listeners,calls,emit:async u=>{auth.currentUser=u;authObserver(u);await tick();},lastAuth:()=>events.filter(e=>e[0]==='auth').at(-1)?.[1]};
}

test('local persistence precedes sign-in and authorized collections keep their paths',async()=>{
  const f=await fixture();assert.equal(f.lastAuth(),'unauthenticated');await f.gateway.login(user.email,'correct');await tick();assert.equal(f.lastAuth(),'authenticated');assert.deepEqual(f.calls.slice(0,2),[['persist','LOCAL'],['login']]);
  assert.deepEqual(f.listeners.map(l=>l.ref),['workspaces/devarity/members/test-member','workspaces/devarity/tasks','workspaces/devarity/activity']);
  await f.gateway.save({id:'task',title:'Test'});assert.ok(f.calls.some(c=>c[0]==='write'&&c[1]==='workspaces/devarity/tasks/task'));f.gateway.stop();
});
test('wrong credentials do not unlock the dashboard',async()=>{const f=await fixture();await assert.rejects(f.gateway.login(user.email,'wrong'));assert.equal(f.lastAuth(),'unauthenticated');assert.equal(f.listeners.length,0);f.gateway.stop();});
test('restored Firebase user still requires server authorization',async()=>{const f=await fixture({restored:user});assert.equal(f.lastAuth(),'authenticated');assert.ok(f.calls.some(c=>c[0]==='member'));assert.ok(!f.events.some(e=>e[0]==='auth'&&e[1]==='unauthenticated'));f.gateway.stop();});
for(const [name,data] of [['missing',null],['inactive',{active:false,personId:'murilo'}],['string active',{active:'true',personId:'murilo'}],['unknown identity',{active:true,personId:'other'}]]){
 test(`unauthorized ${name} member is denied and signed out`,async()=>{const f=await fixture({restored:user,read:async()=>member(data)});assert.equal(f.lastAuth(),'unauthenticated');assert.equal(f.auth.currentUser,null);assert.equal(f.listeners.length,0);await assert.rejects(f.gateway.save({title:'Blocked'}));f.gateway.stop();});
}
test('network failure preserves Firebase session and retry rechecks authorization',async()=>{let offline=true;const f=await fixture({restored:user,read:async()=>{if(offline)throw Object.assign(Error('offline'),{code:'unavailable'});return member();}});assert.equal(f.lastAuth(),'initializing');assert.equal(f.auth.currentUser,user);assert.ok(!f.calls.some(c=>c[0]==='logout'));offline=false;await f.gateway.retry();assert.equal(f.lastAuth(),'authenticated');f.gateway.stop();});
test('permission denial on server membership check ends unauthorized session',async()=>{const f=await fixture({restored:user,read:async()=>{throw Object.assign(Error('denied'),{code:'permission-denied'});}});assert.equal(f.lastAuth(),'unauthenticated');assert.equal(f.auth.currentUser,null);f.gateway.stop();});
test('live membership removal blocks access and stops data listeners',async()=>{const f=await fixture({restored:user});const listener=f.listeners[0];listener.next(member({active:false,personId:'murilo'}));await tick();assert.equal(f.lastAuth(),'unauthenticated');assert.ok(f.listeners.every(l=>l.stopped));await assert.rejects(f.gateway.delete({id:'task'}));f.gateway.stop();});
test('cached membership changes cannot establish server authorization',async()=>{const f=await fixture({restored:user});f.listeners[0].next({...member(null),metadata:{fromCache:true}});assert.equal(f.lastAuth(),'authenticated');f.gateway.stop();});
test('logout invalidates late member responses',async()=>{let resolveRead;const f=await fixture({restored:user,read:()=>new Promise(r=>resolveRead=r)});assert.equal(f.lastAuth(),'initializing');await f.gateway.signout();resolveRead(member());await tick();assert.equal(f.lastAuth(),'unauthenticated');assert.equal(f.listeners.length,0);f.gateway.stop();});
test('late snapshots from the previous account cannot restore tasks',async()=>{const f=await fixture({restored:user});const old=f.listeners.find(l=>l.ref.endsWith('/tasks'));await f.gateway.signout();const count=f.events.length;old.next({docs:[{id:'old',data:()=>({title:'Private'})}]});assert.equal(f.events.length,count);f.gateway.stop();});
test('newer authorization check wins concurrent responses',async()=>{const pending=[];const f=await fixture({restored:user,read:()=>new Promise(r=>pending.push(r))});const retry=f.gateway.retry();pending[1](member());await retry;pending[0](member(null));await tick();assert.equal(f.lastAuth(),'authenticated');assert.equal(f.auth.currentUser,user);f.gateway.stop();});

test('late failed sign-out from denied account cannot hide a newer authorized session',async()=>{let rejectLogout;const f=await fixture({restored:user,read:async ref=>ref.endsWith('/test-member')?member(null):member(),logout:()=>new Promise((_,reject)=>rejectLogout=reject)});await f.emit({uid:'new-member',email:'new@example.test'});assert.equal(f.lastAuth(),'authenticated');rejectLogout(Error('storage failed'));await tick();assert.equal(f.lastAuth(),'authenticated');f.gateway.stop();});
