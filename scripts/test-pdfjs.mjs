// Exercise the exact self-hosted parser during the deployment build.
import assert from 'node:assert/strict';
// Canvas geometry is not used by this parser/text smoke check.
globalThis.DOMMatrix ??= class {};
globalThis.Path2D ??= class {};
globalThis.ImageData ??= class {};
const {getDocument} = await import('../js/vendor/pdfjs/build/pdf.mjs');
const content = 'BT /F1 18 Tf 72 720 Td (The Reader PDF smoke test) Tj ET';
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
];
let pdf='%PDF-1.7\n', offsets=[0];
objects.forEach((obj,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`;});
const xref=pdf.length;
pdf+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
const task=getDocument({data:new TextEncoder().encode(pdf),isEvalSupported:false});
const doc=await task.promise;
assert.equal(doc.numPages,1);
const page=await doc.getPage(1);
const text=await page.getTextContent();
assert(text.items.some(item=>item.str==='The Reader PDF smoke test'));
await task.destroy();
const broken=getDocument({data:new TextEncoder().encode('This is not a PDF')});
await assert.rejects(broken.promise);
await broken.destroy();
console.log('Pinned PDF.js: real PDF text and malformed-file checks passed');
