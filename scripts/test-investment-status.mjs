import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {QueryClient,QueryClientProvider,IsRestoringProvider} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];
try {
 const {apiClient}=await server.ssrLoadModule('/src/apis/client.ts');
 const {useInvestmentStatus,investmentStatusQueryKey:key,latestInvestmentStatus}=await server.ssrLoadModule('/src/features/dashboard/hooks/useInvestmentStatus.ts');
 const {default:TeamPage}=await server.ssrLoadModule('/src/pages/investor/TeamDetailPage.tsx');
 const {default:Home}=await server.ssrLoadModule('/src/pages/investor/HomePage.tsx');
 const {InvestmentFlowContext}=await server.ssrLoadModule('/src/features/investment/hooks/useCreateInvestment.ts');
 const running={status:'RUNNING',revision:1,updatedAt:null},paused={status:'PAUSED',revision:2,updatedAt:'2026-10-27T00:00:00Z'};
 const sessionKey=['auth','investor','session'];
 const session={investor:{investorId:'inv-1',alias:'이름',kind:'PARTICIPANT',teamId:1,issuedAmount:1000000,investedAmount:0,balance:1000000,spendingStatus:'UNSPENT'},csrfToken:'token'};
 const team={teamId:2,serviceName:'서비스',description:'소개 내용',investmentState:'AVAILABLE',myInvestmentAmount:0,allowedAmounts:[100000,200000,300000,400000,500000,600000,700000]};
 function client(status=running){const c=new QueryClient();clients.push(c);c.setQueryData(sessionKey,session);if(status)c.setQueryData(key,status);c.setQueryData(['investor','team','inv-1',2],{investor:session.investor,team,investmentStatus:running,asOf:'2026-10-27T00:00:00Z'});c.setQueryData(['investor','teams','inv-1'],{investor:session.investor,teams:[team],investmentStatus:running,asOf:'2026-10-27T00:00:00Z'});return c;}
 function wrap(c,element,path='/invest/teams/2'){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:true},React.createElement(MemoryRouter,{initialEntries:[path]},element))));}
 function teamHtml(c){return wrap(c,React.createElement(InvestmentFlowContext,{value:()=>{}},React.createElement(Routes,null,React.createElement(Route,{path:'/invest/teams/:teamId',element:React.createElement(TeamPage)}))));}
 function capture(c){function Harness(){useInvestmentStatus();return null;}wrap(c,React.createElement(Harness));return c.getQueryCache().find({queryKey:key}).options;}
 assert.equal(latestInvestmentStatus(paused,running),paused);assert.equal(latestInvestmentStatus(running,paused),paused);
 const p=client(paused);assert.ok(teamHtml(p).includes('소개 내용'));assert.equal((teamHtml(p).match(/disabled=""/g)||[]).length,8);
 assert.equal((teamHtml(client(running)).match(/disabled=""/g)||[]).length,1);
 const home=wrap(p,React.createElement(Home),'/invest');assert.ok(home.includes('일시정지되어 있어요'));
 const failed=client(running);capture(failed);failed.getQueryCache().find({queryKey:key}).setState({status:'error',error:new Error('offline'),fetchStatus:'idle'});const failedHtml=teamHtml(failed);assert.ok(failedHtml.includes('접수 상태를 확인하지 못했어요'));assert.equal((failedHtml.match(/disabled=""/g)||[]).length,8);
 let calls=[];apiClient.defaults.adapter=async config=>{calls.push(config);return {data:paused,status:200,statusText:'OK',headers:{},config};};
 const c=client(),opts=capture(c);assert.deepEqual(await opts.queryFn({signal:new AbortController().signal}),paused);assert.equal(calls[0].url,'/public/investment-status');assert.equal(calls[0].timeout,15000);assert.equal(calls[0].headers['X-CSRF-Token'],undefined);assert.ok(calls[0].signal);assert.equal(opts.refetchIntervalInBackground,false);assert.equal(opts.refetchInterval(c.getQueryCache().find({queryKey:key})),2000);
 for(const status of [429,503]){let count=0;const q=client(),o=capture(q);apiClient.defaults.adapter=async()=>{count++;throw new AxiosError('limited',undefined,undefined,undefined,{status,headers:{'retry-after':'10'},data:{}});};let err;try{await o.queryFn({signal:new AbortController().signal});}catch(e){err=e;}q.getQueryCache().find({queryKey:key}).setState({status:'error',error:err,fetchStatus:'idle'});const deadline=err.retryAt;await assert.rejects(o.queryFn({signal:new AbortController().signal}));assert.equal(count,1);assert.equal(err.retryAt,deadline);}
 console.log('Investment status checks passed: revision precedence, P02 pause, P03 pause/resume/error guards, shared public GET/signal/timeout, polling and stable 429/503 cooldown. Browser effects and live-server checks remain pending.');
} finally {clients.forEach(c=>c.clear());await server.close();}
