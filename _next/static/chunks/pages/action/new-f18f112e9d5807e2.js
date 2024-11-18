(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3594],{84455:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/action/new",function(){return r(5854)}])},91529:function(e,t,r){"use strict";r.d(t,{LH:function(){return i},Vu:function(){return s},bM:function(){return o},vz:function(){return l}});var n=r(21803),a=r(15229);let s=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",i=e=>{let t=o(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},l=e=>{let t=parseInt("18",10);return(0,n.v)(e,t)},o=e=>{let t=parseInt("18",10);return(0,a.b)(e,t)}},5854:function(e,t,r){"use strict";r.r(t);var n=r(85893),a=r(67294),s=r(11163),i=r(94782),l=r(93778),o=r(91529),c=r(35337);t.default=()=>{let e=(0,s.useRouter)(),{submitNewAction:t,isWriting:r,isConfirming:u,isConfirmed:d,writeError:m,writeData:x}=(0,i.Xo)(),{token:b}=(0,a.useContext)(l.M)||{},[f,h]=(0,a.useState)({actionName:"",consensus:"",verificationRule:"",verificationInfoGuide:"",rewardAddressCount:"",maxStake:"",whiteList:""}),g=e=>{h({...f,[e.target.name]:e.target.value})},p=async()=>{let e={maxStake:f.maxStake?(0,o.vz)(f.maxStake):0n,maxRandomAccounts:f.rewardAddressCount?BigInt(f.rewardAddressCount):0n,whiteList:f.whiteList?f.whiteList.split(",").map(e=>e.trim()):[],action:f.actionName,consensus:f.consensus,verificationRule:f.verificationRule,verificationInfoGuide:f.verificationInfoGuide};await t(null==b?void 0:b.address,e)};return(0,a.useEffect)(()=>{d&&e.push("/vote/actions4submit")},[d,x]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(c.Z,{title:"创建新行动"}),(0,n.jsxs)("div",{className:"max-w-xl mx-auto bg-base-100 p-4",children:[(0,n.jsx)("h1",{className:"text-2xl font-bold mb-4",children:"创建新行动"}),(0,n.jsxs)("div",{className:"space-y-4",children:[(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"行动名称：一句话说明"}),(0,n.jsx)("input",{type:"text",name:"actionName",value:f.actionName,onChange:g,className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"行动共识"}),(0,n.jsx)("input",{type:"text",name:"consensus",value:f.consensus,onChange:g,className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"验证规则"}),(0,n.jsx)("textarea",{name:"verificationRule",value:f.verificationRule,onChange:g,className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"验证提示"}),(0,n.jsx)("input",{type:"text",name:"verificationInfoGuide",value:f.verificationInfoGuide,onChange:g,className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"奖励地址数"}),(0,n.jsx)("input",{type:"number",name:"rewardAddressCount",value:f.rewardAddressCount,onChange:g,className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"最大质押"}),(0,n.jsx)("input",{type:"number",name:"maxStake",value:f.maxStake,onChange:g,placeholder:"0 或不填表示不限",className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"白名单"}),(0,n.jsx)("input",{type:"text",name:"whiteList",value:f.whiteList,onChange:g,placeholder:"不填为不限，或多个地址用逗号分隔",className:"mt-1 block w-full border border-gray-300 rounded-md p-2"})]}),(0,n.jsx)("button",{onClick:p,disabled:r||u,className:"mt-4 w-full py-2 px-4 rounded-md ".concat(r||u?"bg-gray-400 cursor-not-allowed":"bg-blue-500 hover:bg-blue-600"," text-white"),children:r||u?"提交中...":"提交"}),(0,n.jsx)("p",{className:"text-gray-500 text-sm",children:"发起后，会自动推举该行动到当前投票轮的行动列表 / 本轮已推举或提交过"})]}),m&&(0,n.jsx)("div",{className:"text-red-500 text-center",children:m.message})]})]})}},11163:function(e,t,r){e.exports=r(43079)},21803:function(e,t,r){"use strict";function n(e,t){let[r,n="0"]=e.split("."),a=r.startsWith("-");if(a&&(r=r.slice(1)),n=n.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${n}`))&&(r=`${BigInt(r)+1n}`),n="";else if(n.length>t){let[e,a,s]=[n.slice(0,t-1),n.slice(t-1,t),n.slice(t)],i=Math.round(Number(`${a}.${s}`));(n=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>t&&(n=n.slice(1),r=`${BigInt(r)+1n}`),n=n.slice(0,t)}else n=n.padEnd(t,"0");return BigInt(`${a?"-":""}${r}${n}`)}r.d(t,{v:function(){return n}})},89810:function(e,t,r){"use strict";r.d(t,{u:function(){return o}});var n=r(37003),a=r(36100),s=r(82451),i=r(82002),l=r(37122);function o(e={}){let{abi:t,address:r,functionName:o,query:c={}}=e,u=e.code,d=(0,l.Z)(e),m=(0,i.x)({config:d}),x=function(e,t={}){return{async queryFn({queryKey:r}){let a=t.abi;if(!a)throw Error("abi is required");let{functionName:s,scopeKey:i,...l}=r[1],o=(()=>{let e=r[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!s)throw Error("functionName is required");return(0,n.L)(e,{abi:a,functionName:s,args:l.args,...o,...l})},queryKey:function(e={}){let{abi:t,...r}=e;return["readContract",(0,a.OP)(r)]}(t)}}(d,{...e,chainId:e.chainId??m}),b=!!((r||u)&&t&&o&&(c.enabled??!0));return(0,s.aM)({...c,...x,enabled:b,structuralSharing:c.structuralSharing??a.if})}}},function(e){e.O(0,[9215,6789,2888,9774,179],function(){return e(e.s=84455)}),_N_E=e.O()}]);