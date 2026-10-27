import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {QueryClient, QueryClientProvider, IsRestoringProvider} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {createServer} from 'vite';

const server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];
try {
  const {apiClient}=await server.ssrLoadModule('/src/apis/client.ts');
  const {useDashboard,dashboardQueryKey:key,dashboardSnapshot}=await server.ssrLoadModule('/src/features/dashboard/hooks/useDashboard.ts');
  const {default:Page}=await server.ssrLoadModule('/src/pages/dashboard/DashboardPage.tsx');
  const data={teams:Array.from({length:20},(_,i)=>({teamId:i+1,rank:i<2?1:i+1,serviceName:`실제 서비스 ${i+1}`,raisedAmount:i<2?700000:i===2?300000:0})),totalInvestedAmount:1700000,investedInvestorCount:3,snapshotVersion:1,asOf:'2026-10-27T00:05:06Z'};
  function client(value){const c=new QueryClient();clients.push(c);if(value)c.setQueryData(key,value);return c;}
  function wrap(c,element){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:true},element)));}
  function render(c){return wrap(c,React.createElement(Page));}
  function options(c){function Harness(){useDashboard();return null;}wrap(c,React.createElement(Harness));return c.getQueryCache().find({queryKey:key}).options;}
  const initial=dashboardSnapshot(data);
  assert.deepEqual(initial.changes,{});
  const next=dashboardSnapshot({...data,snapshotVersion:2,teams:data.teams.map(t=>t.teamId===3?{...t,raisedAmount:800000,rank:1}:{...t,rank:t.teamId<3?2:t.rank})},initial);
  assert.deepEqual(next.changes[3],{rankChange:2,amountIncrease:500000});
  assert.deepEqual(next.changes[1],{rankChange:-1,amountIncrease:0});
  assert.deepEqual(dashboardSnapshot({...data,snapshotVersion:2},next).changes,{});
  const c=client(initial),html=render(c);
  for(const text of ['실제 서비스 1','1,700,000원','3명','09:05:06','width:620px'])assert.ok(html.includes(text),text);
  assert.equal((html.match(/role="row"/g)||[]).length,21);
  assert.ok(!html.includes('데모 서비스'));
  const rankCells=[...html.matchAll(/role="cell" class="text-\[15px\][\s\S]*?<\/span><\/span>/g)].map(m=>m[0]);
  assert.ok(rankCells.length>=2);
  const pausedClient=client(initial);pausedClient.setQueryData(["public","investment-status"],{status:"PAUSED",revision:2,updatedAt:null});assert.ok(render(pausedClient).includes("투자가 일시중지되었어요"));pausedClient.setQueryData(["public","investment-status"],{status:"RUNNING",revision:3,updatedAt:null});assert.ok(!render(pausedClient).includes("투자가 일시중지되었어요"));
  const changedHtml=render(client(next));assert.ok(changedHtml.includes('+500,000원 갱신'));assert.ok(changedHtml.includes('▲ 2'));assert.ok(changedHtml.includes('▼ 1'));
  const zero=dashboardSnapshot({...data,teams:data.teams.map(t=>({...t,rank:1,raisedAmount:0})),totalInvestedAmount:0,investedInvestorCount:0});assert.ok(render(client(zero)).includes('width:0'));
  assert.ok(render(client()).includes('LoadingArc.png'));
  const error=new AxiosError('test',undefined,undefined,undefined,{status:500,headers:{},data:{}});
  const empty=client();options(empty);empty.getQueryCache().find({queryKey:key}).setState({status:'error',error,fetchStatus:'idle'});assert.ok(render(empty).includes('불러오지 못했어요'));
  c.getQueryCache().find({queryKey:key}).setState({status:'error',error,fetchStatus:'idle'});const background=render(c);assert.ok(background.includes('실제 서비스 1')&&background.includes('재연결 중')&&background.includes('09:05:06'));assert.ok(!background.includes('불러오지 못했어요'));
  const opts=options(c);assert.equal(opts.refetchInterval(c.getQueryCache().find({queryKey:key})),2000);assert.equal(opts.refetchIntervalInBackground,false);assert.equal(opts.retry,false);
  let calls=[];apiClient.defaults.adapter=async config=>{calls.push(config);return {data,status:200,headers:{},statusText:'OK',config};};
  await opts.queryFn({signal:new AbortController().signal});assert.equal(calls[0].url,'/public/dashboard');assert.equal(calls[0].timeout,15000);assert.ok(calls[0].signal);assert.equal(calls[0].headers['X-CSRF-Token'],undefined);
  for(const status of [429,503]){
    const limited=client(initial), opt=options(limited);let count=0;
    apiClient.defaults.adapter=async()=>{count++;throw new AxiosError('limited',undefined,undefined,undefined,{status,headers:{'retry-after':'10'},data:{}});};
    let failure;try{await opt.queryFn({signal:new AbortController().signal});}catch(e){failure=e;}
    limited.getQueryCache().find({queryKey:key}).setState({status:'error',error:failure,errorUpdatedAt:Date.now(),fetchStatus:'idle'});
    const deadline=failure.retryAt;
    await assert.rejects(opt.queryFn({signal:new AbortController().signal}));assert.equal(count,1);assert.equal(failure.retryAt,deadline);assert.ok(opt.refetchInterval(limited.getQueryCache().find({queryKey:key}))>9000);
  }
  console.log('Dashboard checks passed: real fields/KST, 20 rows, server ranks, zero bars, version changes, initial/background errors, GET options, polling and stable 429/503 cooldown. Browser/live-server verification remains pending.');
} finally {clients.forEach(c=>c.clear());await server.close();}
