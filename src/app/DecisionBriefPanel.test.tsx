import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DecisionBriefPanel} from './DecisionBriefPanel';
import type {BriefRepository,BriefState,SavedBrief} from '../services/briefs';
import type {DecisionRepository,SavedDecision} from '../services/decisions';
afterEach(cleanup);
const model={revision:0,goal:'Headphones for commuting',useCases:[],constraints:[],candidates:[{id:'a',label:'Headphones A',attributes:{},provisional:false},{id:'b',label:'Headphones B',attributes:{},provisional:false}],preferences:[]};
const decision:SavedDecision={id:'decision',title:'My headphones',description:'For commuting',revision:0,canonical_model:model,archived_at:null,updated_at:''};
const a={level:'limited' as const,explanation:'More evidence would help.'};
const brief:SavedBrief={id:'brief',version:1,revision:0,basis_hash:'basis',created_at:'2026-10-24T12:00:00Z',snapshot:{title:'My headphones',description:'For commuting',model,sources:[]},brief:{outcome:'investigate-further',candidateIds:['a','b'],title:'Try both for comfort',recommendation:'Try both before committing.',reasons:[{text:'Comfort is still uncertain.',sourceIds:[],preferenceIds:[]}],tradeoffsToConsider:[],uncertainties:['Comfort'],whatWouldChangeAnswer:['A comfortable fit'],nextSteps:['Try both in a shop.'],assessments:{facts:a,preferences:a,stability:a}}};
function setup(patch:Partial<BriefState>={}){
  const state:BriefState={basisHash:'basis',enabled:true,dailyLimit:8,dailyUsed:0,briefs:[],jobs:[],...patch};
  const service:BriefRepository={load:vi.fn(async()=>state),start:vi.fn(async()=>{}),cancel:vi.fn(async()=>{}),choose:vi.fn(async()=>{})};
  const repository={get:vi.fn(async()=>decision)} as unknown as DecisionRepository;const saved=vi.fn();
  const props={briefRepository:service,repository,decision,onSaved:saved};
  const view=render(<DecisionBriefPanel {...props}/>);return{service,state,repository,saved,...view,props};
}
describe('the app-led decision finish',()=>{
  it('offers synthesis without configuration or writing and can record wait directly',async()=>{
    const {service}=setup();const user=userEvent.setup();await waitFor(()=>expect(screen.getByRole('button',{name:'Help me decide'})).toBeEnabled());
    expect(screen.queryByRole('textbox')).toBeNull();await user.click(screen.getByRole('button',{name:'Wait',exact:true}));await user.click(screen.getByRole('button',{name:'Save my choice: Wait'}));
    expect(service.choose).toHaveBeenCalledWith('decision',expect.any(String),0,{outcome:'wait',candidateId:null,briefId:null,note:''});
  });
  it('keeps a retry id after a lost response instead of issuing a new paid request',async()=>{
    const {service}=setup();vi.mocked(service.start).mockRejectedValueOnce(new Error('Connection lost'));const user=userEvent.setup();
    await waitFor(()=>expect(screen.getByRole('button',{name:'Help me decide'})).toBeEnabled());await user.click(screen.getByRole('button',{name:'Help me decide'}));await user.click(await screen.findByRole('button',{name:'Retry the same step'}));
    expect(vi.mocked(service.start).mock.calls[0]).toEqual(vi.mocked(service.start).mock.calls[1]);
  });
  it('preserves a choice draft and requires review after a stale revision',async()=>{
    const {service}=setup();vi.mocked(service.choose).mockRejectedValueOnce({code:'40001',message:'stale'});const user=userEvent.setup();
    await user.click(screen.getByRole('button',{name:'Don’t buy',exact:true}));await user.type(screen.getByRole('textbox'), 'I already have a working pair.');await user.click(screen.getByRole('button',{name:'Save my choice: Don’t buy'}));
    expect(await screen.findByRole('button',{name:'I’ve reviewed the latest decision'})).toBeEnabled();expect(screen.getByRole('textbox')).toHaveValue('I already have a working pair.');expect(screen.getByRole('button',{name:'Save my choice: Don’t buy'})).toBeDisabled();
    await user.click(screen.getByRole('button',{name:'I’ve reviewed the latest decision'}));expect(screen.getByRole('button',{name:'Save my choice: Don’t buy'})).toBeEnabled();
  });
  it('captures the revision when the user starts a choice draft',async()=>{
    const {service,props,rerender}=setup();const user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Wait',exact:true}));
    rerender(<DecisionBriefPanel {...props} decision={{...decision,revision:1,canonical_model:{...model,revision:1}}}/>);
    await user.click(screen.getByRole('button',{name:'Save my choice: Wait'}));expect(service.choose).toHaveBeenCalledWith('decision',expect.any(String),0,expect.objectContaining({outcome:'wait'}));
  });
  it('shows earlier versions as stale and does not attach them to a fresh choice',async()=>{
    const {service}=setup({basisHash:'new-basis',briefs:[brief]});const user=userEvent.setup();await screen.findByRole('article',{name:'Decision Brief version 1'});expect(screen.getByText(/This is an earlier picture/)).toBeInTheDocument();
    await user.click(screen.getByRole('button',{name:'Wait',exact:true}));await user.click(screen.getByRole('button',{name:'Save my choice: Wait'}));expect(service.choose).toHaveBeenCalledWith('decision',expect.any(String),0,expect.objectContaining({briefId:null}));
  });
  it('resumes pending work and offers cancellation without repeating generation',async()=>{
    const {service}=setup({jobs:[{id:'job',actionId:'action',revision:0,status:'running',errorCode:null}]});const user=userEvent.setup();await user.click(await screen.findByRole('button',{name:'Cancel this brief'}));expect(service.cancel).toHaveBeenCalledWith('job');expect(service.start).not.toHaveBeenCalled();
  });
});
