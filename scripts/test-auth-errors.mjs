import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider,IsRestoringProvider} from '@tanstack/react-query';
import {AxiosError,CanceledError} from 'axios';
import {createServer} from 'vite';
const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
const clients=[];
try {
 const {apiClient}=await server.ssrLoadModule('/src/apis/client.ts');
 const {isSessionAuthError,accessBlockedMessage,apiErrorCode}=await server.ssrLoadModule('/src/features/auth/utils/authError.ts');
 const {handleAdminRequestError}=await server.ssrLoadModule('/src/features/admin/utils/adminRequest.ts');
 const failure=(status,code)=>new AxiosError('test',undefined,undefined,undefined,{status,headers:{},data:code===undefined?'<html>Blocked</html>':{error:{code}}});
 const authErrors=[failure(401,'SESSION_EXPIRED'),failure(403,'FORBIDDEN')];
 const otherErrors=[failure(403),failure(403,'IP_BLOCKED'),failure(403,'CSRF_INVALID'),failure(403,'SELF_INVESTMENT_FORBIDDEN'),failure(401),failure(401,'AUTHENTICATION_FAILED'),failure(500,'SESSION_EXPIRED'),new AxiosError('offline'),new CanceledError()];
 authErrors.forEach(e=>assert.equal(isSessionAuthError(e),true));otherErrors.forEach(e=>assert.equal(isSessionAuthError(e),false));
assert.ok(accessBlockedMessage(otherErrors[0]).includes('접속 환경'));assert.equal(accessBlockedMessage(otherErrors[2]),undefined);assert.equal(apiErrorCode(failure(403,42)),undefined);
 const investorKey=['auth','investor','session'],adminKey=['auth','admin','session'];
 const investor={investor:{investorId:'inv-1'},csrfToken:'i-token'},admin={admin:{adminId:'admin-1'},csrfToken:'a-token'};
 function client(){const c=new QueryClient();clients.push(c);c.setQueryData(investorKey,investor);c.setQueryData(adminKey,admin);return c;}
 function wrap(c,element){return renderToStaticMarkup(React.createElement(QueryClientProvider,{client:c},React.createElement(IsRestoringProvider,{value:true},React.createElement(MemoryRouter,null,element))));}
 function capture(c,hook,arg,key){function Harness(){hook(arg);return null;}wrap(c,React.createElement(Harness));return c.getQueryCache().find({queryKey:key}).options.queryFn;}
 const sessionHooks=[];
 for(const [role,key] of [['Investor',investorKey],['Admin',adminKey]]){const mod=await server.ssrLoadModule(`/src/features/auth/hooks/use${role}Session.ts`);sessionHooks.push({hook:mod[`use${role}Session`],key});}
 for(const {hook,key} of sessionHooks){
  for(const error of [...authErrors,...otherErrors]){const c=client(),fn=capture(c,hook,undefined,key);apiClient.defaults.adapter=async()=>{throw error;};if(isSessionAuthError(error))assert.equal(await fn({signal:new AbortController().signal}),null);else await assert.rejects(fn({signal:new AbortController().signal}));assert.ok(c.getQueryData(key));}
  const c=client(),fn=capture(c,hook,undefined,key),latest={...c.getQueryData(key),csrfToken:'new-session'};apiClient.defaults.adapter=async()=>{c.setQueryData(key,latest);throw authErrors[0];};assert.deepEqual(await fn({signal:new AbortController().signal}),latest);
  const canceled=client(),cancelFn=capture(canceled,hook,undefined,key),controller=new AbortController();controller.abort();apiClient.defaults.adapter=async()=>{throw authErrors[0];};await assert.rejects(cancelFn({signal:controller.signal}));assert.ok(canceled.getQueryData(key));
 }
 const reads=[
  ['/src/features/investor/hooks/useInvestorTeams.ts','useInvestorTeams',undefined,['investor','teams','inv-1']],
  ['/src/features/investor/hooks/useInvestorTeam.ts','useInvestorTeam',2,['investor','team','inv-1',2]],
  ['/src/features/investment/hooks/useMyInvestments.ts','useMyInvestments',undefined,['investor','investments','inv-1']],
  ['/src/features/investment/hooks/useMyInvestment.ts','useMyInvestment','trade',['investor','investment','inv-1','trade']],
 ];
 for(const [path,name,arg,key] of reads){const mod=await server.ssrLoadModule(path);
  for(const error of [...authErrors,...otherErrors]){const c=client(),fn=capture(c,mod[name],arg,key);apiClient.defaults.adapter=async()=>{throw error;};await assert.rejects(fn({signal:new AbortController().signal}));assert.equal(c.getQueryData(investorKey)===null,isSessionAuthError(error));assert.deepEqual(c.getQueryData(adminKey),admin);}
  for(const canceled of [false,true]){const c=client(),fn=capture(c,mod[name],arg,key),controller=new AbortController(),latest={...investor,investor:{investorId:'inv-2'}};apiClient.defaults.adapter=async()=>{if(canceled)controller.abort();else c.setQueryData(investorKey,latest);throw authErrors[0];};await assert.rejects(fn({signal:controller.signal}));assert.ok(c.getQueryData(investorKey));if(!canceled)assert.deepEqual(c.getQueryData(investorKey),latest);}
 }
 for(const error of [...authErrors,...otherErrors]){const c=client();await handleAdminRequestError(c,'admin-1',error,c.getQueryData(adminKey));assert.equal(c.getQueryData(adminKey)===null,isSessionAuthError(error));assert.deepEqual(c.getQueryData(investorKey),investor);}
 const late=client(),old=late.getQueryData(adminKey);late.setQueryData(adminKey,{...admin,csrfToken:'new-session'});await handleAdminRequestError(late,'admin-1',authErrors[1],old);assert.equal(late.getQueryData(adminKey).csrfToken,'new-session');
 const canceledAdmin=client(),controller=new AbortController();controller.abort();await handleAdminRequestError(canceledAdmin,'admin-1',authErrors[0],canceledAdmin.getQueryData(adminKey),controller.signal);assert.ok(canceledAdmin.getQueryData(adminKey));
 for(const [role,key] of [['Investor',investorKey],['Admin',adminKey]]){const {default:Guard}=await server.ssrLoadModule(`/src/features/auth/components/${role}ProtectedRoute.tsx`);const c=client();c.getQueryCache().find({queryKey:key}).setState({status:'error',error:failure(403),fetchStatus:'idle'});const html=wrap(c,React.createElement(Guard));assert.ok(html.includes('접속 환경을 확인'));assert.ok(c.getQueryData(key));assert.ok(html.includes(role==='Admin'?'재시도':'다시 시도'));}
 console.log('Auth error checks passed: strict status/code matching, HTML/unknown 403, CSRF/business errors, all role/session/investor reads, cancellation, late-response isolation and existing guard retry UI. Browser/server verification remains pending.');
} finally {clients.forEach(c=>c.clear());await server.close();}
