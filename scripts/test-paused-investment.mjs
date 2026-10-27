import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider,IsRestoringProvider} from '@tanstack/react-query';
import {AxiosError} from 'axios';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];const memory=new Map();const oldStorage=globalThis.sessionStorage;
globalThis.sessionStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
try {
 const {apiClient}=await server.ssrLoadModule('/src/apis/client.ts');
 const {useCreateInvestment}=await server.ssrLoadModule('/src/features/investment/hooks/useCreateInvestment.ts');
 const {default:Provider}=await server.ssrLoadModule('/src/features/investment/components/InvestmentFlowProvider.tsx');
 const {savePendingInvestment,readPendingInvestment}=await server.ssrLoadModule('/src/features/investment/utils/investmentRequest.ts');
 const request={investorId:'inv',requestKey:'12345678-1234-4123-8123-123456789abc',input:{teamId:5,amount:500000},waitingForResume:true};
 const receipt={investment:{investmentId:'receipt',teamId:5,amount:500000,confirmedAt:'2026-10-27T00:00:00Z'},balanceAfterInvestment:500000,snapshotVersion:1};
 const key=['public','investment-status'];
 function client(status){const c=new QueryClient();clients.push(c);c.setQueryData(['auth','investor','session'],{investor:{investorId:'inv'},csrfToken:'token'});c.setQueryData(key,{status,revision:2,updatedAt:null});return c;}
 function render(c,element){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:true},React.createElement(MemoryRouter,null,element))));}
 function flow(c){let captured;function Harness(){captured=useCreateInvestment('inv');return null;}render(c,React.createElement(Harness));return captured;}
 function settle(c,action){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{off();reject(Error('timeout'));},3000);const off=c.getMutationCache().subscribe(e=>{if(e.mutation&&['success','error'].includes(e.mutation.state.status)){clearTimeout(timer);off();resolve();}});action();});}
 let calls=[];let steps=[];apiClient.defaults.adapter=async config=>{calls.push(config);const step=steps.shift();assert.ok(step,'unexpected request');assert.equal(config.method,step.method);if(step.error)throw step.error;return {data:step.data,status:200,statusText:'OK',headers:{},config};};
 const error=(status,code)=>new AxiosError('test',undefined,undefined,undefined,{status,data:{error:{code}},headers:{}});
 savePendingInvestment(request);
 const paused=client('PAUSED'),waiting=flow(paused);assert.equal(waiting.view.status,'paused');waiting.resume();assert.equal(calls.length,0);assert.deepEqual(readPendingInvestment('inv'),request);
 const pausedHtml=render(paused,React.createElement(Provider,{investorId:'inv'},'소개'));assert.ok(pausedHtml.includes('재개 대기 중'));assert.ok(pausedHtml.includes('disabled=""'));
 const running=client('RUNNING'),retry=flow(running);assert.equal(calls.length,0);const resumedHtml=render(running,React.createElement(Provider,{investorId:'inv'},'소개'));assert.ok(resumedHtml.includes('투자 재시도'));assert.ok(!resumedHtml.includes('disabled=""'));
 steps=[{method:'get',error:error(404,'REQUEST_RESULT_NOT_FOUND')},{method:'post',error:error(409,'INVESTMENT_PAUSED')}];await settle(running,()=>{retry.resume();retry.resume();});assert.equal(calls.length,2);assert.equal(readPendingInvestment('inv').waitingForResume,true);assert.equal(calls[1].headers['Idempotency-Key'],request.requestKey);
 const reload=client('RUNNING'),restored=flow(reload);assert.equal(restored.view.status,'paused');assert.equal(calls.length,2);
 steps=[{method:'get',error:error(404,'REQUEST_RESULT_NOT_FOUND')},{method:'post',data:receipt}];await settle(reload,restored.resume);assert.equal(calls.length,4);assert.equal(calls[3].headers['Idempotency-Key'],request.requestKey);assert.deepEqual(JSON.parse(calls[3].data),request.input);assert.equal(readPendingInvestment('inv'),null);
 savePendingInvestment(request);const rejected=client('RUNNING');steps=[{method:'get',data:{status:'REJECTED',error:{code:'INSUFFICIENT_BALANCE'}}}];await settle(rejected,flow(rejected).resume);assert.equal(readPendingInvestment('inv'),null);
 console.log('Paused investment checks passed: retained key/body, restored pause state, no requests on pause/render/resume detection, disabled/enabled UI, duplicate-submit lock, repeated pause persistence, manual same-key recovery and final cleanup. Browser lifecycle verification remains pending.');
} finally {clients.forEach(c=>c.clear());globalThis.sessionStorage=oldStorage;await server.close();}
