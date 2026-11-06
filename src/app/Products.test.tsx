import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ProductCard} from './ProductCard';
import {ProductPhoto} from './ProductPhoto';
import {PurchaseRequirements} from './PurchaseRequirements';
import {EvidenceTradeoffMap} from './EvidenceTradeoffMap';
import {initialContext,type SavedDecision,type DecisionRepository} from '../services/decisions';
import type {ProductEditorProps,ProductRepository} from '../services/products';
import type {ProductFact,ProductEvidence,Requirement} from '../domain/productEvidence.generated';
afterEach(cleanup);
const fact=(value:number):ProductFact=>({key:'battery-life',label:'Battery life',value,unit:'hours',sourceUrls:['https://www.bose.com/product'],quote:`Battery ${value} hours`,observedAt:'2026-10-24T00:00:00Z',provenance:'researched',verification:'reported'});
const evidence=(value:number):ProductEvidence=>({identity:{brand:'Bose',model:'QC-SC',variant:'Black',match:'exact'},targetCandidateId:null,image:null,offers:[{url:'https://www.bose.com/product',seller:'Bose',amount:300,currency:'USD',region:'US',availability:'in-stock',sourceUrls:['https://www.bose.com/product'],observedAt:'2026-10-24T00:00:00Z'}],facts:[fact(value)]});
const model=()=>({revision:0,goal:'Headphones',context:{purpose:'Commuting',budget:'350',currency:'USD',region:'United States',nonnegotiables:'Comfortable over-ear noise cancelling'},useCases:[],constraints:[],preferences:[],candidates:[{id:'a',label:'Headphones A',attributes:{},provisional:false,price:{amount:300,currency:'USD',observedAt:'2026-10-24T00:00:00Z'},evidence:evidence(24)},{id:'b',label:'Headphones B',attributes:{},provisional:false,price:{amount:350,currency:'USD',observedAt:'2026-10-24T00:00:00Z'},evidence:evidence(30)}]});
function props():ProductEditorProps{const decision:SavedDecision={id:'decision',title:'Headphones',description:'Commuting',revision:0,canonical_model:model(),archived_at:null,updated_at:''};return{decision,productRepository:{apply:vi.fn(async()=>{})},repository:{get:vi.fn(async()=>decision)} as unknown as DecisionRepository,onSaved:vi.fn()};}
it('shows exact identity, dated offers and fact sources, while missing images stay honest',async()=>{
  const m=model();render(<ProductCard candidate={m.candidates[0]} model={m}/>);expect(screen.getByText(/QC-SC/)).toBeInTheDocument();expect(screen.getByText('Photo couldn’t be loaded')).toBeInTheDocument();expect(screen.getByText('24 hours',{selector:'dd'})).toBeInTheDocument();
  await userEvent.click(screen.getByText('Offers, specifications & sources'));expect(screen.getByRole('link',{name:'Bose'})).toHaveAttribute('href','https://www.bose.com/product');expect(screen.getByText(/Reported in stock/)).toBeInTheDocument();expect(screen.getByText('Battery 24 hours')).toBeInTheDocument();
});
it('suggests must-haves from existing context without requiring the user to define a rule',async()=>{
  const p=props();render(<PurchaseRequirements {...p}/>);const user=userEvent.setup();expect(screen.queryByRole('textbox')).toBeNull();await user.click(screen.getByRole('button',{name:'Use these suggested must-haves'}));
  await waitFor(()=>expect(p.productRepository!.apply).toHaveBeenCalled());const command=vi.mocked(p.productRepository!.apply).mock.calls[0][1];expect(command.type).toBe('requirements');if(command.type==='requirements')expect(command.payload.requirements.map(r=>r.key)).toEqual(['noise-cancelling','form-factor','personal-comfort']);
});
it('starts a sourced map with ready-made axes and saves a concrete judgment without entering measurements',async()=>{
  const submit=vi.fn(),change=vi.fn(),m=model();const view=render(<EvidenceTradeoffMap model={m} draft={{}} change={change} disabled={false} submit={submit}/>);expect(screen.getByRole('img',{name:/Price versus Battery life/})).toBeInTheDocument();expect(screen.queryByRole('spinbutton')).toBeNull();expect(screen.getByText('24 hours',{selector:'td'})).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button',{name:'The lower-priced option is enough for me.'}));expect(change).toHaveBeenCalledWith({evidenceJudgment:'The lower-priced option is enough for me.'});view.rerender(<EvidenceTradeoffMap model={m} draft={{evidenceJudgment:'The lower-priced option is enough for me.'}} change={change} disabled={false} submit={submit}/>);await userEvent.click(screen.getByRole('button',{name:'Save this comparison'}));expect(submit).toHaveBeenCalledWith('evidence-map',{axes:['price','battery-life'],judgment:'The lower-priced option is enough for me.'});
});
it('displays required failures and conflicting facts without treating missing data as zero',()=>{
  const m=model();m.candidates[0].evidence.facts.push(fact(20));const rule:Requirement={id:'battery',key:'battery-life',label:'At least 28 hours',operator:'gte',value:28,unit:'hours',required:true,provenance:'user-stated'};render(<ProductCard candidate={m.candidates[0]} model={{...m,requirements:[rule]}}/>);expect(screen.getByText('Sources disagree')).toBeInTheDocument();expect(screen.getByText('Needs checking:')).toBeInTheDocument();
});
it('retries a lost fact correction with the same command and keeps the entered value',async()=>{
  const p=props();vi.mocked(p.productRepository!.apply).mockRejectedValueOnce(new Error('Connection lost'));render(<ProductCard candidate={p.decision.canonical_model.candidates[0]} model={p.decision.canonical_model} editor={p}/>);const user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Review or correct a fact'}));await user.selectOptions(screen.getByLabelText('Which fact?'),'battery-life');const input=screen.getByLabelText('Correct value');await user.clear(input);await user.type(input,'18');await user.click(screen.getByRole('button',{name:'Save this fact'}));await user.click(await screen.findByRole('button',{name:'Retry saving the same fact'}));const calls=vi.mocked(p.productRepository!.apply).mock.calls;expect(calls[0][1]).toEqual(calls[1][1]);expect(calls[1][1].payload).toMatchObject({candidateId:'a',fact:{value:18,unit:'hours'}});
});
it('preserves the correction draft across a stale revision and requires deliberate review',async()=>{
  const p=props();vi.mocked(p.productRepository!.apply).mockRejectedValueOnce({code:'40001',message:'stale'});render(<ProductCard candidate={p.decision.canonical_model.candidates[0]} model={p.decision.canonical_model} editor={p}/>);const user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Review or correct a fact'}));await user.clear(screen.getByLabelText('Correct value'));await user.type(screen.getByLabelText('Correct value'),'280');await user.click(screen.getByRole('button',{name:'Save this fact'}));expect(await screen.findByRole('button',{name:'Use latest decision for this correction'})).toBeEnabled();expect(screen.getByLabelText('Correct value')).toHaveValue(280);expect(screen.getByRole('button',{name:'Save this fact'})).toBeDisabled();
});
it('reuses explicit intake context while leaving ambiguous currency and region unknown',()=>{
  expect(initialContext('Help me choose A and B for commuting under $350.')).toEqual({budget:'350',purpose:'commuting'});expect(initialContext('Headphones for commuting under 350 USD in the United States.')).toMatchObject({budget:'350',currency:'USD',region:'United States',purpose:'commuting'});
});
it('automatically resolves a saved product photo with a clickable source and no research action',async()=>{
  let finish!:(photos:Array<{url:string;sourceUrl:string}>)=>void;const loader=vi.fn(()=>new Promise<Array<{url:string;sourceUrl:string}>>(r=>{finish=r;}));
  const m=model();render(<ProductCard candidate={m.candidates[0]} model={m} imageLoader={loader}/>);expect(screen.getByText('Finding product photo…')).toBeInTheDocument();
  finish([{url:'https://cdn.shopify.com/photo.png',sourceUrl:'https://www.bose.com/product'}]);
  expect(await screen.findByRole('img',{name:'Headphones A'})).toHaveAttribute('src','https://cdn.shopify.com/photo.png');expect(screen.getByRole('link',{name:'Photo source for Headphones A'})).toHaveAttribute('href','https://www.bose.com/product');expect(loader).toHaveBeenCalledTimes(1);
});
it('recovers a broken saved URL, tries the next source photo and allows a deliberate retry',async()=>{
  const first={url:'https://cdn.shopify.com/first.jpg',sourceUrl:'https://www.bose.com/product'},second={...first,url:'https://cdn.shopify.com/second.jpg'};const loader=vi.fn(async()=>[first,second]);
  render(<ProductPhoto name="Headphones" candidateId="a" initial={first} loader={loader}/>);fireEvent.error(screen.getByRole('img'));await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src',second.url));expect(loader).toHaveBeenCalledTimes(1);
  fireEvent.error(screen.getByRole('img'));await userEvent.click(screen.getByRole('button',{name:'Retry photo'}));await waitFor(()=>expect(screen.getByRole('img')).toHaveAttribute('src',first.url));expect(loader).toHaveBeenLastCalledWith('a',true,[first.url,second.url]);
});
it('does not apply an old image response to a newly selected product',async()=>{
  let finish!:(photos:Array<{url:string;sourceUrl:string}>)=>void;const loader=vi.fn((id:string)=>id==='a'?new Promise<Array<{url:string;sourceUrl:string}>>(r=>{finish=r;}):Promise.resolve([{url:'https://cdn.shopify.com/b.jpg',sourceUrl:'https://www.bose.com/b'}]));
  const view=render(<ProductPhoto name="A" candidateId="a" loader={loader}/>);view.rerender(<ProductPhoto name="B" candidateId="b" loader={loader}/>);await screen.findByRole('img',{name:'B'});finish([{url:'https://cdn.shopify.com/a.jpg',sourceUrl:'https://www.bose.com/a'}]);await waitFor(()=>expect(screen.getByRole('img',{name:'B'})).toHaveAttribute('src','https://cdn.shopify.com/b.jpg'));
});
