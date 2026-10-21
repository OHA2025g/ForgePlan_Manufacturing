import assert from 'node:assert/strict';
import path from 'node:path';
import {createWorker,PSM} from 'tesseract.js';
const worker=await createWorker('eng',1,{langPath:path.resolve('public/ocr/lang'),cacheMethod:'none'});
try{
 await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
 const result=await worker.recognize(path.resolve('public/sample/stuffing-box.png'),{}, {text:true,blocks:true});
 const vertical=await worker.recognize(path.resolve('public/sample/stuffing-box.png'),{rotateRadians:Math.PI/2}, {text:true,blocks:true});
 const text=result.data.text+'\n'+vertical.data.text;
 assert.ok(text.length>100,'The drawing reader must extract actual drawing text.');
 const expected=['220','127','154'];const found=expected.filter(value=>text.includes(value));
 assert.ok(found.length>=2,'The reader should locate at least two known body dimensions.');
 assert.ok(result.data.blocks?.length>0,'Coordinate blocks are required for clickable dimension candidates.');
 console.log(JSON.stringify({reader:'Local Tesseract OCR, horizontal and vertical labels',knownDimensionsFound:found,textCharacters:text.length,coordinateBlocks:result.data.blocks.length+vertical.data.blocks.length}));
}finally{await worker.terminate();}
