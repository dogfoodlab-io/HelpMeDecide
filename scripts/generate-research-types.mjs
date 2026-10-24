import { readFile, writeFile } from 'node:fs/promises';
const schema = JSON.parse(await readFile(new URL('../backend/contracts/research-result.v1.schema.json', import.meta.url), 'utf8'));
function type(node) {
  if (node.anyOf) return node.anyOf.map(type).join(' | ');
  if (node.type==='object') return `{ ${Object.entries(node.properties).map(([key,value])=>`${JSON.stringify(key)}: ${type(value)}`).join('; ')} }`;
  if (node.type==='array') return `Array<${type(node.items)}>`;
  if (['string','number','boolean','null'].includes(node.type)) return node.type;
  throw new Error('Unsupported research schema type');
}
const output=`// Generated from backend/contracts/research-result.v1.schema.json.\nexport type ResearchResult = ${type(schema)};\n`;
const target=new URL('../src/domain/research.generated.ts',import.meta.url);
if(process.argv.includes('--check')) { if(await readFile(target,'utf8')!==output) throw new Error('Research types are stale. Run npm run contracts:generate.'); }
else await writeFile(target,output);
