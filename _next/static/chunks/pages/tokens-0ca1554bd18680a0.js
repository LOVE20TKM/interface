(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3064],{37985:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tokens",function(){return n(92622)}])},34680:function(e,t,n){"use strict";n.d(t,{Ol:function(){return i},SZ:function(){return o},Zb:function(){return s},aY:function(){return l},eW:function(){return d},ll:function(){return u}});var r=n(85893),a=n(67294),c=n(40108);let s=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",n),...a})});s.displayName="Card";let i=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("flex flex-col space-y-1.5 p-6",n),...a})});i.displayName="CardHeader";let u=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-2xl font-semibold leading-none tracking-tight",n),...a})});u.displayName="CardTitle";let o=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-sm text-muted-foreground",n),...a})});o.displayName="CardDescription";let l=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("p-6 pt-0",n),...a})});l.displayName="CardContent";let d=a.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("flex items-center p-6 pt-0",n),...a})});d.displayName="CardFooter"},92622:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return w}});var r=n(85893),a=n(58732),c=n(67294),s=n(27245);let i=(0,n(31134).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);var u=n(34680),o=n(86501),l=n(11163),d=n(45551),f=n(70019),m=n(93778),h=n(42083);function p(){let e=(0,l.useRouter)(),{setToken:t}=(0,c.useContext)(m.M)||{},[n,a]=(0,c.useState)(0n),[p,w]=(0,c.useState)(BigInt(10)),[x,y]=(0,c.useState)([]);(0,c.useEffect)(()=>{y([]),a(0n),w(BigInt(10))},[]);let{tokens:v,isPending:g,error:N}=(0,f.N4)(n,p,!0),{tokens:b,launchInfos:j,isPending:R,error:T}=(0,d.OJ)(v||[]);(0,c.useEffect)(()=>{if(v&&b&&j){let e=b.map((e,t)=>({name:e.name,symbol:e.symbol,address:v[t],decimals:Number(e.decimals),parentTokenAddress:j[t].parentTokenAddress,parentTokenSymbol:e.parentTokenSymbol,slTokenAddress:e.slAddress,stTokenAddress:e.stAddress,hasEnded:j[t].hasEnded}));y(t=>{let n=new Set(t.map(e=>e.symbol));return[...t,...e.filter(e=>!n.has(e.symbol))]})}},[b,j]);let C=(0,c.useCallback)(()=>{!g&&b&&b.length>0&&(a(p),w(p+BigInt(10)))},[g,b,p]),k=function(e,t,n){var r=this,a=(0,c.useRef)(null),s=(0,c.useRef)(0),i=(0,c.useRef)(null),u=(0,c.useRef)([]),o=(0,c.useRef)(),l=(0,c.useRef)(),d=(0,c.useRef)(e),f=(0,c.useRef)(!0);d.current=e;var m="undefined"!=typeof window,h=!t&&0!==t&&m;if("function"!=typeof e)throw TypeError("Expected a function");t=+t||0;var p=!!(n=n||{}).leading,w=!("trailing"in n)||!!n.trailing,x="maxWait"in n,y="debounceOnServer"in n&&!!n.debounceOnServer,v=x?Math.max(+n.maxWait||0,t):null;return(0,c.useEffect)(function(){return f.current=!0,function(){f.current=!1}},[]),(0,c.useMemo)(function(){var e=function(e){var t=u.current,n=o.current;return u.current=o.current=null,s.current=e,l.current=d.current.apply(n,t)},n=function(e,t){h&&cancelAnimationFrame(i.current),i.current=h?requestAnimationFrame(e):setTimeout(e,t)},c=function(e){if(!f.current)return!1;var n=e-a.current;return!a.current||n>=t||n<0||x&&e-s.current>=v},g=function(t){return i.current=null,w&&u.current?e(t):(u.current=o.current=null,l.current)},N=function e(){var r=Date.now();if(c(r))return g(r);if(f.current){var i=t-(r-a.current);n(e,x?Math.min(i,v-(r-s.current)):i)}},b=function(){if(m||y){var d=Date.now(),h=c(d);if(u.current=[].slice.call(arguments),o.current=r,a.current=d,h){if(!i.current&&f.current)return s.current=a.current,n(N,t),p?e(a.current):l.current;if(x)return n(N,t),e(a.current)}return i.current||n(N,t),l.current}};return b.cancel=function(){i.current&&(h?cancelAnimationFrame(i.current):clearTimeout(i.current)),s.current=0,u.current=a.current=o.current=i.current=null},b.isPending=function(){return!!i.current},b.flush=function(){return i.current?g(Date.now()):l.current},b},[p,x,t,v,w,h,m,y])}(()=>{window.innerHeight+window.scrollY>=document.body.offsetHeight-500&&C()},200);(0,c.useEffect)(()=>(window.addEventListener("scroll",k),()=>{window.removeEventListener("scroll",k)}),[k]);let E=n=>{if(!t){o.Am.error("请先选择代币");return}t(n),n.hasEnded?e.push("/acting?symbol=".concat(n.symbol)):e.push("/launch?symbol=".concat(n.symbol))};return N||T?(0,r.jsx)("div",{className:"text-red-500",children:"加载错误，请稍后再试。"}):(0,r.jsxs)("div",{className:"space-y-4 m-4",children:[x.map((e,t)=>(0,r.jsx)(u.Zb,{onClick:()=>E(e),children:(0,r.jsxs)(u.aY,{className:"p-4 flex justify-between items-center",children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("p",{className:"flex items-center gap-2 ",children:[(0,r.jsx)("span",{className:"font-semibold mr-4",children:e.symbol}),(0,r.jsx)("span",{className:"text-greyscale-500 text-sm",children:"父币 "}),(0,r.jsx)("span",{className:"text-sm",children:e.parentTokenSymbol})]}),(0,r.jsx)("p",{className:"text-sm text-muted-foreground",children:e.hasEnded?(0,r.jsx)("span",{className:"text-greyscale-500",children:"发射已完成"}):(0,r.jsx)("span",{className:"text-secondary",children:"发射中"})})]}),(0,r.jsx)(s.z,{variant:"ghost",size:"icon",children:(0,r.jsx)(i,{className:"h-4 w-4"})})]})},t)),(g||R)&&(0,r.jsx)(h.Z,{})]})}function w(){return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(a.Z,{title:"Launch"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)("header",{className:"flex justify-between items-center m-4",children:(0,r.jsx)("h1",{className:"text-lg font-bold",children:"所有代币"})}),(0,r.jsx)(p,{})]})]})}},9008:function(e,t,n){e.exports=n(23867)},96128:function(e,t,n){"use strict";n.d(t,{T:function(){return w}});var r=n(14503),a=n(8998),c=n(33840),s=n(26445),i=n(33639),u=n(87469),o=n(61163),l=n(74688),d=n(93714),f=n(47531),m=n(79524),h=n(76404),p=n(99238);async function w(e,t){let{account:n=e.account,chain:w=e.chain,accessList:x,blobs:y,data:v,gas:g,gasPrice:N,maxFeePerBlobGas:b,maxFeePerGas:j,maxPriorityFeePerGas:R,nonce:T,to:C,value:k,...E}=t;if(!n)throw new a.o({docsPath:"/docs/actions/wallet/sendTransaction"});let P=(0,r.T)(n);try{let n;if((0,f.F)(t),null!==w&&(n=await (0,d.s)(e,m.L,"getChainId")({}),(0,c.q)({currentChainId:n,chain:w})),"local"===P.type){let t=await (0,d.s)(e,h.Z,"prepareTransactionRequest")({account:P,accessList:x,blobs:y,chain:w,chainId:n,data:v,gas:g,gasPrice:N,maxFeePerBlobGas:b,maxFeePerGas:j,maxPriorityFeePerGas:R,nonce:T,parameters:[...h.Q,"sidecars"],to:C,value:k,...E}),r=w?.serializers?.transaction,a=await P.signTransaction(t,{serializer:r});return await (0,d.s)(e,p.p,"sendRawTransaction")({serializedTransaction:a})}let r=e.chain?.formatters?.transactionRequest?.format,a=(r||l.tG)({...(0,o.K)(E,{format:r}),accessList:x,blobs:y,chainId:n,data:v,from:P.address,gas:g,gasPrice:N,maxFeePerBlobGas:b,maxFeePerGas:j,maxPriorityFeePerGas:R,nonce:T,to:C,value:k});return await e.request({method:"eth_sendTransaction",params:[a]},{retryCount:0})}catch(e){throw function(e,{docsPath:t,...n}){let r=(()=>{let t=(0,u.k)(e,n);return t instanceof s.cj?e:t})();return new i.mk(r,{docsPath:t,...n})}(e,{...t,account:P,chain:t.chain||void 0})}}},61877:function(e,t,n){"use strict";n.d(t,{n:function(){return s}});var r=n(55629),a=n(93714),c=n(96128);async function s(e,t){let{abi:n,address:s,args:i,dataSuffix:u,functionName:o,...l}=t,d=(0,r.R)({abi:n,args:i,functionName:o});return(0,a.s)(e,c.T,"sendTransaction")({data:`${d}${u?u.replace("0x",""):""}`,to:s,...l})}},33840:function(e,t,n){"use strict";n.d(t,{q:function(){return a}});var r=n(80377);function a({chain:e,currentChainId:t}){if(!e)throw new r.Bk;if(t!==e.id)throw new r.Yl({chain:e,currentChainId:t})}},83540:function(e,t,n){"use strict";n.d(t,{A:function(){return m}});var r=n(95946),a=n(51973),c=n(23147),s=n(36083),i=n(81946);async function u(e,t){let{chainId:n,timeout:u=0,...o}=t,l=e.getClient({chainId:n}),d=(0,i.s)(l,a.e,"waitForTransactionReceipt"),f=await d({...o,timeout:u});if("reverted"===f.status){let e=(0,i.s)(l,c.f,"getTransaction"),t=await e({hash:f.transactionHash}),n=(0,i.s)(l,s.R,"call"),a=await n({...t,data:t.input,gasPrice:"eip1559"!==t.type?t.gasPrice:void 0,maxFeePerGas:"eip1559"===t.type?t.maxFeePerGas:void 0,maxPriorityFeePerGas:"eip1559"===t.type?t.maxPriorityFeePerGas:void 0});throw Error(a?.data?(0,r.rR)(`0x${a.data.substring(138)}`):"unknown reason")}return{...f,chainId:l.chain.id}}var o=n(36100),l=n(82451),d=n(82002),f=n(37122);function m(e={}){let{hash:t,query:n={}}=e,r=(0,f.Z)(e),a=(0,d.x)({config:r}),c=function(e,t={}){return{async queryFn({queryKey:n}){let{hash:r,...a}=n[1];if(!r)throw Error("hash is required");return u(e,{...a,onReplaced:t.onReplaced,hash:r})},queryKey:function(e={}){let{onReplaced:t,...n}=e;return["waitForTransactionReceipt",(0,o.OP)(n)]}(t)}}(r,{...e,chainId:e.chainId??a}),s=!!(t&&(n.enabled??!0));return(0,l.aM)({...n,...c,enabled:s})}},75593:function(e,t,n){"use strict";n.d(t,{S:function(){return f}});var r=n(98029),a=n(61877),c=n(81946),s=n(52425),i=n(75230),u=n(66432);async function o(e,t){let n;let{abi:r,chainId:a,connector:s,...o}=t;n=t.account?t.account:(await (0,i.e)(e,{chainId:a,connector:s})).account;let l=e.getClient({chainId:a}),d=(0,c.s)(l,u.a,"simulateContract"),{result:f,request:m}=await d({...o,abi:r,account:n});return{chainId:l.chain.id,result:f,request:{__mode:"prepared",...m,chainId:a}}}async function l(e,t){let n,r;let{account:u,chainId:l,connector:d,__mode:f,...m}=t;n="object"==typeof u&&u?.type==="local"?e.getClient({chainId:l}):await (0,i.e)(e,{account:u??void 0,chainId:l,connector:d});let{connector:h}=(0,s.D)(e);if("prepared"===f||h?.supportsSimulation)r=m;else{let{request:t}=await o(e,{...m,account:u,chainId:l});r=t}let p=(0,c.s)(n,a.n,"writeContract");return await p({...r,...u?{account:u}:{},chain:l?{id:l}:null})}var d=n(37122);function f(e={}){var t;let{mutation:n}=e,a=(t=(0,d.Z)(e),{mutationFn:e=>l(t,e),mutationKey:["writeContract"]}),{mutate:c,mutateAsync:s,...i}=(0,r.D)({...n,...a});return{...i,writeContract:c,writeContractAsync:s}}}},function(e){e.O(0,[4335,2888,9774,179],function(){return e(e.s=37985)}),_N_E=e.O()}]);