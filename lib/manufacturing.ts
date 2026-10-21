export type Material = { id: string; name: string; grade: string; density: number; rate: number; scrapRate: number; machiningFactor: number; notes: string };
export type MachineType = 'cutting' | 'vmc' | 'mill' | 'drill' | 'lathe' | 'finishing' | 'inspection';
export type Machine = { id: string; name: string; type: MachineType; rate: number; setup: number; mrr: number; feed: number; x: number; y: number; z: number; enabled: boolean; notes: string };
export type Feature = { id: string; type: 'bore' | 'counterbore' | 'thread' | 'pocket'; name: string; diameter: number; coreDiameter: number; depth: number; count: number; length: number; width: number; source: string };
export type Part = { id: string; name: string; count: number; materialId: string; kind: 'block' | 'cylinder' | 'tube' | 'profile' | 'purchased'; length: number; width: number; thickness: number; diameter: number; innerDiameter: number; profileArea: number; purchasedWeight: number; purchasedCost: number; stockKind: 'block' | 'cylinder' | 'tube'; stockLength: number; stockWidth: number; stockThickness: number; stockDiameter: number; stockInnerDiameter: number; allocation: number; features: Feature[]; reviewed: boolean; tolerance: string; notes: string };
export type OperationOverride = { machineId?: string; minutes?: number; setup?: number; tool?: string };
export type Pricing = { tooling: number; assemblyPerUnit: number; finishingPerUnit: number; packagingPerUnit: number; overhead: number; markup: number; tax: number; scrapRecovery: number };
export type Job = { id: string; name: string; reference: string; customer: string; quantity: number; unit: 'mm'; route: 'vmc' | 'conventional'; parts: Part[]; pricing: Pricing; overrides: Record<string, OperationOverride>; materials: Material[]; machines: Machine[]; drawingUrl: string; drawingName: string; scope: string; updatedAt: string };
export type Workspace = { materials: Material[]; machines: Machine[]; jobs: Job[] };
export type Operation = { id: string; partId: string; part: string; name: string; detail: string; tool: string; allowed: MachineType[]; machineId: string; machine: string; minutes: number; setup: number; count: number; rate: number; cost: number; inferred: boolean };
export type PartResult = { part: Part; outerVolume: number; removedVolume: number; finishedVolume: number; rawVolume: number; finishedWeight: number; rawWeight: number; issuedWeight: number; count: number; materialCost: number; scrapWeight: number; scrapCredit: number; issues: string[] };
export type Calculation = { parts: PartResult[]; operations: Operation[]; issues: string[]; finishedWeight: number; rawWeight: number; scrapWeight: number; materialCost: number; machiningCost: number; setupCost: number; runCost: number; extraCost: number; directCost: number; overheadCost: number; cost: number; sell: number; tax: number; total: number; unitCost: number; unitPrice: number; minutes: number; yield: number; status: 'reviewed' | 'draft'; valid: boolean };

