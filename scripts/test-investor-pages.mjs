import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {QueryClient,QueryClientProvider,IsRestoringProvider} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {createServer} from 'vite';
// P02~P05의 모의 캐시 기반 화면 검증. 실제 투자·로그인·서버 상태 변경 없음.
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];
try {
 const {InvestmentFlowContext}=await server.ssrLoadModule('/src/features/investment/hooks/useCreateInvestment.ts');
 const pages={};for(const name of ['HomePage','TeamDetailPage','InvestmentSuccessPage','InvestmentHistoryPage'])pages[name]=(await server.ssrLoadModule(`/src/pages/investor/${name}.tsx`)).default;
 const status={status:'RUNNING',revision:1,updatedAt:null};
 const investor={investorId:'inv-page',alias:'테스트 투자자',kind:'PARTICIPANT',teamId:1,issuedAmount:1000000,investedAmount:100000,balance:900000,spendingStatus:'UNSPENT'};
 const teams=Array.from({length:20},(_,i)=>({teamId:i+1,serviceName:`서비스 ${i+1}`,description:`소개 ${i+1}`,investmentState:i===0?'SELF_TEAM':i===1?'ALREADY_INVESTED':'AVAILABLE',myInvestmentAmount:i===1?100000:0,allowedAmounts:i<2?[]:[100000,200000,300000,400000,500000,600000,700000]}));
 const investment={investmentId:'receipt-own',teamId:2,serviceName:'서비스 2',amount:100000,confirmedAt:'2026-10-28T00:03:00Z'};
 function client(){const c=new QueryClient();clients.push(c);c.setQueryData(['auth','investor','session'],{investor,csrfToken:'test-token'});c.setQueryData(['public','investment-status'],status);return c;}
 function render(c,name,path,route){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:true},React.createElement(MemoryRouter,{initialEntries:[path]},React.createElement(InvestmentFlowContext,{value:()=>{}},React.createElement(Routes,null,React.createElement(Route,{path:route,element:React.createElement(pages[name])})))))));}
 const home=client();home.setQueryData(['investor','teams',investor.investorId],{investor,teams,investmentStatus:status,asOf:'2026-10-28T00:03:00Z'});const h=render(home,'HomePage','/invest','/invest');
 for(const text of ['900,000','100,000','TEAM 01, 내 팀, 선택 불가','TEAM 02, 투자 완료 100,000원, 선택 불가','border-dashed','border-solid'])assert.ok(h.includes(text),text);assert.equal((h.match(/href="\/invest\/teams\//g)||[]).length,18);
 const staff=client();staff.setQueryData(['investor','teams',investor.investorId],{investor:{...investor,kind:'STAFF',teamId:null},teams:teams.map(t=>t.teamId===1?{...t,investmentState:'AVAILABLE',allowedAmounts:[100000]}:t),investmentStatus:status});const staffHtml=render(staff,'HomePage','/invest','/invest');assert.equal((staffHtml.match(/href="\/invest\/teams\//g)||[]).length,19);assert.ok(staffHtml.includes('운영팀'));assert.ok(!staffHtml.includes('내 팀, 선택 불가'));
 for(const [balance,allowed,investmentState,paused,disabled] of [[900000,[100000,200000,300000,400000,500000,600000,700000],'AVAILABLE',false,1],[300000,[100000,200000,300000],'AVAILABLE',false,5],[0,[],'BALANCE_EXHAUSTED',false,8],[900000,[100000,200000,300000,400000,500000,600000,700000],'AVAILABLE',true,8]]){
  const c=client(),s={...status,status:paused?'PAUSED':'RUNNING'};c.setQueryData(['public','investment-status'],s);c.setQueryData(['investor','team',investor.investorId,3],{investor:{...investor,balance,investedAmount:1000000-balance},team:{...teams[2],allowedAmounts:allowed,investmentState},investmentStatus:s,asOf:'2026-10-28T00:03:00Z'});const html=render(c,'TeamDetailPage','/invest/teams/3','/invest/teams/:teamId');assert.equal((html.match(/aria-pressed="false"/g)||[]).length,7);assert.equal((html.match(/disabled=""/g)||[]).length,disabled);assert.ok(html.includes('소개 3'));if(balance===0)assert.ok(html.includes('투자 잔액이 부족해요'));
 }
 const success=client(),receiptKey=['investor','investment',investor.investorId,investment.investmentId];success.setQueryData(receiptKey,{investment,currentBalance:900000,asOf:'2026-10-28T00:03:00Z'});const receipt=render(success,'InvestmentSuccessPage','/invest/success/receipt-own','/invest/success/:investmentId');for(const text of ['투자 완료!','100,000','900,000','서비스 2','10.28 09:03'])assert.ok(receipt.includes(text),text);
 success.getQueryCache().find({queryKey:receiptKey}).setState({status:'error',error:new AxiosError('missing',undefined,undefined,undefined,{status:404,data:{error:{code:'RESOURCE_NOT_FOUND'}},headers:{}}),fetchStatus:'idle'});const missing=render(success,'InvestmentSuccessPage','/invest/success/receipt-own','/invest/success/:investmentId');assert.ok(missing.includes('지금은 접근할 수 없어요'));assert.ok(!missing.includes('서비스 2'));assert.ok(missing.includes('부스 목록으로 돌아가기'));
 const history=client();history.setQueryData(['investor','investments',investor.investorId],{investor,items:[investment],count:1,asOf:'2026-10-28T00:03:00Z'});const historyHtml=render(history,'InvestmentHistoryPage','/invest/history','/invest/history');for(const text of ['1건','900,000','100,000','서비스 2'])assert.ok(historyHtml.includes(text),text);
 history.setQueryData(['investor','investments',investor.investorId],{investor:{...investor,investedAmount:0,balance:1000000},items:[],count:0,asOf:'2026-10-28T00:03:00Z'});assert.ok(render(history,'InvestmentHistoryPage','/invest/history','/invest/history').includes('아직 투자 내역이 없어요'));
 console.log('Investor page checks passed: P02 self/invested/staff, P03 amounts/balance/paused states, P04 receipt/KST/404, P05 totals/empty. Mock data only; live investment confirmation is separate.');
} finally {clients.forEach(c=>c.clear());await server.close();}
