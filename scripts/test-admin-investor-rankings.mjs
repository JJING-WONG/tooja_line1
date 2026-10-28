import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route,Outlet} from 'react-router-dom';
import {QueryClient,QueryClientProvider,IsRestoringProvider,QueryObserver} from '@tanstack/react-query';
import {AxiosError,CanceledError} from 'axios';
import {createServer} from 'vite';

// #23 모의 응답·쿼리 상태 검증. 실제 서버 로그인·접수 상태 변경은 수행하지 않습니다.
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];
try {
 const {apiClient}=await server.ssrLoadModule('/src/apis/client.ts');
 const {getAdminInvestorRankings}=await server.ssrLoadModule('/src/features/admin/apis/admin.api.ts');
 const {useAdminInvestorRankings,adminInvestorRankingsQueryKey:key}=await server.ssrLoadModule('/src/features/admin/hooks/useAdminInvestorRankings.ts');
 const {default:Page}=await server.ssrLoadModule('/src/pages/admin/InvestorPerformancePage.tsx');
 const sessionKey=['auth','admin','session'],adminId='admin-1';
 const session={admin:{adminId,role:'ADMIN'},csrfToken:'admin-token'};
 const contribution={teamId:2,serviceName:'서버 서비스',teamRank:1,investedAmount:200000,pointsPerUnit:10,score:20};
 const base={investorId:'inv-1',alias:'서버 참가자',kind:'PARTICIPANT',teamId:1,rank:1,score:20,contributions:[contribution]};
 const data={group:'ALL',asOf:'2026-10-28T00:05:06Z',snapshotVersion:3,count:4,items:[base,{...base,investorId:'inv-2',alias:'서버 운영팀',kind:'STAFF',teamId:null,contributions:[{...contribution,teamRank:9,investedAmount:500000,pointsPerUnit:2,score:10},{...contribution,teamId:3,teamRank:9,investedAmount:500000,pointsPerUnit:2,score:10}]},{...base,investorId:'inv-3',alias:'음수 참가자',rank:3,score:-5,contributions:[{...contribution,teamId:20,teamRank:15,investedAmount:100000,pointsPerUnit:-5,score:-5}]},{...base,investorId:'inv-4',alias:'미투자 참가자',rank:null,score:0,contributions:[]}]};
 function client(value=data,group='ALL'){const c=new QueryClient();clients.push(c);c.setQueryData(sessionKey,session);c.setQueryData(['auth','investor','session'],{keep:true});if(value)c.setQueryData(key(adminId,group),value);return c;}
 function wrap(c,element,group='ALL',restoring=true){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:restoring},React.createElement(MemoryRouter,{initialEntries:[`/admin/performance?group=${group}`]},element))));}
 function render(c,group='ALL',restoring=true){return wrap(c,React.createElement(Routes,null,React.createElement(Route,{element:React.createElement(Outlet,{context:{}})},React.createElement(Route,{path:'/admin/performance',element:React.createElement(Page)}))),group,restoring);}
 function capture(c,group='ALL'){function Harness(){useAdminInvestorRankings(group);return null;}wrap(c,React.createElement(Harness),group);return c.getQueryCache().find({queryKey:key(c.getQueryData(sessionKey)?.admin?.adminId,group)}).options;}
 const failure=(status,code,headers={})=>new AxiosError('test',undefined,undefined,undefined,{status,data:code?{error:{code}}:'<html>Blocked</html>',headers});
 let calls=[];apiClient.defaults.adapter=async config=>{calls.push(config);return {data,status:200,statusText:'OK',headers:{},config};};
 for(const group of ['ALL','PARTICIPANT','STAFF']){await getAdminInvestorRankings(group,new AbortController().signal);const config=calls.at(-1);assert.equal(config.url,'/admin/investor-rankings');assert.equal(config.method,'get');assert.equal(config.timeout,15000);assert.ok(config.signal);assert.equal(config.headers['X-CSRF-Token'],undefined);assert.deepEqual(config.params,group==='ALL'?undefined:{group});}
 const c=client(),html=render(c);
 for(const text of ['서버 참가자','서버 운영팀','음수 참가자','미투자 참가자','09:05:06','+20','−5','미투자자 제외','진행 중','전부 소진','미소진'])assert.ok(html.includes(text),text);
 assert.equal((html.match(/<tbody[\s\S]*?<\/tbody>/)[0].match(/<tr/g)||[]).length,4);
 assert.equal((html.match(/1<span class="sr-only">위/g)||[]).length,2);assert.ok(html.includes('3<span class="sr-only">위'));assert.ok(html.includes('순위 없음'));
 const zero=client({...data,items:[{...base,score:0,contributions:[contribution,{...contribution,teamId:20,teamRank:20,pointsPerUnit:-10,score:-20}]}],count:1});assert.ok(render(zero).includes('0<small'));
 assert.ok(render(client({...data,items:[],count:0})).includes('이 그룹에는 투자자가 없어요'));
 const loading=client(null);capture(loading);loading.getQueryCache().find({queryKey:key(adminId,'ALL')}).setState({fetchStatus:'fetching'});assert.ok(render(loading,'ALL',false).includes('목록을 불러오는 중'));
 const staff=render(c,'STAFF');assert.ok(!staff.includes('서버 참가자'));assert.ok(staff.includes('—'));assert.equal(c.getQueryData(key(adminId,'STAFF')),undefined);
 for(const hasData of [true,false]){const q=client(hasData?data:null);capture(q);q.getQueryCache().find({queryKey:key(adminId,'ALL')}).setState({status:'error',error:failure(403),fetchStatus:'idle'});const h=render(q);assert.ok(h.includes('접속 환경을 확인'));assert.equal(h.includes('서버 참가자'),hasData);assert.deepEqual(q.getQueryData(sessionKey),session);}
 const options=capture(c);assert.equal(options.refetchInterval(),5000);assert.equal(options.refetchIntervalInBackground,false);assert.equal(options.refetchOnWindowFocus,true);assert.equal(options.refetchOnReconnect,true);assert.equal(options.retry,false);assert.equal(options.placeholderData,undefined);
 for(const [status,code,cleared] of [[401,'SESSION_EXPIRED',true],[403,'FORBIDDEN',true],[403,undefined,false],[500,'INTERNAL_ERROR',false]]){const q=client(),o=capture(q);apiClient.defaults.adapter=async()=>{throw failure(status,code);};await assert.rejects(o.queryFn({signal:new AbortController().signal}));assert.equal(q.getQueryData(sessionKey)===null,cleared);assert.deepEqual(q.getQueryData(['auth','investor','session']),{keep:true});}
 const anon=client();anon.setQueryData(sessionKey,null);let forbiddenCalls=0;apiClient.defaults.adapter=async()=>{forbiddenCalls++;throw Error('must not send');};const anonOptions=capture(anon);assert.equal(anonOptions.enabled,false);await assert.rejects(anonOptions.queryFn({signal:new AbortController().signal}));assert.equal(forbiddenCalls,0);
 for(const mutationKey of [['auth','admin','logout'],['admin','investment-status']]){const q=client();const mutation=q.getMutationCache().build(q,{mutationKey,mutationFn:()=>new Promise(()=>{})});void mutation.execute();const o=capture(q);assert.equal(o.enabled,false);assert.equal(o.refetchInterval(),false);await assert.rejects(o.queryFn({signal:new AbortController().signal}));assert.equal(forbiddenCalls,0);}
 for(const status of [429,503]){const q=client(),o=capture(q);let count=0;apiClient.defaults.adapter=async()=>{count++;throw failure(status,status===429?'RATE_LIMITED':'SERVICE_UNAVAILABLE',{'retry-after':'10'});};await assert.rejects(o.queryFn({signal:new AbortController().signal}));assert.ok(o.refetchInterval()>9000);await assert.rejects(o.queryFn({signal:new AbortController().signal}));assert.equal(count,1);}
 const changed=client(),changedOptions=capture(changed);changed.setQueryData(sessionKey,{...session,admin:{adminId:'admin-2'}});await assert.rejects(changedOptions.queryFn({signal:new AbortController().signal}),/로그인 상태/);
 const racing=client(null),oldOptions=capture(racing,'PARTICIPANT'),newOptions=capture(racing,'STAFF');let aborted=false;
 apiClient.defaults.adapter=config=>config.params?.group==='PARTICIPANT'?new Promise((_resolve,reject)=>{config.signal.addEventListener('abort',()=>{aborted=true;reject(new CanceledError());},{once:true});}):Promise.resolve({data:{...data,group:'STAFF',items:[data.items[1]],count:1},status:200,statusText:'OK',headers:{},config});
 const observer=new QueryObserver(racing,oldOptions);const off=observer.subscribe(()=>{});await Promise.resolve();observer.setOptions(newOptions);const fresh=await racing.fetchQuery(newOptions);assert.equal(aborted,true);assert.equal(fresh.group,'STAFF');assert.equal(observer.getCurrentResult().data.items[0].kind,'STAFF');off();
 console.log('Admin rankings checks passed: group params, real fields/KST/ranks/scores/badges, empty/loading/background errors, 5s polling, session/role isolation, mutation guards, 429/503 cooldown and group-change cancellation. Browser interactions are verified separately.');
} finally {clients.forEach(c=>c.clear());await server.close();}
