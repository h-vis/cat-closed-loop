const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const CatMotion = require('../cat-motion');
const key = p => `${p.x},${p.y}`;
const clone = p => ({...p});
const flush = async () => { for (let i=0; i<8; i++) await Promise.resolve(); };

function regions() {
  const map = new Map();
  for (let y=0;y<5;y++) for (let x=0;x<7;x++) if (x!==3) map.set(`${x},${y}`,x<3?0:1);
  return map;
}

test('paths go around blocked cells and never cross a partition', () => {
  const map = regions();
  map.delete('1,0');
  const route = CatMotion.findPath({x:0,y:0},{x:2,y:0},map);
  assert.equal(route.length,5);
  assert.ok(route.every(p=>map.get(key(p))===0));
  assert.equal(CatMotion.findPath({x:0,y:0},{x:5,y:0},map),null);
  for (let i=1;i<route.length;i++) assert.equal(Math.abs(route[i].x-route[i-1].x)+Math.abs(route[i].y-route[i-1].y),1);
});

test('timeline finishes only after arrival and cancellation cannot run an old callback', async () => {
  let now=0, queued, frames=0;
  const player=CatMotion.create({onFrame:()=>frames++,request:fn=>{queued=fn;return 1;},cancel:()=>{},now:()=>now});
  const run=player.begin();
  let result;
  const promise=run.play([{id:'cat',path:[{x:0,y:0},{x:1,y:0}]}],'fish','fish').then(v=>result=v);
  now=350; queued(now); await flush();
  assert.equal(result,undefined,'arrival flourish must finish before resolving');
  now=650; queued(now); await promise;
  assert.equal(result,true);
  run.finish(); assert.equal(player.active,false);
  const next=player.begin();
  const cancelled=next.play([{path:[{x:0,y:0},{x:1,y:0}]}],'fish','fish');
  const stale=queued;
  player.cancel();
  const count=frames;
  stale(2000);
  assert.equal(await cancelled,false);
  assert.equal(frames,count);
  assert.equal(next.alive(),false);
});

test('reduced motion removes bouncing; full travel ends exactly at its destination', () => {
  const actor={path:[{x:0,y:0},{x:1,y:0}]};
  assert.equal(CatMotion.sample(actor,.5,0,true).y,0);
  assert.equal(CatMotion.sample(actor,.5,0,true).tilt,0);
  assert.ok(CatMotion.sample(actor,.5,0,false).y<0);
  const end=CatMotion.sample(actor,1,1,false);
  assert.equal(end.x,1);
  assert.ok(Math.abs(end.y)<1e-8);
});

const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
function harness(overrides={}) {
  const state={player:{x:0,y:0},key:{position:{x:1,y:0},collected:false},goal:{position:{x:2,y:0}},
    bombs:[],disarmItems:[],warps:[],lateWarps:[],explodedBombs:[],clear:false,gameOver:false,
    mode:'stage',stage:{stageNumber:1,stageDifficulty:'medium'},loop:{spaceByCellKey:regions()},...overrides};
  const clips=[], saves=[];
  let generation=0;
  const eventMotion={active:false,cancel(){generation++;this.active=false; clips.filter(c=>!c.done).forEach(c=>c.resolve(false));}};
  eventMotion.begin=()=>{
    eventMotion.active=true;
    const id=++generation;
    return {alive:()=>id===generation,finish:()=>{if(id===generation)eventMotion.active=false;},
      play:(actors,cue,label)=>new Promise(resolve=>clips.push({actors,cue,label,resolve,done:false}))};
  };
  const space=p=>state.loop.spaceByCellKey.get(key(p))??null;
  const scope={gameState:state,eventMotion,CatMotion,uiLanguage:'ja',console,
    clonePosition:clone,clonePositions:ps=>ps.map(clone),positionsMatch:(a,b)=>key(a)===key(b),getCellKey:key,
    buildCellKeySet:ps=>new Set(ps.map(key)),isGridPositionInPlayerSpace:p=>space(p)===state.playerSpaceId,
    refreshPlayerSpaceFlags:()=>{state.playerSpaceId=space(state.player);},updateStatus:()=>{},
    getStageModeKey:()=> 'stage',getStageJsonState:()=>({selectedDifficulty:'medium'}),
    rememberClearedStage:(...args)=>saves.push(args),refreshStageNumberInputs:()=>{},
    groupPositionsBySpace:ps=>{const m=new Map();for(const p of ps){const id=space(p);if(id===null)continue;if(!m.has(id))m.set(id,[]);m.get(id).push(p);}return m;},
  };
  vm.createContext(scope);
  vm.runInContext(source.slice(source.indexOf('function motionActor('),source.indexOf('function drawEventMotion(')),scope);
  const start=async()=>{const promise=scope.applyLoopEffects();await flush();return {promise};};
  const finish=async()=>{const c=clips.find(c=>!c.done);assert.ok(c,'expected an animation clip');c.done=true;c.resolve(true);await flush();};
  return {state,clips,saves,eventMotion,start,finish};
}