export const MATERIALS: Material[] = [
 {id:'ms',name:'Mild steel',grade:'MS · confirm grade',density:7850,rate:80,scrapRate:28,machiningFactor:1,notes:'Nominal density. Example rates in INR/kg; replace with supplier prices.'},
 {id:'ss304',name:'Stainless steel',grade:'304',density:7900,rate:240,scrapRate:90,machiningFactor:.55,notes:'Nominal density. Example supplier rate and cutting-time factor.'},
 {id:'ss316',name:'Stainless steel',grade:'316',density:8000,rate:340,scrapRate:110,machiningFactor:.5,notes:'Confirm the exact material specification with your supplier.'},
 {id:'al6061',name:'Aluminium',grade:'6061',density:2700,rate:290,scrapRate:130,machiningFactor:1.8,notes:'Nominal density. Stock condition and tooling affect actual cutting time.'},
 {id:'brass',name:'Brass',grade:'Generic · confirm alloy',density:8500,rate:580,scrapRate:350,machiningFactor:1.4,notes:'Brass density varies by alloy. Verify before quoting.'},
 {id:'castiron',name:'Cast iron',grade:'Grey iron · confirm grade',density:7200,rate:75,scrapRate:22,machiningFactor:.9,notes:'Nominal density. This estimate uses machined stock, not casting yield.'}
];
export const MACHINES: Machine[] = [
 {id:'vmc',name:'VMC 01',type:'vmc',rate:1200,setup:30,mrr:20,feed:350,x:600,y:450,z:400,enabled:true,notes:'Example capability and rates. Setup allowance includes locating and a flip.'},
 {id:'mill',name:'Conventional mill',type:'mill',rate:650,setup:25,mrr:10,feed:160,x:500,y:350,z:300,enabled:true,notes:'Boring head and suitable workholding assumed; verify your tooling.'},
 {id:'drill',name:'Radial drill',type:'drill',rate:400,setup:15,mrr:5,feed:100,x:700,y:700,z:400,enabled:true,notes:'Tapping requires a suitable attachment and supported thread size.'},
 {id:'saw',name:'Band saw / plate cutting',type:'cutting',rate:350,setup:10,mrr:12,feed:50,x:800,y:600,z:100,enabled:true,notes:'Choose the actual stock-cutting process and replace the time allowance.'},
 {id:'lathe',name:'Centre lathe',type:'lathe',rate:750,setup:25,mrr:15,feed:180,x:300,y:300,z:750,enabled:true,notes:'Round components only in the suggested route. Confirm swing and fixtures.'},
 {id:'finish',name:'Bench finishing',type:'finishing',rate:250,setup:0,mrr:1,feed:100,x:2000,y:2000,z:2000,enabled:true,notes:'Deburring and edge finishing time allowance.'},
 {id:'inspection',name:'Inspection bench',type:'inspection',rate:350,setup:5,mrr:1,feed:100,x:2000,y:2000,z:2000,enabled:true,notes:'Confirm gauges and acceptance criteria for the component.'}
];
export const uid = () => globalThis.crypto.randomUUID();
export const clone = <T,>(x:T):T => JSON.parse(JSON.stringify(x));
export function makePart(materialId='ms'):Part { return {id:uid(),name:'New component',count:1,materialId,kind:'block',length:100,width:100,thickness:20,diameter:100,innerDiameter:0,profileArea:0,purchasedWeight:0,purchasedCost:0,stockKind:'block',stockLength:110,stockWidth:110,stockThickness:25,stockDiameter:110,stockInnerDiameter:0,allocation:0,features:[],reviewed:false,tolerance:'',notes:''}; }
export function makeFeature(type:Feature['type']='bore'):Feature {return {id:uid(),type,name:type==='thread'?'Tapped hole':type==='counterbore'?'Counterbore':type==='pocket'?'Pocket':'Through hole',diameter:10,coreDiameter:type==='counterbore'?8:0,depth:0,count:1,length:20,width:20,source:''};}
export function makeJob(materials=clone(MATERIALS),machines=clone(MACHINES)):Job {return {id:uid(),name:'Untitled estimate',reference:'',customer:'',quantity:1,unit:'mm',route:'vmc',parts:[],pricing:{tooling:0,assemblyPerUnit:0,finishingPerUnit:0,packagingPerUnit:0,overhead:10,markup:20,tax:0,scrapRecovery:0},overrides:{},materials:clone(materials),machines:clone(machines),drawingUrl:'',drawingName:'',scope:'',updatedAt:new Date().toISOString()};}
export function sampleJob():Job {const j=makeJob(); const p=makePart();Object.assign(p,{name:'Stuffing-box body',length:220,width:220,thickness:25,stockLength:230,stockWidth:230,stockThickness:30,tolerance:'Confirm bore tolerances and surface finish',notes:'Example covers the body only. Gland, bolts and packing are outside this estimate.'});p.features=[
 {...makeFeature(),id:'bore127',name:'Central through bore',diameter:127,depth:25,count:1,source:'Body section · Ø127'},
 {...makeFeature('counterbore'),id:'recess154',name:'Packing recess',diameter:154,coreDiameter:127,depth:20,source:'Body section · Ø154, 20 mm deep'},
 {...makeFeature(),id:'mount14',name:'Mounting holes',diameter:14,depth:25,count:4,source:'Body front view · 4 × Ø14'},
 {...makeFeature('thread'),id:'tap10',name:'M10 tapped holes (minor diameter)',diameter:8.5,depth:0,count:2,source:'M10 callout · depth and pitch require confirmation'}
 ];Object.assign(j,{name:'Stuffing-box body',reference:'C-3-23473-08/1',quantity:2,parts:[p],drawingUrl:'/sample/stuffing-box.pdf',drawingName:'Stuffing Box — Ø125 Shaft.pdf',scope:'Body only · add the gland, bolts and packing for a complete assembly.'});return j;}
