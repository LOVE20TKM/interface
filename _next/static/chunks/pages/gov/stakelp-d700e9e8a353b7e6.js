(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1828],{20640:function(e,t,n){"use strict";var r=n(11742),o={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,s,a,l,i,c,u,d,f=!1;t||(t={}),a=t.debug||!1;try{if(i=r(),c=document.createRange(),u=document.getSelection(),(d=document.createElement("span")).textContent=e,d.ariaHidden="true",d.style.all="unset",d.style.position="fixed",d.style.top=0,d.style.clip="rect(0, 0, 0, 0)",d.style.whiteSpace="pre",d.style.webkitUserSelect="text",d.style.MozUserSelect="text",d.style.msUserSelect="text",d.style.userSelect="text",d.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){a&&console.warn("unable to use e.clipboardData"),a&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=o[t.format]||o.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(d),c.selectNodeContents(d),u.addRange(c),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){a&&console.error("unable to copy using execCommand: ",r),a&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){a&&console.error("unable to copy using clipboardData: ",r),a&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",s=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",l=n.replace(/#{\s*key\s*}/g,s),window.prompt(l,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(c):u.removeAllRanges()),d&&document.body.removeChild(d),i()}return f}},52340:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/stakelp",function(){return n(25615)}])},93461:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},34426:function(e,t,n){"use strict";n.d(t,{Z:function(){return u}});var r=n(85893),o=n(67294),s=n(23432),a=n(93461),l=n(92321),i=n(32209),c=n(86501);function u(e){let{tokenAddress:t,tokenSymbol:n,tokenDecimals:u,tokenImage:d}=e,[f,p]=(0,o.useState)(!1),{isConnected:m}=(0,l.m)(),{data:y}=(0,i.p)(),b=async()=>{if(!m){alert("请先连接你的钱包");return}p(!0);try{if(!y){alert("无法获取钱包客户端");return}await y.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:t,symbol:n,decimals:u,image:d}}})?c.ZP.success("代币已成功添加到 MetaMask 钱包"):c.ZP.error("用户拒绝添加代币")}catch(e){console.error("添加代币失败:",e),c.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{p(!1)}};return(0,r.jsx)("button",{onClick:b,disabled:f,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:f?(0,r.jsx)(s.Z,{className:"h-4 w-4 animate-spin"}):(0,r.jsx)(a.Z,{className:"h-4 w-4 text-greyscale-500"})})}},27460:function(e,t,n){"use strict";var r=n(85893),o=n(67294),s=n(74855),a=n(78865),l=n(18289),i=n(86501),c=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0,showAddress:u=!0,colorClassName:d=""}=e,[f,p]=(0,o.useState)(!1);return(0,r.jsxs)("span",{className:"flex items-center space-x-2",children:[u&&(0,r.jsx)("span",{className:"text-xs ".concat(null!=d?d:"text-greyscale-500"),children:(0,c.Vu)(t)}),n&&(0,r.jsx)(s.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?p(!0):i.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:f?(0,r.jsx)(a.Z,{className:"h-4 w-4 ".concat(null!=d?d:"text-greyscale-500")}):(0,r.jsx)(l.Z,{className:"h-4 w-4 ".concat(null!=d?d:"text-greyscale-500")})})})]})}},301:function(e,t,n){"use strict";n.d(t,{AT:function(){return c},op:function(){return i},oN:function(){return u}});var r=n(89810),o=n(71366),s=n(83540);let a=[{type:"function",name:"swapExactTokensForTokens",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"amountOutMin",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"},{name:"to",type:"address",internalType:"address"},{name:"deadline",type:"uint256",internalType:"uint256"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"nonpayable"},{type:"function",name:"getAmountsOut",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"getAmountsIn",inputs:[{name:"amountOut",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"}],l="0xd5495bdc48d99FF3255Ad59389Ff8cE0d6cb163d",i=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:o,error:s,isLoading:i}=(0,r.u)({address:l,abi:a,functionName:"getAmountsOut",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:o,error:s,isLoading:i}},c=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:o,error:s,isLoading:i}=(0,r.u)({address:l,abi:a,functionName:"getAmountsIn",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:o,error:s,isLoading:i}};function u(){let{writeContract:e,isPending:t,data:n,error:r}=(0,o.S)(),i=async(t,n,r,o,s)=>{try{await e({address:l,abi:a,functionName:"swapExactTokensForTokens",args:[t,n,r,o,s]})}catch(e){console.error("Swap failed:",e)}},{isLoading:c,isSuccess:u}=(0,s.A)({hash:n});return{swap:i,writeData:n,isWriting:t,writeError:r,isConfirming:c,isConfirmed:u}}},25615:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return z}});var r=n(85893),o=n(67294),s=n(93778),a=n(7224),l=n(67068),i=n(37436),c=n(42083),u=n(92321),d=n(91529),f=n(27460),p=n(34426);function m(){let{token:e}=(0,o.useContext)(s.M)||{},{address:t}=(0,u.m)(),{balance:n,isPending:i,error:m}=(0,a.hS)((null==e?void 0:e.slTokenAddress)||"",t||"0x0"),{handleContractError:y}=(0,l.S)();return((0,o.useEffect)(()=>{m&&y(m,"token")},[m]),null==e?void 0:e.slTokenAddress)?(0,r.jsx)("div",{className:"px-4 pt-0 pb-6",children:(0,r.jsxs)("div",{className:"bg-gray-100 rounded-lg p-4 text-sm mt-4",children:[(0,r.jsx)("div",{className:"flex items-center",children:(0,r.jsx)("div",{className:"mr-2",children:(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsxs)("span",{className:"font-bold text-2xl mr-2",children:["sl",e.symbol]}),(0,r.jsx)(f.Z,{address:e.slTokenAddress}),(0,r.jsx)(p.Z,{tokenAddress:e.slTokenAddress,tokenSymbol:e.symbol||"",tokenDecimals:e.decimals||0})]})})}),(0,r.jsxs)("div",{className:"mt-1 flex items-center",children:[(0,r.jsx)("span",{className:"text-sm text-greyscale-500 mr-1",children:"我持有:"}),(0,r.jsx)("span",{className:"text-sm text-secondary",children:i?(0,r.jsx)(c.Z,{}):(0,d.LH)(n||0n)})]})]})}):(0,r.jsx)(c.Z,{})}var y=n(11163),b=n(86501),x=n(1604),h=n(56312),v=n(87536),g=n(27245),j=n(76929),k=n(88659),w=n(21774),C=n(23432),T=n(41664),E=n.n(T),S=n(48105);let N=e=>{var t;return(null==e?void 0:e.reason)?e.reason:(null==e?void 0:null===(t=e.data)||void 0===t?void 0:t.message)?e.data.message:(null==e?void 0:e.message)?e.message:"发生未知错误"};var P=n(95049),O=n(19638),A=n(301);let D=function(e,t,n,r){let s=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:a,error:l,isLoading:i}=(0,A.op)(e,t,s&&r),{data:c,error:u,isLoading:d}=(0,o.useMemo)(()=>{if(!s||r)return{data:a,error:l,isLoading:i};{var o,c;let r;let s=0n;return s=(null==n?void 0:n.address)==="0x8eE76E8B4aDB0Ed61eaeCB83DBdEA0cD8432C5B7"?BigInt("1000000000000000000000000000")/BigInt("100000000000000000"):BigInt("1000000000000000000000000000")/BigInt("20000000000000000000000000"),r=t&&t.length>=1&&(null===(o=t[0])||void 0===o?void 0:o.toLowerCase())===(null==n?void 0:null===(c=n.address)||void 0===c?void 0:c.toLowerCase())?e/s:e*s,{data:[e,r],error:null,isLoading:!1}}},[r,a,l,i,e,t,null==n?void 0:n.address]);return{data:c,error:u,isLoading:d}},B=function(e,t,n,r){let s=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:a,error:l,isLoading:i}=(0,A.AT)(e,t,s&&r),{data:c,error:u,isLoading:d}=(0,o.useMemo)(()=>{if(!s||r)return{data:a,error:l,isLoading:i};{var o,c;let r=0n;return r=(null==n?void 0:n.address)==="0x8eE76E8B4aDB0Ed61eaeCB83DBdEA0cD8432C5B7"?BigInt("1000000000000000000000000000")/BigInt("100000000000000000"):BigInt("1000000000000000000000000000")/BigInt("20000000000000000000000000"),{data:[t&&t.length>=1&&(null===(o=t[0])||void 0===o?void 0:o.toLowerCase())===(null==n?void 0:null===(c=n.address)||void 0===c?void 0:c.toLowerCase())?e*r:e/r,e],error:null,isLoading:!1}}},[r,a,l,i,e,t,null==n?void 0:n.address]);return{data:c,error:u,isLoading:d}};var I=n(92180),R=n(64777),Z=n(44576),_=e=>{var t,n;let{stakedTokenAmountOfLP:a}=e,{address:i,chain:f}=(0,u.m)(),p=(0,o.useContext)(s.M);if(!p)throw Error("TokenContext 必须在 TokenProvider 内使用");let{token:m,setToken:T}=p,{setError:A}=(0,P.V)(),{first:_}=(0,y.useRouter)().query,{balance:z,isPending:L,error:M}=(0,O.hS)(null==m?void 0:m.address,i),{balance:F,isPending:V,error:W}=(0,O.hS)(null==m?void 0:m.parentTokenAddress,i),[X,U]=(0,o.useState)(!1),{initialStakeRound:G,isPending:q,error:H}=(0,I.VL)(null==m?void 0:m.address,X),$=(0,v.cI)({resolver:(0,h.F)((t=F||0n,n=z||0n,x.z.object({parentToken:x.z.preprocess(e=>{if("string"!=typeof e)return e;let t=e.replace(/。/g,".");return t.startsWith(".")&&(t="0"+t),t},x.z.string().regex(/^\d+(\.\d{1,12})?$/,"请输入合法数值，最多支持12位小数").refine(e=>{let t=(0,d.vz)(e);return null!==t&&t>0n},"质押父币数不能为 0").refine(e=>{let n=(0,d.vz)(e);return null!==n&&n<=t},"质押父币数不能超过当前持有")),stakeToken:x.z.preprocess(e=>{if("string"!=typeof e)return e;let t=e.replace(/。/g,".");return t.startsWith(".")&&(t="0"+t),t},x.z.string().regex(/^\d+(\.\d{1,12})?$/,"请输入合法数值，最多支持12位小数").refine(e=>{let t=(0,d.vz)(e);return null!==t&&t>0n},"质押 token 数不能为 0").refine(e=>{let t=(0,d.vz)(e);return null!==t&&t<=n},"质押 token 数不能超过当前持有")),releasePeriod:x.z.string()}))),defaultValues:{parentToken:"",stakeToken:"",releasePeriod:"4"},mode:"onChange"}),{slAmount:J,stAmount:Q,promisedWaitingRounds:K,requestedUnstakeRound:Y,govVotes:ee,isPending:et,error:en}=(0,I.L)(null==m?void 0:m.address,i),[er,eo]=(0,o.useState)(!1),[es,ea]=(0,o.useState)(!1),{allowance:el,isPending:ei,error:ec}=(0,O.yG)(null==m?void 0:m.address,i,"0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc"),{allowance:eu,isPending:ed,error:ef}=(0,O.yG)(null==m?void 0:m.parentTokenAddress,i,"0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc"),{approve:ep,isWriting:em,isConfirming:ey,isConfirmed:eb,writeError:ex}=(0,O.yA)(null==m?void 0:m.address),{approve:eh,isWriting:ev,isConfirming:eg,isConfirmed:ej,writeError:ek}=(0,O.yA)(null==m?void 0:m.parentTokenAddress);async function ew(e){if((0,S.S)(f))try{let t=(0,d.vz)(e.stakeToken);if(null===t)throw Error("无效的输入格式");await ep("0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc",t)}catch(e){console.error("Token 授权失败",e),b.Am.error("token 授权失败，请检查输入格式")}}async function eC(e){if((0,S.S)(f))try{let t=(0,d.vz)(e.parentToken);if(null===t)throw Error("无效的输入格式");await eh("0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc",t)}catch(e){console.error("父币授权失败",e),b.Am.error("父币授权失败，请检查输入格式")}}(0,o.useEffect)(()=>{eb&&(eo(!0),b.Am.success("授权".concat(null==m?void 0:m.symbol,"成功"))),ej&&(ea(!0),b.Am.success("授权".concat(null==m?void 0:m.parentTokenSymbol,"成功")))},[eb,ej]);let[eT,eE]=(0,o.useState)(!1),[eS,eN]=(0,o.useState)(!1),eP=a>0n,eO=$.watch("parentToken"),eA=$.watch("stakeToken"),eD=(0,d.vz)(eO),eB=(0,d.vz)(eA),{data:eI,error:eR,isLoading:eZ}=D(null!==eD?eD:0n,[null==m?void 0:m.parentTokenAddress,null==m?void 0:m.address],m,eP,eT),{data:e_,error:ez,isLoading:eL}=B(null!==eB?eB:0n,[null==m?void 0:m.parentTokenAddress,null==m?void 0:m.address],m,eP,eS);(0,o.useEffect)(()=>{if(eI&&eI.length>1){let e=Number((0,d.bM)(BigInt(eI[1]))).toFixed(12).replace(/\.?0+$/,"");$.setValue("stakeToken",e),eE(!1),eN(!1)}},[eI]),(0,o.useEffect)(()=>{if(e_&&e_.length>1){let e=Number((0,d.bM)(BigInt(e_[0]))).toFixed(12).replace(/\.?0+$/,"");$.setValue("parentToken",e),eE(!1),eN(!1)}},[e_]),(0,o.useEffect)(()=>{eD>0n&&eu&&eu>0n&&eu>=eD?ea(!0):ea(!1)},[eD,ed]),(0,o.useEffect)(()=>{eB>0n&&el&&el>0n&&el>=eB?eo(!0):eo(!1)},[eB,ei]);let{stakeLiquidity:eM,isWriting:eF,isConfirming:eV,isConfirmed:eW,writeError:eX}=(0,I.Xc)();async function eU(e){if(!(0,S.S)(f))return;if(!(er&&es)){b.Am.error("请先完成授权");return}let t=(0,d.vz)(e.stakeToken),n=(0,d.vz)(e.parentToken);if(null===t||null===n){b.Am.error("转换金额时出错，请检查输入格式");return}eM(null==m?void 0:m.address,t,n,BigInt(e.releasePeriod),i).catch(e=>{let t=N(e);b.Am.error(t||"质押失败，请重试"),console.error("Stake failed",e)})}function eG(){b.Am.success("质押成功"),setTimeout(()=>{window.location.href="".concat("/LOVE20-interface","/gov/?symbol=").concat(null==m?void 0:m.symbol)},2e3)}(0,o.useEffect)(()=>{eW&&((null==m?void 0:m.initialStakeRound)&&m.initialStakeRound>0?eG():U(!0))},[eW]),(0,o.useEffect)(()=>{X&&!q&&G&&G>0&&(T({...m,initialStakeRound:Number(G)}),eG())},[X,q,G]);let{handleContractError:eq}=(0,l.S)();(0,o.useEffect)(()=>{W&&eq(W,"token"),M&&eq(M,"token"),ef&&eq(ef,"token"),ec&&eq(ec,"token"),ex&&eq(ex,"stake"),ek&&eq(ek,"stake"),eX&&eq(eX,"stake"),H&&eq(H,"stake"),eR&&eq(eR,"uniswap"),ez&&eq(ez,"uniswap"),en&&eq(en,"stake")},[W,M,ef,ec,ex,ek,eX,H,eR,ez,en]);let eH=em||ev,e$=ey||eg,eJ=eH||e$||er&&es;(0,o.useEffect)(()=>{"true"!==_||eJ||A({name:"提示：",message:"新部署的代币，需先质押获取治理票，才能后续操作"})},[_,eJ,A]),(0,o.useEffect)(()=>{L||z||eJ||!m||!m.symbol||A({name:"余额不足",message:"您当前".concat(m.symbol,"数量为0，请先获取").concat(m.symbol)}),V||F||eJ||!m||!m.parentTokenSymbol||A({name:"余额不足",message:"您当前".concat(m.parentTokenSymbol,"数量为0，请先获取").concat(m.parentTokenSymbol)})},[z,F,m]),(0,o.useEffect)(()=>{void 0!==K&&K>0&&$.setValue("releasePeriod",String(K))},[K]);let eQ=(0,o.useRef)(null),eK=(0,o.useRef)(ei);return((0,o.useEffect)(()=>{if(eK.current&&!ei){var e;null===(e=eQ.current)||void 0===e||e.blur()}eK.current=ei},[ei]),et)?(0,r.jsx)(c.Z,{}):(0,r.jsxs)("div",{className:"w-full flex-col items-center p-6 pt-2",children:[(0,r.jsx)("div",{className:"w-full flex justify-between items-center",children:(0,r.jsx)(R.Z,{title:"质押获取治理票"})}),(0,r.jsx)(j.l0,{...$,children:(0,r.jsxs)("form",{onSubmit:$.handleSubmit(eU),className:"w-full max-w-md mt-4 space-y-4",children:[(0,r.jsx)(j.Wi,{control:$.control,name:"parentToken",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsxs)(j.lX,{children:["质押父币数 (当前持有：",(0,r.jsx)("span",{className:"text-secondary-400 mr-2",children:(0,d.LH)(F||0n)}),null==m?void 0:m.parentTokenSymbol,")",(0,r.jsxs)(E(),{href:"/launch/deposit/",className:"text-secondary-400 ml-2",children:["去获取",null==m?void 0:m.parentTokenSymbol]})]}),(0,r.jsx)(j.NI,{children:(0,r.jsx)(w.I,{type:"number",placeholder:"输入 ".concat(null==m?void 0:m.parentTokenSymbol," 数量"),...t,disabled:eJ,onChange:e=>{t.onChange(e),eE(!0)},className:"!ring-secondary-foreground"})}),(0,r.jsx)(j.zG,{})]})}}),(0,r.jsx)(j.Wi,{control:$.control,name:"stakeToken",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsxs)(j.lX,{children:["质押 token 数 (当前持有：",(0,r.jsx)("span",{className:"text-secondary-400 mr-2",children:(0,d.LH)(z||0n)}),null==m?void 0:m.symbol,")",!!z&&z<=10n&&(0,r.jsxs)(E(),{href:"/dex/swap/",className:"text-secondary-400 ml-2",children:["去获取",null==m?void 0:m.symbol]})]}),(0,r.jsx)(j.NI,{children:(0,r.jsx)(w.I,{type:"number",placeholder:"输入 ".concat(null==m?void 0:m.symbol," 数量"),...t,disabled:eJ,onChange:e=>{t.onChange(e),eN(!0)},className:"!ring-secondary-foreground"})}),(0,r.jsx)(j.zG,{})]})}}),(0,r.jsx)(j.Wi,{control:$.control,name:"releasePeriod",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsx)(j.lX,{children:"释放期"}),(0,r.jsx)(j.NI,{children:(0,r.jsxs)(k.Ph,{disabled:eJ,onValueChange:e=>t.onChange(e),value:t.value,children:[(0,r.jsx)(k.i4,{className:"w-full !ring-secondary-foreground",children:(0,r.jsx)(k.ki,{placeholder:"选择释放期"})}),(0,r.jsx)(k.Bw,{children:Array.from({length:9},(e,t)=>t+4).filter(e=>e>=K).map(e=>(0,r.jsx)(k.Ql,{value:String(e),children:e},e))})]})}),(0,r.jsx)(j.pf,{children:"释放期：申请解锁后，几轮之后可以领取。"}),(0,r.jsx)(j.zG,{})]})}}),(0,r.jsxs)("div",{className:"flex justify-center space-x-2 mt-4",children:[(0,r.jsx)(g.z,{type:"button",className:"w-1/3",ref:eQ,disabled:ei||em||ey||er,onClick:$.handleSubmit(ew),children:ei?(0,r.jsx)(C.Z,{className:"animate-spin"}):em?"1.提交中...":ey?"1.确认中...":er?"1.".concat(null==m?void 0:m.symbol,"已授权"):"1.授权".concat(null==m?void 0:m.symbol)}),(0,r.jsx)(g.z,{type:"button",className:"w-1/3",disabled:!er||ed||ev||eg||es,onClick:$.handleSubmit(eC),children:ed?(0,r.jsx)(C.Z,{className:"animate-spin"}):ev?"2.提交中...":eg?"2.确认中...":es?"2.".concat(null==m?void 0:m.parentTokenSymbol,"已授权"):"2.授权".concat(null==m?void 0:m.parentTokenSymbol)}),(0,r.jsx)(g.z,{type:"submit",className:"w-1/3",disabled:!er||!es||eF||eV||eW,children:eF?"3.质押中...":eV?"3.确认中...":eW?"3.已质押":"3.质押"})]})]})}),(0,r.jsx)(Z.Z,{isLoading:eH||e$||eF||eV||q&&X,text:eH||eF?"提交交易...":"确认交易..."})]})},z=()=>{let{token:e}=(0,o.useContext)(s.M)||{},t=!!(null==e?void 0:e.initialStakeRound)&&(null==e?void 0:e.initialStakeRound)>0,{tokenAmount:n,isPending:u,error:d}=(0,a.tT)(null==e?void 0:e.slTokenAddress,t),{handleContractError:f}=(0,l.S)();return(0,o.useEffect)(()=>{d&&f(d,"slToken")},[d]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.Z,{title:"质押LP"}),(0,r.jsxs)("main",{className:"flex-grow",children:[u&&t&&(0,r.jsx)("div",{className:"flex justify-center items-center mt-10",children:(0,r.jsx)(c.Z,{})}),(0,r.jsx)(m,{}),(!u||!t)&&(0,r.jsx)(_,{stakedTokenAmountOfLP:n||0n}),(0,r.jsxs)("div",{className:"flex flex-col w-full p-4 mt-4",children:[(0,r.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"1、所得治理票数 = LP 数量 * 释放期轮次"}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮。"})]})]})]})}},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var o=l(n(67294)),s=l(n(20640)),a=["text","onCopy","options","children"];function l(e){return e&&e.__esModule?e:{default:e}}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach(function(t){p(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function d(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function p(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var m=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t)}(i,e);var t,n,l=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(i);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return d(e)}(this,e)});function i(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,i);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return p(d(e=l.call.apply(l,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,a=n.onCopy,l=n.children,i=n.options,c=o.default.Children.only(l),u=(0,s.default)(r,i);a&&a(r,u),c&&c.props&&"function"==typeof c.props.onClick&&c.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}(e,a),r=o.default.Children.only(t);return o.default.cloneElement(r,c(c({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(i.prototype,n),Object.defineProperty(i,"prototype",{writable:!1}),i}(o.default.PureComponent);t.CopyToClipboard=m,p(m,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}}},function(e){e.O(0,[1664,2624,2209,7569,4637,5263,7224,5343,2888,9774,179],function(){return e(e.s=52340)}),_N_E=e.O()}]);