test('fish then box: state, clear overlay and saved progress wait for each arrival', async () => {
  const h=harness();const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'fish');assert.equal(h.state.key.collected,false);assert.equal(h.state.clear,false);
  await h.finish();
  assert.equal(h.state.key.collected,true);assert.equal(key(h.state.player),'0,0');
  assert.equal(h.clips[1].cue,'return');
  assert.equal(key(h.clips[1].actors[0].path.at(-1)),'0,0');
  await h.finish();
  assert.equal(h.clips[2].cue,'home');
  assert.equal(key(h.clips[2].actors[0].path[0]),'0,0');assert.equal(h.state.clear,false);assert.equal(h.saves.length,0);
  await h.finish();await promise;
  assert.equal(key(h.state.player),'2,0');assert.equal(h.state.clear,true);assert.equal(h.saves.length,1);assert.equal(h.eventMotion.active,false);
});

test('dog walks to cat before game over; fish and bones cannot save a shared cat space', async () => {
  const h=harness({bombs:[{x:2,y:2}],disarmItems:[{x:2,y:3}]});const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'startled');assert.equal(h.state.gameOver,false);
  assert.equal(key(h.clips[0].actors[0].path.at(-1)),key(h.state.player));
  await h.finish();await promise;
  assert.equal(h.state.gameOver,true);assert.equal(h.state.key.collected,false);assert.equal(h.state.disarmItems.length,1);assert.equal(h.clips.length,1);
});

test('dogs in other rooms approach distinct bones together and disappear only on arrival', async () => {
  const h=harness({bombs:[{x:4,y:0},{x:6,y:0}],disarmItems:[{x:4,y:2},{x:6,y:2}]});const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'sleep');assert.equal(h.clips[0].actors.length,2);assert.equal(h.state.bombs.length,2);
  const destinations=h.clips[0].actors.map(a=>key(a.path.at(-1)));
  assert.equal(new Set(destinations).size,2);
  await h.finish();assert.equal(h.state.bombs.length,0);assert.equal(h.state.disarmItems.length,0);
  await h.finish();await h.finish();await h.finish();await promise;
});

test('unequal dogs and bones stay put', async () => {
  const h=harness({bombs:[{x:4,y:0},{x:6,y:0}],disarmItems:[{x:4,y:2}]});const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'fish');await h.finish();await h.finish();await h.finish();await promise;
  assert.equal(h.state.bombs.length,2);assert.equal(h.state.disarmItems.length,1);
});

test('paper bag entry and exit precede destination hazards', async () => {
  const h=harness({warps:[{x:2,y:1},{x:4,y:1}],bombs:[{x:6,y:1}]});const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'warp');assert.equal(h.clips[0].actors[0].exit,true);
  await h.finish();assert.equal(key(h.state.player),'4,1');assert.equal(h.clips[1].actors[0].enter,true);
  await h.finish();assert.equal(h.state.warps.length,0);assert.equal(h.clips[2].cue,'startled');assert.equal(h.state.gameOver,false);
  await h.finish();await promise;assert.equal(h.state.gameOver,true);
});

test('tunnels wait until after fish, and clear takes priority over tunnels', async () => {
  const h=harness({goal:{position:{x:6,y:4}},lateWarps:[{x:2,y:1},{x:4,y:1}]});const {promise}=await h.start();
  assert.equal(h.clips[0].cue,'fish');await h.finish();assert.equal(h.clips[1].cue,'return');
  await h.finish();await h.finish();await h.finish();await promise;assert.equal(key(h.state.player),'4,1');assert.equal(h.state.lateWarps.length,0);
  const winner=harness({lateWarps:[{x:2,y:1},{x:4,y:1}]});const run=await winner.start();await winner.finish();await winner.finish();await winner.finish();await run.promise;
  assert.equal(winner.clips.length,3);assert.equal(winner.state.clear,true);assert.equal(key(winner.state.player),'2,0');
});