export function initialWorkspace():Workspace{return {materials:clone(MATERIALS),machines:clone(MACHINES),jobs:[]};}
const pos=(n:number)=>Number.isFinite(n)&&n>0;
const nonneg=(n:number)=>Number.isFinite(n)&&n>=0;
const circle=(d:number)=>Math.PI*d*d/4;
export function featureVolume(f:Feature):number {if(!pos(f.depth))return 0; const area=f.type==='pocket'?f.length*f.width:f.type==='counterbore'?circle(f.diameter)-circle(f.coreDiameter):circle(f.diameter);return Math.max(0,area)*f.depth*f.count;}
export function partGeometry(p:Part){const outer=p.kind==='block'?p.length*p.width*p.thickness:p.kind==='cylinder'?circle(p.diameter)*p.thickness:p.kind==='tube'?(circle(p.diameter)-circle(p.innerDiameter))*p.thickness:p.kind==='profile'?p.profileArea*p.thickness:0;const removed=p.features.reduce((s,f)=>s+featureVolume(f),0);const raw=p.stockKind==='block'?p.stockLength*p.stockWidth*p.stockThickness:p.stockKind==='cylinder'?circle(p.stockDiameter)*p.stockThickness:(circle(p.stockDiameter)-circle(p.stockInnerDiameter))*p.stockThickness;return {outer,removed,finished:Math.max(0,outer-removed),raw};}
export function fits(m:Machine,p:Part){if(m.type==='inspection'||m.type==='finishing')return true;const x=p.stockKind==='block'?p.stockLength:p.stockDiameter; const y=p.stockKind==='block'?p.stockWidth:p.stockDiameter;return p.stockThickness<=m.z&&((x<=m.x&&y<=m.y)||(x<=m.y&&y<=m.x));}
export function calculate(job:Job):Calculation {
 const issues:string[]=[];const results:PartResult[]=[];const ops:Operation[]=[];const setupSeen=new Set<string>();
 if(!Number.isInteger(job.quantity)||job.quantity<1)issues.push('Order quantity must be a positive whole number.');
 if(!job.parts.length)issues.push('Add at least one component.');
 const qty=Number.isInteger(job.quantity)&&job.quantity>0?job.quantity:1;
 for(const p of job.parts){const warnings:string[]=[];const g=partGeometry(p);const mat=job.materials.find(m=>m.id===p.materialId);const n=pos(p.count)&&Number.isInteger(p.count)?p.count*qty:qty;if(!Number.isInteger(p.count)||p.count<1)warnings.push('Component quantity must be a positive whole number.');
 if(!p.reviewed)warnings.push('Dimensions, feature positions, overlap and manufacturing route need review.');
 if(!p.tolerance.trim())warnings.push('Specify dimensional tolerances and surface finish.');
 if(p.kind!=='purchased'){
 if(!mat||!pos(mat.density))warnings.push('Select a material with a valid density.');
 if(!pos(g.outer)||!pos(p.thickness)||(p.kind==='block'&&(!pos(p.length)||!pos(p.width)))||((p.kind==='cylinder'||p.kind==='tube')&&!pos(p.diameter)))warnings.push('Enter positive finished shape dimensions or profile area.');if(p.kind==='profile'&&(!pos(p.length)||!pos(p.width)||p.profileArea>p.length*p.width))warnings.push('Enter a bounding length and width that enclose the profile area.');
 if(g.removed>=g.outer&&g.outer>0)warnings.push('Removed volume must be smaller than the component volume.');
 if(!pos(g.raw)||g.raw<g.outer)warnings.push('Selected stock volume is smaller than the finished outer volume.');
 if(p.stockThickness<p.thickness)warnings.push('Stock thickness / length must cover the finished thickness / length.');
 if(p.stockKind==='block'){const x=p.kind==='block'||p.kind==='profile'?p.length:p.diameter;const y=p.kind==='block'||p.kind==='profile'?p.width:p.diameter;if(!((p.stockLength>=x&&p.stockWidth>=y)||(p.stockLength>=y&&p.stockWidth>=x)))warnings.push('Stock length and width do not enclose the finished part.');}
 if(p.stockKind!=='block'){const needed=p.kind==='block'||p.kind==='profile'?Math.hypot(p.length,p.width):p.diameter;if(p.stockDiameter<needed)warnings.push('Stock diameter does not enclose the finished outline.');if(p.stockKind==='tube'&&((p.kind==='tube'&&p.stockInnerDiameter>p.innerDiameter)||(p.kind!=='tube'&&p.stockInnerDiameter>0)))warnings.push('The stock bore removes material required by the finished shape.');}
 if(p.kind==='tube'&&p.innerDiameter>=p.diameter)warnings.push('Inner diameter must be smaller than outer diameter.');
 for(const f of p.features){if(f.type==='pocket'?(!pos(f.length)||!pos(f.width)||f.length>p.length||f.width>p.width):(!pos(f.diameter)||f.diameter>Math.max(p.kind==='block'||p.kind==='profile'?Math.max(p.length,p.width):p.diameter,0)))warnings.push(`${f.name}: confirm positive feature dimensions within the finished outline.`);if(!pos(f.depth))warnings.push(`${f.name}: enter a confirmed depth.`);if(f.depth>p.thickness)warnings.push(`${f.name}: depth exceeds component thickness / length.`);if(!Number.isInteger(f.count)||f.count<1)warnings.push(`${f.name}: quantity must be a positive whole number.`);if(f.type==='counterbore'&&(f.coreDiameter>=f.diameter||!p.features.some(b=>b.type==='bore'&&Math.abs(b.diameter-f.coreDiameter)<.001&&b.depth>=f.depth&&b.count>=f.count)))warnings.push(`${f.name}: confirm a matching core bore; only its surrounding annulus is deducted.`);if(f.type==='thread')warnings.push(`${f.name}: cylindrical minor-diameter approximation; confirm thread pitch and engagement.`);}
 }else{if(!nonneg(p.purchasedWeight)||!nonneg(p.purchasedCost))warnings.push('Purchased weight and price must be non-negative.');}
 const density=mat?.density??0;const fw=p.kind==='purchased'?p.purchasedWeight:g.finished*density/1e9;const rw=p.kind==='purchased'?0:g.raw*density/1e9;const issued=rw*(1+Math.max(0,p.allocation)/100);const scrap=Math.max(0,issued-fw);const credit=scrap*job.pricing.scrapRecovery/100*(mat?.scrapRate??0);const mc=p.kind==='purchased'?p.purchasedCost:issued*(mat?.rate??0)-credit;
 results.push({part:p,outerVolume:g.outer,removedVolume:g.removed,finishedVolume:g.finished,rawVolume:g.raw,finishedWeight:fw,rawWeight:rw,issuedWeight:issued,count:n,materialCost:mc,scrapWeight:scrap,scrapCredit:credit,issues:warnings});
 issues.push(...warnings.map(w=>`${p.name}: ${w}`));if(p.kind==='purchased')continue;
 const factor=Math.max(.05,mat?.machiningFactor??1);
 const add=(key:string,name:string,detail:string,allowed:MachineType[],tool:string,time:(m:Machine)=>number)=>{const id=`${p.id}:${key}`;const override=job.overrides[id]??{};const candidates=job.machines.filter(m=>m.enabled&&allowed.includes(m.type)&&fits(m,p)).sort((a,b)=>allowed.indexOf(a.type)-allowed.indexOf(b.type));const selected=override.machineId?candidates.find(m=>m.id===override.machineId):candidates[0];const machine=selected;const dummy={mrr:10,feed:100} as Machine;const minutes=override.minutes??time(machine??dummy);const seenKey=`${p.id}:${machine?.id??'outsource'}`;const setup=override.setup??(setupSeen.has(seenKey)?0:machine?.setup??0);setupSeen.add(seenKey);if(!machine)issues.push(`${p.name} · ${name}: choose a capable machine or add an outsourcing rate.`);ops.push({id,partId:p.id,part:p.name,name,detail,tool:override.tool??tool,allowed,machineId:machine?.id??'',machine:machine?.name??'Machine required',minutes:Math.max(0,minutes),setup:Math.max(0,setup),count:n,rate:machine?.rate??0,cost:((Math.max(0,minutes)*n+Math.max(0,setup))/60)*(machine?.rate??0),inferred:override.minutes===undefined});};
 const round=p.kind==='cylinder'||p.kind==='tube';const mill:MachineType[]=job.route==='vmc'?['vmc','mill']:['mill','vmc'];const hole:MachineType[]=job.route==='vmc'?['vmc','drill','mill']:['drill','mill','vmc'];const turning:MachineType[]=round&&job.route==='conventional'?['lathe',...mill]:mill;
 add('cut','Stock preparation','Cut the selected blank; retain the specified machining allowances.',['cutting'],'Saw blade / selected cutting process',()=>4+Math.max(p.stockLength,p.stockDiameter)/100);
 add('faces',round?'Face and size the blank':'Datum, face and square','Establish a datum, finish thickness and external dimensions; plan the reverse-face setup.',turning,round?'Facing tool / face mill':'Face mill and end mill',m=>4+Math.max(0,g.raw-g.outer)/(1000*Math.max(.1,m.mrr)*factor));
 if(p.kind==='profile')add('profile','Machine external profile','Machine the verified outline and lugs; confirm tool access and workholding.',mill,'End mill',m=>5+Math.sqrt(Math.max(0,p.profileArea))*6/Math.max(1,m.feed));
 if(p.kind==='tube'&&p.innerDiameter>0)add('basebore','Finish internal bore','Machine and inspect the base tube bore.',turning,'Boring bar / boring head',()=>5);
 for(const f of p.features){if(f.type==='thread')add(f.id,'Drill and tap',`${f.count} × ${f.name}; confirm minor diameter, pitch and engagement.`,hole,'Tap drill and matching tap',m=>2+f.count*(Math.max(f.depth,1)/Math.max(1,m.feed)*2+.6));else if(f.type==='pocket')add(f.id,'Pocket milling',`${f.count} × ${f.length} × ${f.width} × ${f.depth} mm pockets.`,mill,'Roughing and finishing end mills',m=>2+featureVolume(f)/(1000*Math.max(.1,m.mrr)*factor));else if(f.diameter>30||f.type==='counterbore')add(f.id,f.type==='counterbore'?'Machine stepped recess':'Rough and finish bore',`${f.count} × Ø${f.diameter} × ${f.depth} mm deep. ${f.type==='counterbore'?'Incremental annulus around the core bore.':'Confirm bore tolerance and finish.'}`,turning,'Boring head / circular milling cutter',m=>3+featureVolume(f)/(1000*Math.max(.1,m.mrr)*factor));else add(f.id,'Drill holes',`${f.count} × Ø${f.diameter} × ${f.depth} mm deep.`,hole,'Spot drill and twist drill',m=>1.5+f.count*(Math.max(f.depth,1)/Math.max(1,m.feed)+.35));}
 add('deburr','Deburr and edge finish','Remove burrs; apply specified edge breaks.',['finishing','vmc','mill'],'Deburring tools',()=>3);
 add('inspect','Dimensional inspection',p.tolerance||'Define acceptance criteria before production.',['inspection'],'Caliper, bore gauge and thread gauges',()=>5+p.features.length*.5);
 }
 const pp=job.pricing;for(const [k,v] of Object.entries(pp))if(!nonneg(v))issues.push(`Pricing field ${k} must be non-negative.`);for(const k of ['scrapRecovery','overhead','tax'] as const)if(pp[k]>100)issues.push(`${k} must not exceed 100%.`);
 const materialCost=results.reduce((s,r)=>s+r.materialCost*r.count,0);const runCost=ops.reduce((s,o)=>s+o.minutes*o.count*o.rate/60,0);const setupCost=ops.reduce((s,o)=>s+o.setup*o.rate/60,0);const machiningCost=runCost+setupCost;const extraCost=pp.tooling+qty*(pp.assemblyPerUnit+pp.finishingPerUnit+pp.packagingPerUnit);const directCost=materialCost+machiningCost+extraCost;const overheadCost=directCost*pp.overhead/100;const cost=directCost+overheadCost;const sell=cost*(1+pp.markup/100);const tax=sell*pp.tax/100;const finishedWeight=results.reduce((s,r)=>s+r.finishedWeight*r.count,0);const rawWeight=results.reduce((s,r)=>s+r.issuedWeight*r.count,0);const scrapWeight=results.reduce((s,r)=>s+r.scrapWeight*r.count,0);
 const numericValid=[cost,sell,finishedWeight,rawWeight].every(Number.isFinite)&&results.every(r=>r.part.kind==='purchased'||(r.outerVolume>r.removedVolume&&r.rawVolume>=r.outerVolume));
 // Thread approximations remain disclosed; other review issues prevent a reviewed status.
 const blocking=issues.filter(i=>!i.includes('cylindrical minor-diameter approximation'));
 return {parts:results,operations:ops,issues,finishedWeight,rawWeight,scrapWeight,materialCost,machiningCost,setupCost,runCost,extraCost,directCost,overheadCost,cost,sell,tax,total:sell+tax,unitCost:cost/qty,unitPrice:(sell+tax)/qty,minutes:ops.reduce((s,o)=>s+o.minutes*o.count+o.setup,0),yield:rawWeight>0?Math.min(100,(rawWeight-scrapWeight)/rawWeight*100):0,status:blocking.length===0?'reviewed':'draft',valid:numericValid};
}
function catalogueMaterials(list:Material[]) {
 if(!Array.isArray(list)||list.length>100)throw new Error('Invalid material catalogue.');
 const ids=new Set<string>();for(const m of list){if(!m||typeof m.id!=='string'||!m.id||typeof m.name!=='string'||!m.name.trim()||ids.has(m.id)||typeof m.grade!=='string'||typeof m.notes!=='string'||!pos(m.density)||!nonneg(m.rate)||!nonneg(m.scrapRate)||!pos(m.machiningFactor))throw new Error('Invalid material density, price or machining factor.');ids.add(m.id);}
}
function catalogueMachines(list:Machine[]) {
 if(!Array.isArray(list)||list.length>100)throw new Error('Invalid machine catalogue.');
 const ids=new Set<string>();for(const m of list){if(!m||typeof m.id!=='string'||!m.id||typeof m.name!=='string'||!m.name.trim()||ids.has(m.id)||!['cutting','vmc','mill','drill','lathe','finishing','inspection'].includes(m.type)||typeof m.enabled!=='boolean'||typeof m.notes!=='string'||!nonneg(m.rate)||!nonneg(m.setup)||!pos(m.mrr)||!pos(m.feed)||!pos(m.x)||!pos(m.y)||!pos(m.z))throw new Error('Invalid machine capacity, times or rates.');ids.add(m.id);}
}
export function assertWorkspace(value:unknown):asserts value is Workspace {
 const w=value as Workspace;if(!w||!Array.isArray(w.jobs)||w.jobs.length>100)throw new Error('Invalid workspace or workspace limit exceeded.');
 catalogueMaterials(w.materials);catalogueMachines(w.machines);
 const jobIds=new Set<string>();
 for(const j of w.jobs){
  if(!j||typeof j.id!=='string'||!j.id||jobIds.has(j.id)||typeof j.name!=='string'||!j.name.trim()||!Number.isInteger(j.quantity)||j.quantity<1||j.quantity>100000||!Array.isArray(j.parts)||j.parts.length>100||j.unit!=='mm'||!['vmc','conventional'].includes(j.route)||!j.pricing||!j.overrides||typeof j.overrides!=='object'||Array.isArray(j.overrides))throw new Error('Invalid estimate data.');
  jobIds.add(j.id);catalogueMaterials(j.materials);catalogueMachines(j.machines);
  for(const k of ['reference','customer','scope','drawingUrl','drawingName','updatedAt'] as const)if(typeof j[k]!=='string')throw new Error('Invalid estimate text.');
  if(j.drawingUrl&&!/^\/(?:sample\/stuffing-box\.pdf|api\/drawings\/[a-zA-Z0-9-]+)$/.test(j.drawingUrl)&&!/^local:[a-zA-Z0-9-]+$/.test(j.drawingUrl))throw new Error('Invalid drawing reference. Upload the drawing to this workspace.');
  const partIds=new Set<string>();for(const p of j.parts){
   if(!p||typeof p.id!=='string'||!p.id||typeof p.name!=='string'||!p.name.trim()||partIds.has(p.id)||typeof p.materialId!=='string'||typeof p.tolerance!=='string'||typeof p.notes!=='string'||typeof p.reviewed!=='boolean'||!Array.isArray(p.features)||p.features.length>100||!['block','cylinder','tube','profile','purchased'].includes(p.kind)||!['block','cylinder','tube'].includes(p.stockKind))throw new Error('Invalid component data.');
   partIds.add(p.id);if(!Number.isInteger(p.count)||p.count<1)throw new Error('Component quantity must be a positive whole number.');
   for(const k of ['length','width','thickness','diameter','innerDiameter','profileArea','purchasedWeight','purchasedCost','stockLength','stockWidth','stockThickness','stockDiameter','stockInnerDiameter','allocation'] as const)if(!nonneg(p[k]))throw new Error('Component dimensions must be finite and non-negative.');
   const featureIds=new Set<string>();for(const f of p.features){
    if(!f||typeof f.id!=='string'||!f.id||typeof f.name!=='string'||!f.name.trim()||featureIds.has(f.id)||typeof f.source!=='string'||!['bore','counterbore','thread','pocket'].includes(f.type)||!Number.isInteger(f.count)||f.count<1)throw new Error('Invalid feature type, name or quantity.');
    featureIds.add(f.id);for(const k of ['diameter','coreDiameter','depth','length','width'] as const)if(!nonneg(f[k]))throw new Error('Feature dimensions must be finite and non-negative.');
   }
  }
  for(const k of ['tooling','assemblyPerUnit','finishingPerUnit','packagingPerUnit','overhead','markup','tax','scrapRecovery'] as const)if(!nonneg(j.pricing[k]))throw new Error('Pricing values must be finite and non-negative.');
  for(const k of ['scrapRecovery','overhead','tax'] as const)if(j.pricing[k]>100)throw new Error('Pricing percentages must not exceed 100.');
  for(const o of Object.values(j.overrides)){
   if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('Invalid operation override.');
   if(o.minutes!==undefined&&!nonneg(o.minutes))throw new Error('Operation time must be non-negative.');if(o.setup!==undefined&&!nonneg(o.setup))throw new Error('Setup time must be non-negative.');if(o.machineId!==undefined&&typeof o.machineId!=='string')throw new Error('Invalid operation machine.');if(o.tool!==undefined&&typeof o.tool!=='string')throw new Error('Invalid operation tool.');
  }
 }
}
