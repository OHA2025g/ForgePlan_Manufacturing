export type Token={id:string;value:number;label:string;context:string;x:number;y:number;w:number;h:number;page:number};
export type DrawingPage={image:string;text:string;tokens:Token[];pages:number;width:number;height:number};
function values(text:string,page:number){return [...text.matchAll(/(?:[Øø∅Φφ]|\bM)?\s*\d+(?:\.\d+)?/g)].map((m,i)=>{const n=Number(m[0].replace(/[^\d.]/g,''));return {id:`${page}-${i}`,value:n,label:m[0].trim(),context:text.slice(Math.max(0,(m.index??0)-20),(m.index??0)+40).trim(),x:0,y:0,w:0,h:0,page};}).filter(t=>t.value>0&&t.value<=100000);}
export async function renderDrawing(url:string,page=1):Promise<DrawingPage>{const response=await fetch(url);if(!response.ok)throw new Error('Unable to read this drawing.');const blob=await response.blob();const bytes=new Uint8Array(await blob.arrayBuffer());if(bytes[0]!==0x25||bytes[1]!==0x50){const image=URL.createObjectURL(blob);const size=await new Promise<{width:number;height:number}>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error('The image could not be opened.'));img.src=image;});return {image,text:'',tokens:[],pages:1,...size};}
 const pdfjs=await import('pdfjs-dist');if(window.__PDF_WORKER__){pdfjs.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob([window.__PDF_WORKER__],{type:'text/javascript'}));}else pdfjs.GlobalWorkerOptions.workerSrc='/ocr/pdf.worker.min.mjs';const task=pdfjs.getDocument({data:bytes,...(window.__FORGEPLAN_LOCAL__?{}:{cMapUrl:'/ocr/cmaps/',cMapPacked:true,standardFontDataUrl:'/ocr/fonts/',wasmUrl:'/ocr/pdf-wasm/'})});const pdf=await task.promise;const selected=await pdf.getPage(Math.min(Math.max(1,page),pdf.numPages));const base=selected.getViewport({scale:1});const view=selected.getViewport({scale:Math.min(2.8,2400/base.width,2400/base.height)});const canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);const context=canvas.getContext('2d');if(!context)throw new Error('Your browser could not render the drawing.');await selected.render({canvas,canvasContext:context,viewport:view}).promise;const content=await selected.getTextContent();const text=content.items.map(item=>'str' in item?item.str:'').join(' ');const result={image:canvas.toDataURL('image/png'),text,tokens:values(text,page),pages:pdf.numPages,width:canvas.width,height:canvas.height};await task.destroy();return result;}
export async function recogniseDrawing(image:string,page:number,progress:(n:number)=>void):Promise<{text:string;tokens:Token[]}>{
 const {createWorker,PSM}=await import('tesseract.js');
 const img=new Image();img.src=image;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=img.naturalHeight;canvas.height=img.naturalWidth;
 const context=canvas.getContext('2d');if(!context)throw new Error('Your browser could not prepare drawing text.');
 context.translate(canvas.width,0);context.rotate(Math.PI/2);context.drawImage(img,0,0);
 const inputs=[image,canvas.toDataURL('image/png')];let pass=0;
 const worker=await createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',workerBlobURL:false,logger:m=>{if(m.status==='recognizing text')progress(Math.round((pass+m.progress)/inputs.length*100));}});
 try{
  await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});const tokens:Token[]=[];const texts:string[]=[];
  for(pass=0;pass<inputs.length;pass++){
   const r=await worker.recognize(inputs[pass],{}, {text:true,blocks:true});texts.push(r.data.text);
   for(const block of r.data.blocks??[])for(const para of block.paragraphs??[])for(const line of para.lines??[])for(const word of line.words??[]){
    const match=word.text.match(/(?:[Øø∅Φφ]|M)?\s*\d+(?:\.\d+)?/);if(!match)continue;
    const value=Number(match[0].replace(/[^\d.]/g,''));if(!(value>0&&value<100000))continue;
    const b=word.bbox;const x0=pass?b.y0:b.x0;const y0=pass?img.naturalHeight-b.x1:b.y0;const x1=pass?b.y1:b.x1;const y1=pass?img.naturalHeight-b.x0:b.y1;
    const x=x0/img.naturalWidth*100,y=y0/img.naturalHeight*100,w=(x1-x0)/img.naturalWidth*100,h=(y1-y0)/img.naturalHeight*100;
    if(tokens.some(t=>t.value===value&&Math.abs(t.x-x)<.5&&Math.abs(t.y-y)<.5))continue;
    tokens.push({id:`ocr-${tokens.length}`,value,label:word.text,context:line.text,x,y,w,h,page});
   }
  }
  const text=texts.join('\n\nVertical dimension text:\n');return {text,tokens:tokens.length?tokens:values(text,page)};
 }finally{await worker.terminate();}
}
