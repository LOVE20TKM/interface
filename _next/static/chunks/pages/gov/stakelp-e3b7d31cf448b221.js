(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1828],{20640:function(e,t,n){"use strict";var r=n(11742),s={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,a,o,l,i,c,d,u,f=!1;t||(t={}),o=t.debug||!1;try{if(i=r(),c=document.createRange(),d=document.getSelection(),(u=document.createElement("span")).textContent=e,u.ariaHidden="true",u.style.all="unset",u.style.position="fixed",u.style.top=0,u.style.clip="rect(0, 0, 0, 0)",u.style.whiteSpace="pre",u.style.webkitUserSelect="text",u.style.MozUserSelect="text",u.style.msUserSelect="text",u.style.userSelect="text",u.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){o&&console.warn("unable to use e.clipboardData"),o&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=s[t.format]||s.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(u),c.selectNodeContents(u),d.addRange(c),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){o&&console.error("unable to copy using execCommand: ",r),o&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){o&&console.error("unable to copy using clipboardData: ",r),o&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",a=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",l=n.replace(/#{\s*key\s*}/g,a),window.prompt(l,e)}}finally{d&&("function"==typeof d.removeRange?d.removeRange(c):d.removeAllRanges()),u&&document.body.removeChild(u),i()}return f}},52340:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/stakelp",function(){return n(25615)}])},76929:function(e,t,n){"use strict";n.d(t,{l0:function(){return u},NI:function(){return b},pf:function(){return g},Wi:function(){return m},xJ:function(){return x},lX:function(){return h},zG:function(){return v}});var r=n(85893),s=n(67294),a=n(4222),o=n(87536),l=n(40108),i=n(99489);let c=(0,n(12003).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),d=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(i.f,{ref:t,className:(0,l.cn)(c(),n),...s})});d.displayName=i.f.displayName;let u=o.RV,f=s.createContext({}),m=e=>{let{...t}=e;return(0,r.jsx)(f.Provider,{value:{name:t.name},children:(0,r.jsx)(o.Qr,{...t})})},p=()=>{let e=s.useContext(f),t=s.useContext(y),{getFieldState:n,formState:r}=(0,o.Gc)(),a=n(e.name,r);if(!e)throw Error("useFormField should be used within <FormField>");let{id:l}=t;return{id:l,name:e.name,formItemId:"".concat(l,"-form-item"),formDescriptionId:"".concat(l,"-form-item-description"),formMessageId:"".concat(l,"-form-item-message"),...a}},y=s.createContext({}),x=s.forwardRef((e,t)=>{let{className:n,...a}=e,o=s.useId();return(0,r.jsx)(y.Provider,{value:{id:o},children:(0,r.jsx)("div",{ref:t,className:(0,l.cn)("space-y-2",n),...a})})});x.displayName="FormItem";let h=s.forwardRef((e,t)=>{let{className:n,...s}=e,{error:a,formItemId:o}=p();return(0,r.jsx)(d,{ref:t,className:(0,l.cn)(a&&"text-destructive",n),htmlFor:o,...s})});h.displayName="FormLabel";let b=s.forwardRef((e,t)=>{let{...n}=e,{error:s,formItemId:o,formDescriptionId:l,formMessageId:i}=p();return(0,r.jsx)(a.g7,{ref:t,id:o,"aria-describedby":s?"".concat(l," ").concat(i):"".concat(l),"aria-invalid":!!s,...n})});b.displayName="FormControl";let g=s.forwardRef((e,t)=>{let{className:n,...s}=e,{formDescriptionId:a}=p();return(0,r.jsx)("p",{ref:t,id:a,className:(0,l.cn)("text-sm text-muted-foreground",n),...s})});g.displayName="FormDescription";let v=s.forwardRef((e,t)=>{let{className:n,children:s,...a}=e,{error:o,formMessageId:i}=p(),c=o?String(null==o?void 0:o.message):s;return c?(0,r.jsx)("p",{ref:t,id:i,className:(0,l.cn)("text-sm font-medium text-destructive",n),...a,children:c}):null});v.displayName="FormMessage"},88659:function(e,t,n){"use strict";n.d(t,{Bw:function(){return y},Ph:function(){return d},Ql:function(){return x},i4:function(){return f},ki:function(){return u}});var r=n(85893),s=n(67294),a=n(86443),o=n(42171),l=n(15432),i=n(78865),c=n(40108);let d=a.fC;a.ZA;let u=a.B4,f=s.forwardRef((e,t)=>{let{className:n,children:s,...l}=e;return(0,r.jsxs)(a.xz,{ref:t,className:(0,c.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",n),...l,children:[s,(0,r.jsx)(a.JO,{asChild:!0,children:(0,r.jsx)(o.Z,{className:"h-4 w-4 opacity-50"})})]})});f.displayName=a.xz.displayName;let m=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(a.u_,{ref:t,className:(0,c.cn)("flex cursor-default items-center justify-center py-1",n),...s,children:(0,r.jsx)(l.Z,{className:"h-4 w-4"})})});m.displayName=a.u_.displayName;let p=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(a.$G,{ref:t,className:(0,c.cn)("flex cursor-default items-center justify-center py-1",n),...s,children:(0,r.jsx)(o.Z,{className:"h-4 w-4"})})});p.displayName=a.$G.displayName;let y=s.forwardRef((e,t)=>{let{className:n,children:s,position:o="popper",...l}=e;return(0,r.jsx)(a.h_,{children:(0,r.jsxs)(a.VY,{ref:t,className:(0,c.cn)("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2","popper"===o&&"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",n),position:o,...l,children:[(0,r.jsx)(m,{}),(0,r.jsx)(a.l_,{className:(0,c.cn)("p-1","popper"===o&&"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),children:s}),(0,r.jsx)(p,{})]})})});y.displayName=a.VY.displayName,s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(a.__,{ref:t,className:(0,c.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold",n),...s})}).displayName=a.__.displayName;let x=s.forwardRef((e,t)=>{let{className:n,children:s,...o}=e;return(0,r.jsxs)(a.ck,{ref:t,className:(0,c.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",n),...o,children:[(0,r.jsx)("span",{className:"absolute left-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,r.jsx)(a.wU,{children:(0,r.jsx)(i.Z,{className:"h-4 w-4"})})}),(0,r.jsx)(a.eT,{children:s})]})});x.displayName=a.ck.displayName,s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(a.Z0,{ref:t,className:(0,c.cn)("-mx-1 my-1 h-px bg-muted",n),...s})}).displayName=a.Z0.displayName},93461:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},34426:function(e,t,n){"use strict";n.d(t,{Z:function(){return d}});var r=n(85893),s=n(67294),a=n(23432),o=n(93461),l=n(92321),i=n(32209),c=n(86501);function d(e){let{tokenAddress:t,tokenSymbol:n,tokenDecimals:d,tokenImage:u}=e,[f,m]=(0,s.useState)(!1),{isConnected:p}=(0,l.m)(),{data:y}=(0,i.p)(),x=async()=>{if(!p){alert("请先连接你的钱包");return}m(!0);try{if(!y){alert("无法获取钱包客户端");return}await y.request({method:"wallet_watchAsset",params:{type:"ERC20",options:{address:t,symbol:n,decimals:d,image:u}}})?c.ZP.success("代币已成功添加到 MetaMask 钱包"):c.ZP.error("用户拒绝添加代币")}catch(e){console.error("添加代币失败:",e),c.ZP.error("添加代币失败，请检查控制台以获取更多信息")}finally{m(!1)}};return(0,r.jsx)("button",{onClick:x,disabled:f,className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",children:f?(0,r.jsx)(a.Z,{className:"h-4 w-4 animate-spin"}):(0,r.jsx)(o.Z,{className:"h-4 w-4 text-greyscale-500"})})}},27460:function(e,t,n){"use strict";var r=n(85893),s=n(67294),a=n(74855),o=n(78865),l=n(18289),i=n(86501),c=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0,showAddress:d=!0,colorClassName:u=""}=e,[f,m]=(0,s.useState)(!1);return(0,r.jsxs)("span",{className:"flex items-center space-x-2",children:[d&&(0,r.jsx)("span",{className:"text-xs ".concat(null!=u?u:"text-greyscale-500"),children:(0,c.Vu)(t)}),n&&(0,r.jsx)(a.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?m(!0):i.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:f?(0,r.jsx)(o.Z,{className:"h-4 w-4 ".concat(null!=u?u:"text-greyscale-500")}):(0,r.jsx)(l.Z,{className:"h-4 w-4 ".concat(null!=u?u:"text-greyscale-500")})})})]})}},44576:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},301:function(e,t,n){"use strict";n.d(t,{AT:function(){return c},op:function(){return i},oN:function(){return d}});var r=n(89810),s=n(71366),a=n(83540);let o=[{type:"function",name:"swapExactTokensForTokens",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"amountOutMin",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"},{name:"to",type:"address",internalType:"address"},{name:"deadline",type:"uint256",internalType:"uint256"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"nonpayable"},{type:"function",name:"getAmountsOut",inputs:[{name:"amountIn",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"},{type:"function",name:"getAmountsIn",inputs:[{name:"amountOut",type:"uint256",internalType:"uint256"},{name:"path",type:"address[]",internalType:"address[]"}],outputs:[{name:"amounts",type:"uint256[]",internalType:"uint256[]"}],stateMutability:"view"}],l="0x6215ad4d0F3BA997C68c0C5D65eeca1F41D9338f",i=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:s,error:a,isLoading:i}=(0,r.u)({address:l,abi:o,functionName:"getAmountsOut",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:s,error:a,isLoading:i}},c=function(e,t){let n=!(arguments.length>2)||void 0===arguments[2]||arguments[2],{data:s,error:a,isLoading:i}=(0,r.u)({address:l,abi:o,functionName:"getAmountsIn",args:[e,t],query:{enabled:!!e&&t.length>=2&&n}});return{data:s,error:a,isLoading:i}};function d(){let{writeContract:e,isPending:t,data:n,error:r}=(0,s.S)(),i=async(t,n,r,s,a)=>{try{await e({address:l,abi:o,functionName:"swapExactTokensForTokens",args:[t,n,r,s,a]})}catch(e){console.error("Swap failed:",e)}},{isLoading:c,isSuccess:d}=(0,a.A)({hash:n});return{swap:i,writeData:n,isWriting:t,writeError:r,isConfirming:c,isConfirmed:d}}},48105:function(e,t,n){"use strict";n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("thinkium801")),!1)},25615:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return B}});var r=n(85893),s=n(67294),a=n(93778),o=n(7224),l=n(67068),i=n(37436),c=n(42083),d=n(92321),u=n(91529),f=n(27460),m=n(34426);function p(){let{token:e}=(0,s.useContext)(a.M)||{},{address:t}=(0,d.m)(),{balance:n,isPending:i,error:p}=(0,o.hS)((null==e?void 0:e.slTokenAddress)||"",t||"0x0"),{handleContractError:y}=(0,l.S)();return((0,s.useEffect)(()=>{p&&y(p,"token")},[p]),null==e?void 0:e.slTokenAddress)?(0,r.jsx)("div",{className:"px-4 pt-0 pb-6",children:(0,r.jsxs)("div",{className:"bg-gray-100 rounded-lg p-4 text-sm mt-4",children:[(0,r.jsx)("div",{className:"flex items-center",children:(0,r.jsx)("div",{className:"mr-2",children:(0,r.jsxs)("div",{className:"flex items-center",children:[(0,r.jsxs)("span",{className:"font-bold text-2xl mr-2",children:["sl",e.symbol]}),(0,r.jsx)(f.Z,{address:e.slTokenAddress}),(0,r.jsx)(m.Z,{tokenAddress:e.slTokenAddress,tokenSymbol:"sl"+e.symbol,tokenDecimals:e.decimals||0})]})})}),(0,r.jsxs)("div",{className:"mt-1 flex items-center",children:[(0,r.jsx)("span",{className:"text-sm text-greyscale-500 mr-1",children:"我持有:"}),(0,r.jsx)("span",{className:"text-sm text-secondary",children:i?(0,r.jsx)(c.Z,{}):(0,u.LH)(n||0n)})]})]})}):(0,r.jsx)(c.Z,{})}var y=n(11163),x=n(86501),h=n(1604),b=n(56312),g=n(87536),v=n(27245),j=n(76929),w=n(88659),k=n(21774),N=n(23432),C=n(41664),T=n.n(C),S=n(48105);let A=e=>{var t;return(null==e?void 0:e.reason)?e.reason:(null==e?void 0:null===(t=e.data)||void 0===t?void 0:t.message)?e.data.message:(null==e?void 0:e.message)?e.message:"发生未知错误"};var P=n(95049),E=n(19638),O=n(301);let R=function(e,t,n,r){let a=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:o,error:l,isLoading:i}=(0,O.op)(e,t,a&&r),{data:c,error:d,isLoading:u}=(0,s.useMemo)(()=>{if(!a||r)return{data:o,error:l,isLoading:i};{var s,c;let r;let a=0n;return a=(null==n?void 0:n.address)==="0xCfaAf67a874A6Bde45601E16CeB1b6C9BD1739b7"?BigInt("1000000000000000000000000000")/BigInt("100000000000000000"):BigInt("1000000000000000000000000000")/BigInt("20000000000000000000000000"),r=t&&t.length>=1&&(null===(s=t[0])||void 0===s?void 0:s.toLowerCase())===(null==n?void 0:null===(c=n.address)||void 0===c?void 0:c.toLowerCase())?e/a:e*a,{data:[e,r],error:null,isLoading:!1}}},[r,o,l,i,e,t,null==n?void 0:n.address]);return{data:c,error:d,isLoading:u}},D=function(e,t,n,r){let a=!(arguments.length>4)||void 0===arguments[4]||arguments[4],{data:o,error:l,isLoading:i}=(0,O.AT)(e,t,a&&r),{data:c,error:d,isLoading:u}=(0,s.useMemo)(()=>{if(!a||r)return{data:o,error:l,isLoading:i};{var s,c;let r=0n;return r=(null==n?void 0:n.address)==="0xCfaAf67a874A6Bde45601E16CeB1b6C9BD1739b7"?BigInt("1000000000000000000000000000")/BigInt("100000000000000000"):BigInt("1000000000000000000000000000")/BigInt("20000000000000000000000000"),{data:[t&&t.length>=1&&(null===(s=t[0])||void 0===s?void 0:s.toLowerCase())===(null==n?void 0:null===(c=n.address)||void 0===c?void 0:c.toLowerCase())?e*r:e/r,e],error:null,isLoading:!1}}},[r,o,l,i,e,t,null==n?void 0:n.address]);return{data:c,error:d,isLoading:u}};var Z=n(92180),_=n(64777),I=n(44576),z=e=>{var t,n;let{stakedTokenAmountOfLP:o}=e,{address:i,chain:f}=(0,d.m)(),m=(0,s.useContext)(a.M);if(!m)throw Error("TokenContext 必须在 TokenProvider 内使用");let{token:p,setToken:C}=m,{setError:O}=(0,P.V)(),{first:z}=(0,y.useRouter)().query,{balance:B,isPending:F,error:L}=(0,E.hS)(null==p?void 0:p.address,i),{balance:M,isPending:V,error:G}=(0,E.hS)(null==p?void 0:p.parentTokenAddress,i),[W,X]=(0,s.useState)(!1),{initialStakeRound:U,isPending:$,error:J}=(0,Z.VL)(null==p?void 0:p.address),q=(0,g.cI)({resolver:(0,b.F)((t=M||0n,n=B||0n,h.z.object({parentToken:h.z.preprocess(e=>{if("string"!=typeof e)return e;let t=e.replace(/。/g,".");return t.startsWith(".")&&(t="0"+t),t},h.z.string().regex(/^\d+(\.\d{1,12})?$/,"请输入合法数值，最多支持12位小数").refine(e=>{let t=(0,u.vz)(e);return null!==t&&t>0n},"质押父币数不能为 0").refine(e=>{let n=(0,u.vz)(e);return null!==n&&n<=t},"质押父币数不能超过当前持有")),stakeToken:h.z.preprocess(e=>{if("string"!=typeof e)return e;let t=e.replace(/。/g,".");return t.startsWith(".")&&(t="0"+t),t},h.z.string().regex(/^\d+(\.\d{1,12})?$/,"请输入合法数值，最多支持12位小数").refine(e=>{let t=(0,u.vz)(e);return null!==t&&t>0n},"质押 token 数不能为 0").refine(e=>{let t=(0,u.vz)(e);return null!==t&&t<=n},"质押 token 数不能超过当前持有")),releasePeriod:h.z.string()}))),defaultValues:{parentToken:"",stakeToken:"",releasePeriod:"4"},mode:"onChange"}),{promisedWaitingRounds:H,isPending:Q,error:Y}=(0,Z.L)(null==p?void 0:p.address,i),[K,ee]=(0,s.useState)(!1),[et,en]=(0,s.useState)(!1),{allowance:er,isPending:es,error:ea}=(0,E.yG)(null==p?void 0:p.address,i,"0x76F95D4e5e457e6F02909A902b07872BAdd38241"),{allowance:eo,isPending:el,error:ei}=(0,E.yG)(null==p?void 0:p.parentTokenAddress,i,"0x76F95D4e5e457e6F02909A902b07872BAdd38241"),{approve:ec,isWriting:ed,isConfirming:eu,isConfirmed:ef,writeError:em}=(0,E.yA)(null==p?void 0:p.address),{approve:ep,isWriting:ey,isConfirming:ex,isConfirmed:eh,writeError:eb}=(0,E.yA)(null==p?void 0:p.parentTokenAddress);async function eg(e){if((0,S.S)(f))try{let t=(0,u.vz)(e.stakeToken);if(null===t)throw Error("无效的输入格式");await ec("0x76F95D4e5e457e6F02909A902b07872BAdd38241",t)}catch(e){console.error("Token 授权失败",e),x.Am.error("token 授权失败，请检查输入格式")}}async function ev(e){if((0,S.S)(f))try{let t=(0,u.vz)(e.parentToken);if(null===t)throw Error("无效的输入格式");await ep("0x76F95D4e5e457e6F02909A902b07872BAdd38241",t)}catch(e){console.error("父币授权失败",e),x.Am.error("父币授权失败，请检查输入格式")}}(0,s.useEffect)(()=>{ef&&(ee(!0),x.Am.success("授权".concat(null==p?void 0:p.symbol,"成功")))},[ef]),(0,s.useEffect)(()=>{eh&&(en(!0),x.Am.success("授权".concat(null==p?void 0:p.parentTokenSymbol,"成功")))},[eh]);let[ej,ew]=(0,s.useState)(!1),[ek,eN]=(0,s.useState)(!1),eC=!!U&&U>0,eT=q.watch("parentToken"),eS=q.watch("stakeToken"),eA=(0,u.vz)(eT),eP=(0,u.vz)(eS),{data:eE,error:eO,isLoading:eR}=R(null!==eA?eA:0n,[null==p?void 0:p.parentTokenAddress,null==p?void 0:p.address],p,eC,ej),{data:eD,error:eZ,isLoading:e_}=D(null!==eP?eP:0n,[null==p?void 0:p.parentTokenAddress,null==p?void 0:p.address],p,eC,ek);(0,s.useEffect)(()=>{if(eC&&eE&&eE.length>1){let e=Number((0,u.bM)(BigInt(eE[1]))).toFixed(12).replace(/\.?0+$/,"");q.setValue("stakeToken",e),ew(!1),eN(!1)}},[eE]),(0,s.useEffect)(()=>{if(eC&&eD&&eD.length>1){let e=Number((0,u.bM)(BigInt(eD[0]))).toFixed(12).replace(/\.?0+$/,"");q.setValue("parentToken",e),ew(!1),eN(!1)}},[eD]),(0,s.useEffect)(()=>{eA>0n&&eo&&eo>0n&&eo>=eA?en(!0):en(!1)},[eA,el]),(0,s.useEffect)(()=>{eP>0n&&er&&er>0n&&er>=eP?ee(!0):ee(!1)},[eP,es]);let{stakeLiquidity:eI,isWriting:ez,isConfirming:eB,isConfirmed:eF,writeError:eL}=(0,Z.Xc)();async function eM(e){if(!(0,S.S)(f))return;if(!(K&&et)){x.Am.error("请先完成授权");return}let t=(0,u.vz)(e.stakeToken),n=(0,u.vz)(e.parentToken);if(null===t||null===n){x.Am.error("转换金额时出错，请检查输入格式");return}eI(null==p?void 0:p.address,t,n,BigInt(e.releasePeriod),i).catch(e=>{let t=A(e);x.Am.error(t||"质押失败，请重试"),console.error("Stake failed",e)})}function eV(){x.Am.success("质押成功"),setTimeout(()=>{window.location.href="".concat("/LOVE20-interface","/my/?symbol=").concat(null==p?void 0:p.symbol)},2e3)}(0,s.useEffect)(()=>{eF&&((null==p?void 0:p.initialStakeRound)&&p.initialStakeRound>0?eV():X(!0))},[eF]),(0,s.useEffect)(()=>{W&&!$&&U&&U>0&&(C({...p,initialStakeRound:Number(U)}),eV())},[W,$,U]);let{handleContractError:eG}=(0,l.S)();(0,s.useEffect)(()=>{G&&eG(G,"token"),L&&eG(L,"token"),ei&&eG(ei,"token"),ea&&eG(ea,"token"),em&&eG(em,"stake"),eb&&eG(eb,"stake"),eL&&eG(eL,"stake"),J&&eG(J,"stake"),eO&&eG(eO,"uniswap"),eZ&&eG(eZ,"uniswap"),Y&&eG(Y,"stake")},[G,L,ei,ea,em,eb,eL,J,eO,eZ,Y]);let eW=ed||ey,eX=eu||ex,eU=eW||eX||K&&et;(0,s.useEffect)(()=>{"true"!==z||eU||O({name:"提示：",message:"新部署的代币，需先质押获取治理票，才能后续操作"})},[z,eU,O]),(0,s.useEffect)(()=>{F||B||eU||!p||!p.symbol||O({name:"余额不足",message:"您当前".concat(p.symbol,"数量为0，请先获取").concat(p.symbol)}),V||M||eU||!p||!p.parentTokenSymbol||O({name:"余额不足",message:"您当前".concat(p.parentTokenSymbol,"数量为0，请先获取").concat(p.parentTokenSymbol)})},[B,M,p]),(0,s.useEffect)(()=>{void 0!==H&&H>0&&q.setValue("releasePeriod",String(H))},[H]);let e$=(0,s.useRef)(null),eJ=(0,s.useRef)(es);return((0,s.useEffect)(()=>{if(eJ.current&&!es){var e;null===(e=e$.current)||void 0===e||e.blur()}eJ.current=es},[es]),Q||$)?(0,r.jsx)(c.Z,{}):(0,r.jsxs)("div",{className:"w-full flex-col items-center p-6 pt-2",children:[(0,r.jsx)("div",{className:"w-full flex justify-between items-center",children:(0,r.jsx)(_.Z,{title:"质押获取治理票"})}),(0,r.jsx)(j.l0,{...q,children:(0,r.jsxs)("form",{onSubmit:q.handleSubmit(eM),className:"w-full max-w-md mt-4 space-y-4",children:[(0,r.jsx)(j.Wi,{control:q.control,name:"parentToken",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsx)(j.lX,{children:"质押父币数"}),(0,r.jsx)(j.NI,{children:(0,r.jsx)(k.I,{type:"number",placeholder:"输入 ".concat(null==p?void 0:p.parentTokenSymbol," 数量"),...t,disabled:eU,onChange:e=>{t.onChange(e),ew(!0)},className:"!ring-secondary-foreground"})}),(0,r.jsx)(j.zG,{}),(0,r.jsxs)(j.pf,{className:"flex justify-between items-center",children:[(0,r.jsxs)("span",{children:["持有 ",(0,r.jsx)("span",{className:"text-secondary-400 mr-2",children:(0,u.LH)(M||0n)}),null==p?void 0:p.parentTokenSymbol]}),(0,r.jsxs)(T(),{href:"/dex/deposit/",className:"text-secondary-400 ml-2",children:["去获取 ",null==p?void 0:p.parentTokenSymbol]})]})]})}}),(0,r.jsx)(j.Wi,{control:q.control,name:"stakeToken",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsx)(j.lX,{children:"质押 token 数"}),(0,r.jsx)(j.NI,{children:(0,r.jsx)(k.I,{type:"number",placeholder:"输入 ".concat(null==p?void 0:p.symbol," 数量"),...t,disabled:eU,onChange:e=>{t.onChange(e),eN(!0)},className:"!ring-secondary-foreground"})}),(0,r.jsx)(j.zG,{}),(0,r.jsxs)(j.pf,{className:"flex justify-between items-center",children:[(0,r.jsxs)("span",{children:["持有 ",(0,r.jsx)("span",{className:"text-secondary-400 mr-2",children:(0,u.LH)(B||0n)}),null==p?void 0:p.symbol]}),(0,r.jsxs)(T(),{href:"/dex/swap/",className:"text-secondary-400",children:["去获取",null==p?void 0:p.symbol]})]})]})}}),(0,r.jsx)(j.Wi,{control:q.control,name:"releasePeriod",render:e=>{let{field:t}=e;return(0,r.jsxs)(j.xJ,{children:[(0,r.jsx)(j.lX,{children:"释放期"}),(0,r.jsx)(j.NI,{children:(0,r.jsxs)(w.Ph,{disabled:eU,onValueChange:e=>t.onChange(e),value:t.value,children:[(0,r.jsx)(w.i4,{className:"w-full !ring-secondary-foreground",children:(0,r.jsx)(w.ki,{placeholder:"选择释放期"})}),(0,r.jsx)(w.Bw,{children:Array.from({length:9},(e,t)=>t+4).filter(e=>e>=H).map(e=>(0,r.jsx)(w.Ql,{value:String(e),children:e},e))})]})}),(0,r.jsx)(j.pf,{children:"释放期：申请解锁后，几轮之后可以领取。"}),(0,r.jsx)(j.zG,{})]})}}),(0,r.jsxs)("div",{className:"flex justify-center space-x-2 mt-4",children:[(0,r.jsx)(v.z,{type:"button",className:"w-1/3",ref:e$,disabled:es||ed||eu||K,onClick:q.handleSubmit(eg),children:es?(0,r.jsx)(N.Z,{className:"animate-spin"}):ed?"1.提交中...":eu?"1.确认中...":K?"1.".concat(null==p?void 0:p.symbol,"已授权"):"1.授权".concat(null==p?void 0:p.symbol)}),(0,r.jsx)(v.z,{type:"button",className:"w-1/3",disabled:!K||el||ey||ex||et,onClick:q.handleSubmit(ev),children:el?(0,r.jsx)(N.Z,{className:"animate-spin"}):ey?"2.提交中...":ex?"2.确认中...":et?"2.".concat(null==p?void 0:p.parentTokenSymbol,"已授权"):"2.授权".concat(null==p?void 0:p.parentTokenSymbol)}),(0,r.jsx)(v.z,{type:"submit",className:"w-1/3",disabled:!K||!et||ez||eB||eF,children:ez?"3.质押中...":eB?"3.确认中...":eF?"3.已质押":"3.质押"})]})]})}),(0,r.jsx)(I.Z,{isLoading:eW||eX||ez||eB||$&&W,text:eW||ez?"提交交易...":"确认交易..."})]})},B=()=>{let{token:e}=(0,s.useContext)(a.M)||{},t=!!(null==e?void 0:e.initialStakeRound)&&(null==e?void 0:e.initialStakeRound)>0,{tokenAmount:n,isPending:d,error:u}=(0,o.tT)(null==e?void 0:e.slTokenAddress,t),{handleContractError:f}=(0,l.S)();return(0,s.useEffect)(()=>{u&&f(u,"slToken")},[u]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(i.Z,{title:"质押LP"}),(0,r.jsxs)("main",{className:"flex-grow",children:[d&&t&&(0,r.jsx)("div",{className:"flex justify-center items-center mt-10",children:(0,r.jsx)(c.Z,{})}),(0,r.jsx)(p,{}),(!d||!t)&&(0,r.jsx)(z,{stakedTokenAmountOfLP:n||0n}),(0,r.jsxs)("div",{className:"flex flex-col w-full p-4 mt-4",children:[(0,r.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"1、所得治理票数 = LP 数量 * 释放期轮次"}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮。"})]})]})]})}},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var s=l(n(67294)),a=l(n(20640)),o=["text","onCopy","options","children"];function l(e){return e&&e.__esModule?e:{default:e}}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach(function(t){m(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function d(e,t){return(d=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function m(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var p=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&d(e,t)}(i,e);var t,n,l=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(i);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return u(e)}(this,e)});function i(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,i);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return m(u(e=l.call.apply(l,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,o=n.onCopy,l=n.children,i=n.options,c=s.default.Children.only(l),d=(0,a.default)(r,i);o&&o(r,d),c&&c.props&&"function"==typeof c.props.onClick&&c.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,s=function(e,t){if(null==e)return{};var n,r,s={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}(e,o),r=s.default.Children.only(t);return s.default.cloneElement(r,c(c({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(i.prototype,n),Object.defineProperty(i,"prototype",{writable:!1}),i}(s.default.PureComponent);t.CopyToClipboard=p,m(p,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}}},function(e){e.O(0,[1664,2624,2209,7569,8977,7380,5263,7224,2888,9774,179],function(){return e(e.s=52340)}),_N_E=e.O()}]);