test('cancel/reset during movement cannot award a fish or clear the replacement stage', async () => {
  const h=harness();const {promise}=await h.start();
  h.eventMotion.cancel();h.state.stage={stageNumber:2};h.state.player={x:2,y:4};
  await promise;
  assert.equal(h.state.key.collected,false);assert.equal(h.state.clear,false);assert.equal(key(h.state.player),'2,4');assert.equal(h.saves.length,0);
});

test('cancelling immediately after starting also stops no-op warp awaits', async () => {
  const h=harness();const started=h.start();h.eventMotion.cancel();const {promise}=await started;await promise;
  assert.equal(h.clips.length,0);assert.equal(h.state.key.collected,false);
});

test('node and browser solvers keep the original cat position for the next split', () => {
  const nodeSolver=require('../solver');
  const browser={};vm.createContext(browser);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../solver-browser.js'),'utf8'),browser);
  const stage={boardSize:{width:7,height:5},playerStart:{x:0,y:0},keyPosition:{x:1,y:0},goalPosition:{x:6,y:4},bombs:[],disarmItems:[],warps:[],lateWarps:[],wallBlocks:[]};
  const loop={spaceByCellKey:regions(),lineCellKeys:new Set()};
  for (const solver of [nodeSolver,browser.closedLoopRegionSolver]) {
    const result=solver.applyLoop(solver.createInitialState(stage),loop,stage);
    assert.equal(result.keyCollected,true);
    assert.equal(key(result.playerPosition),'0,0');
    assert.equal(result.clear,false);
  }
});

test('node solver reaches the box before any late tunnel, matching the animation', () => {
  const solver=require('../solver');
  const stage={boardSize:{width:7,height:5},playerStart:{x:0,y:0},keyPosition:{x:1,y:0},goalPosition:{x:2,y:0},bombs:[],disarmItems:[],warps:[],lateWarps:[{x:2,y:1},{x:4,y:1}],wallBlocks:[]};
  const result=solver.applyLoop(solver.createInitialState(stage),{spaceByCellKey:regions(),lineCellKeys:new Set()},stage);
  assert.equal(result.clear,true);assert.equal(key(result.playerPosition),'2,0');assert.equal(result.lateWarps.length,2);
});

test('fish-only visit returns home without changing the next split anchor', async () => {
  const h=harness({goal:{position:{x:6,y:4}}});const {promise}=await h.start();
  await h.finish();assert.equal(h.state.key.collected,true);
  assert.equal(h.clips[1].cue,'return');
  assert.equal(key(h.clips[1].actors[0].path[0]),'1,0');
  await h.finish();await promise;
  assert.equal(key(h.state.player),'0,0');assert.equal(h.state.clear,false);
  assert.equal(h.eventMotion.active,false);
});

test('fish visit after a paper bag returns to the warp destination', async () => {
  const h=harness({warps:[{x:2,y:1},{x:4,y:1}],key:{position:{x:5,y:1},collected:false}});
  const {promise}=await h.start();await h.finish();await h.finish();
  assert.equal(h.clips[2].cue,'fish');await h.finish();
  const back=h.clips[3];assert.equal(back.cue,'return');
  assert.equal(key(back.actors[0].path.at(-1)),'4,1');
  assert.ok(back.actors[0].path.every(p=>regions().get(key(p))===1));
  await h.finish();await promise;
  assert.equal(key(h.state.player),'4,1');assert.equal(h.state.clear,false);
});

test('reset during the return cannot clear or move the replacement stage', async () => {
  const h=harness();const {promise}=await h.start();await h.finish();
  assert.equal(h.clips[1].cue,'return');
  h.eventMotion.cancel();h.state.stage={stageNumber:2};h.state.player={x:2,y:4};h.state.key.collected=false;
  await promise;
  assert.equal(key(h.state.player),'2,4');assert.equal(h.state.key.collected,false);
  assert.equal(h.state.clear,false);assert.equal(h.saves.length,0);
});
