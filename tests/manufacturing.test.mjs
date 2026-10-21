import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({entryPoints:['lib/manufacturing.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {sampleJob,makePart,makeJob,makeFeature,calculate,clone,initialWorkspace,assertWorkspace}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].contents).toString('base64'));
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

test('reference body: stepped recess is deducted only beyond its existing core bore',()=>{
 const j=sampleJob(),r=calculate(j),p=r.parts[0];
 const net=220*220*25-Math.PI/4*127**2*25-Math.PI/4*(154**2-127**2)*20-4*Math.PI/4*14**2*25;
 close(p.finishedVolume,net);close(p.finishedWeight,5.956090978349);close(p.rawWeight,12.45795);
 close(r.finishedWeight,2*p.finishedWeight);close(r.rawWeight,24.9159);
 assert.equal(r.status,'draft');assert.ok(r.issues.some(i=>i.includes('M10')&&i.includes('depth')));
});
test('material change scales both finished and raw weights by density',()=>{
 const j=sampleJob(),steel=calculate(j);j.parts[0].materialId='al6061';const aluminium=calculate(j);
 close(aluminium.finishedWeight/steel.finishedWeight,2700/7850);close(aluminium.rawWeight/steel.rawWeight,2700/7850);
});
test('batch setup is fixed while material and running cost scale with quantity',()=>{
 const j=sampleJob();j.quantity=1;const one=calculate(j);j.quantity=10;const ten=calculate(j);
 close(ten.setupCost,one.setupCost);close(ten.runCost,one.runCost*10);close(ten.materialCost,one.materialCost*10);
 assert.ok(ten.unitCost<one.unitCost);
});
test('route preference uses conventional mill and radial drill when requested',()=>{
 const j=sampleJob();assert.equal(calculate(j).operations.find(o=>o.name==='Datum, face and square').machineId,'vmc');
 j.route='conventional';const r=calculate(j);assert.equal(r.operations.find(o=>o.name==='Datum, face and square').machineId,'mill');assert.equal(r.operations.find(o=>o.name==='Drill holes').machineId,'drill');
});
test('unavailable or undersized machine cannot become a costed route',()=>{
 const j=sampleJob();for(const m of j.machines)if(['vmc','mill'].includes(m.type))m.x=1;
 const r=calculate(j);assert.equal(r.operations.find(o=>o.name==='Datum, face and square').machineId,'');assert.ok(r.issues.some(i=>i.includes('capable machine')));assert.equal(r.status,'draft');
});
test('stock with enough volume but insufficient width is flagged',()=>{
 const j=sampleJob();Object.assign(j.parts[0],{stockLength:1000,stockWidth:100,stockThickness:30,reviewed:true});
 assert.ok(calculate(j).issues.some(i=>i.includes('do not enclose')));
});
test('purchased components add mass and price without consuming machining stock',()=>{
 const j=makeJob(),p=makePart();Object.assign(p,{name:'Bolt',kind:'purchased',count:4,purchasedWeight:.08,purchasedCost:25,reviewed:true,tolerance:'Supplier specification'});j.parts=[p];j.quantity=3;j.pricing.overhead=0;j.pricing.markup=0;
 const r=calculate(j);close(r.finishedWeight,.96);close(r.rawWeight,0);close(r.materialCost,300);assert.equal(r.operations.length,0);assert.equal(r.status,'reviewed');
});
test('manual cycle and setup overrides are used in batch cost',()=>{
 const j=sampleJob(),id=j.parts[0].id+':faces';j.overrides[id]={minutes:10,setup:7,machineId:'mill'};
 const o=calculate(j).operations.find(o=>o.id===id);assert.equal(o.machineId,'mill');close(o.cost,(10*2+7)*650/60);assert.equal(o.inferred,false);
});
test('saved rate snapshots remain independent of catalogue edits',()=>{
 const w=initialWorkspace(),j=makeJob(w.materials,w.machines);j.parts=[makePart()];const before=calculate(j);w.materials[0].density=1;w.materials[0].rate=1;w.machines[0].rate=1;
 close(calculate(j).cost,before.cost);close(calculate(j).finishedWeight,before.finishedWeight);
});
test('invalid imported catalogue, quantities and incomplete pricing are rejected',()=>{
 const w=initialWorkspace();w.jobs=[sampleJob()];assert.doesNotThrow(()=>assertWorkspace(w));
 const a=clone(w);a.jobs[0].materials[0].density=-1;assert.throws(()=>assertWorkspace(a));
 const b=clone(w);b.jobs[0].parts[0].count=.5;assert.throws(()=>assertWorkspace(b));
 const c=clone(w);delete c.jobs[0].pricing.tax;assert.throws(()=>assertWorkspace(c));
 const d=clone(w);d.jobs[0].drawingUrl='https://other.example/drawing.pdf';assert.throws(()=>assertWorkspace(d));
});
test('zero-diameter and impossible counterbore features cannot be marked reviewed',()=>{
 const j=makeJob(),p=makePart();p.reviewed=true;p.tolerance='±0.1 mm';p.features=[{...makeFeature(),diameter:0,depth:10}];j.parts=[p];assert.equal(calculate(j).status,'draft');
 p.features=[{...makeFeature('counterbore'),depth:5}];assert.ok(calculate(j).issues.some(i=>i.includes('matching core bore')));
});
