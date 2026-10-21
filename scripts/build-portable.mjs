import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const trequire=createRequire(require.resolve('tesseract.js'));
const core=path.dirname(trequire.resolve('tesseract.js-core/package.json'));
await fs.mkdir(path.join(root,'public/ocr/core'),{recursive:true});
await fs.mkdir(path.join(root,'public/ocr/lang'),{recursive:true});
for(const name of await fs.readdir(core))if(name.endsWith('.wasm')||name.endsWith('.wasm.js'))await fs.copyFile(path.join(core,name),path.join(root,'public/ocr/core',name));
await fs.copyFile(path.join(root,'node_modules/tesseract.js/dist/worker.min.js'),path.join(root,'public/ocr/worker.min.js'));
await fs.copyFile(path.join(root,'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),path.join(root,'public/ocr/pdf.worker.min.mjs'));
for(const [source,destination] of [['cmaps','cmaps'],['standard_fonts','fonts'],['wasm','pdf-wasm']])await fs.cp(path.join(root,'node_modules/pdfjs-dist',source),path.join(root,'public/ocr',destination),{recursive:true});
await fs.copyFile(path.join(root,'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),path.join(root,'public/ocr/lang/eng.traineddata.gz'));
const frontend=await build({entryPoints:[path.join(root,'portable/entry.tsx')],metafile:true,bundle:true,outfile:path.join(root,'webapp/app.js'),platform:'browser',format:'iife',conditions:['style'],minify:true,define:{'process.env.NODE_ENV':'"production"'},tsconfig:path.join(root,'tsconfig.json'),jsx:'automatic'});
const packageDirs=new Set([core,path.dirname(require.resolve('pdfjs-dist/package.json')),path.dirname(require.resolve('tesseract.js/package.json')),path.dirname(require.resolve('@tesseract.js-data/eng/package.json'))]);
for(const input of Object.keys(frontend.metafile.inputs)){
 if(!input.includes('node_modules'))continue;let current=path.dirname(path.resolve(root,input));
 while(current!==path.dirname(current)){try{await fs.access(path.join(current,'package.json'));packageDirs.add(current);break;}catch{}current=path.dirname(current);}
}
const notices=[];await fs.mkdir(path.join(root,'licenses'),{recursive:true});
for(const directory of packageDirs){
 const pkg=JSON.parse(await fs.readFile(path.join(directory,'package.json'),'utf8'));const target=path.join(root,'licenses',pkg.name.replace(/[^a-zA-Z0-9-]/g,'_'));
 await fs.mkdir(target,{recursive:true});for(const name of await fs.readdir(directory))if(/^(license|licence|copying|notice)/i.test(name))await fs.cp(path.join(directory,name),path.join(target,name),{recursive:true});
 notices.push({package:pkg.name,version:pkg.version,license:pkg.license??'See original package notices'});
}
await fs.copyFile(path.join(root,'vendor/shadcn-tailwind-4.13.0.LICENSE.md'),path.join(root,'licenses/shadcn-tailwind.LICENSE.md'));
await fs.copyFile(path.join(root,'node_modules/tesseract.js/dist/worker.min.js.LICENSE.txt'),path.join(root,'public/ocr/worker.min.js.LICENSE.txt'));
await fs.writeFile(path.join(root,'licenses/packages.json'),JSON.stringify(notices,null,2));
const css=await fs.readFile(path.join(root,'app/globals.css'),'utf8');
const postcssPath=path.join(root,'node_modules/.pnpm');
const postcssDir=(await fs.readdir(postcssPath)).find(n=>/^postcss@/.test(n));
const postcss=(await import(path.join(postcssPath,postcssDir,'node_modules/postcss/lib/postcss.mjs'))).default;
const tailwind=(await import('@tailwindcss/postcss')).default;
const out=await postcss([tailwind()]).process(css,{from:path.join(root,'app/globals.css'),to:path.join(root,'webapp/app.css')});
await fs.writeFile(path.join(root,'webapp/app.css'),out.css);
await fs.writeFile(path.join(root,'webapp/index.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ForgePlan | Manufacturing estimates</title><meta name="description" content="Drawing-based manufacturing operations, weights and quotations."><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>');
const transformed=await build({entryPoints:[path.join(root,'lib/manufacturing.ts')],bundle:true,write:false,platform:'node',format:'esm'});
const model=await import('data:text/javascript;base64,'+Buffer.from(transformed.outputFiles[0].contents).toString('base64'));
await fs.writeFile(path.join(root,'portable/default-workspace.json'),JSON.stringify(model.initialWorkspace(),null,2));
await fs.writeFile(path.join(root,'portable/sample-estimate.json'),JSON.stringify({version:1,job:model.sampleJob()},null,2));
const image='data:image/png;base64,'+Buffer.from(await fs.readFile(path.join(root,'public/sample/stuffing-box.png'))).toString('base64');
const pdf='data:application/pdf;base64,'+Buffer.from(await fs.readFile(path.join(root,'public/sample/stuffing-box.pdf'))).toString('base64');
const js=(await fs.readFile(path.join(root,'webapp/app.js'),'utf8')).replace(/<\/script/gi,'<\\/script');
const worker=await fs.readFile(path.join(root,'public/ocr/pdf.worker.min.mjs'),'utf8');
const boot=JSON.stringify({image,pdf,worker}).replace(/</g,'\\u003c');
const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ForgePlan | Local workspace</title><style>'+out.css+'</style></head><body><div id="root"></div><script>window.__FORGEPLAN_LOCAL__=true;const assets='+boot+';window.__REFERENCE_IMAGE__=assets.image;window.__REFERENCE_PDF__=assets.pdf;window.__PDF_WORKER__=assets.worker;</script><script>'+js+'</script></body></html>';
await fs.writeFile(path.join(root,'webapp/ForgePlan_Local_Workspace.html'),html);
console.log(JSON.stringify({frontend:'webapp/index.html',standalone:'webapp/ForgePlan_Local_Workspace.html',ocrAssets:'public/ocr',portableServer:'portable/server.py'}));
