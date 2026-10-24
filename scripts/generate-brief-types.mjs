import {readFile,writeFile} from 'node:fs/promises';
const schema=JSON.parse(await readFile(new URL('../backend/contracts/brief-result.v1.schema.json',import.meta.url),'utf8'));
function type(node) {
  if(node.$ref)return node.$ref.split('/').at(-1);
  if('const'in node)return JSON.stringify(node.const);
  if(node.enum)return node.enum.map(value=>JSON.stringify(value)).join(' | ');
  if(node.oneOf||node.anyOf)return (node.oneOf??node.anyOf).map(type).join(' | ');
  if(node.type==='object') {
    if(node.additionalProperties&&typeof node.additionalProperties==='object')return `Record<string, ${type(node.additionalProperties)}>`;
    return `{ ${Object.entries(node.properties??{}).map(([key,value])=>`${JSON.stringify(key)}${node.required?.includes(key)?'':'?'}: ${type(value)}`).join('; ')} }`;
  }
  if(node.type==='array')return `Array<${type(node.items)}>`;
  if(node.type==='integer')return 'number';
  if(['string','number','boolean','null'].includes(node.type))return node.type;
  throw new Error('Unsupported exploration schema type');
}
if(await readFile(new URL('../backend/supabase/functions/_shared/brief-result.v1.schema.json',import.meta.url),'utf8')!==await readFile(new URL('../backend/contracts/brief-result.v1.schema.json',import.meta.url),'utf8'))throw new Error('Backend runtime brief schema is stale.');
const output=`// Generated from backend/contracts/brief-result.v1.schema.json.\nexport type DecisionBrief = ${type(schema)};\n`;
const target=new URL('../src/domain/brief.generated.ts',import.meta.url);
if(process.argv.includes('--check')){if(await readFile(target,'utf8')!==output)throw new Error('Brief types are stale. Run npm run contracts:generate.');}
else await writeFile(target,output);
