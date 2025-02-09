(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7809],{51906:function(e,s,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/staketoken",function(){return n(27614)}])},27460:function(e,s,n){"use strict";var l=n(85893),t=n(67294),r=n(74855),a=n(78865),c=n(18289),i=n(86501),o=n(91529);s.Z=e=>{let{address:s,showCopyButton:n=!0,showAddress:d=!0,colorClassName:x=""}=e,[m,u]=(0,t.useState)(!1);return(0,l.jsxs)("span",{className:"flex items-center space-x-2",children:[d&&(0,l.jsx)("span",{className:"text-xs ".concat(null!=x?x:"text-greyscale-500"),children:(0,o.Vu)(s)}),n&&(0,l.jsx)(r.CopyToClipboard,{text:s,onCopy:(e,s)=>{s?u(!0):i.ZP.error("复制失败")},children:(0,l.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:m?(0,l.jsx)(a.Z,{className:"h-4 w-4 ".concat(null!=x?x:"text-greyscale-500")}):(0,l.jsx)(c.Z,{className:"h-4 w-4 ".concat(null!=x?x:"text-greyscale-500")})})})]})}},27614:function(e,s,n){"use strict";n.r(s),n.d(s,{default:function(){return Z}});var l=n(85893),t=n(67294),r=n(92321),a=n(93778),c=n(19638),i=n(67068),o=n(7224),d=n(37436),x=n(42083),m=n(86501),u=n(56312),f=n(87536),h=n(1604),j=n(76929),v=n(21774),g=n(27245),b=n(88659),y=n(23432),p=n(48105),N=n(91529),k=n(92180),w=n(64777),C=n(44576),A=e=>{let{tokenBalance:s}=e,{address:n,chain:o}=(0,r.m)(),{token:d}=(0,t.useContext)(a.M)||{},[x,A]=(0,t.useState)(!1),{approve:E,isWriting:T,isConfirming:S,isConfirmed:P,writeError:Z}=(0,c.yA)(null==d?void 0:d.address),{stakeToken:_,isWriting:z,isConfirming:F,isConfirmed:L,writeError:B}=(0,k.aE)(),{promisedWaitingRounds:D,isPending:I,error:V}=(0,k.L)(null==d?void 0:d.address,n),{allowance:W,isPending:X,error:G}=(0,c.yG)(null==d?void 0:d.address,n,"0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc"),M=(0,t.useRef)(null),O=(0,t.useRef)(X);(0,t.useEffect)(()=>{if(O.current&&!X){var e;null===(e=M.current)||void 0===e||e.blur()}O.current=X},[X]);let H=(0,f.cI)({resolver:(0,u.F)(h.z.object({stakeTokenAmount:h.z.string().refine(e=>""!==e.trim(),{message:"请输入质押数量"}).refine(e=>Number(e)>0,{message:"质押代币数不能为0"}).refine(e=>(0,N.vz)(e)<=s,{message:"质押代币数不能大于持有代币数"}),releasePeriod:h.z.string().default("4")})),defaultValues:{stakeTokenAmount:"",releasePeriod:"4"},mode:"onChange"}),J=async e=>{if((0,p.S)(o))try{await E("0x6F41E0C52501Ec0333f6eb8C7Fb7142e1b3B8DAc",(0,N.vz)(e.stakeTokenAmount))}catch(e){m.Am.error((null==e?void 0:e.message)||"授权失败"),console.error("Approve failed",e)}};(0,t.useEffect)(()=>{P&&(A(!0),m.Am.success("授权".concat(null==d?void 0:d.symbol,"成功")))},[P,null==d?void 0:d.symbol]);let R=async e=>{if((0,p.S)(o))try{await _(null==d?void 0:d.address,(0,N.vz)(e.stakeTokenAmount),BigInt(e.releasePeriod),n)}catch(e){console.error("Stake failed",e)}};(0,t.useEffect)(()=>{L&&(m.Am.success("质押成功"),H.reset(),setTimeout(()=>{window.location.href="".concat("/LOVE20-interface","/gov?symbol=").concat(null==d?void 0:d.symbol)},2e3))},[L,H,null==d?void 0:d.symbol]),(0,t.useEffect)(()=>{void 0!==D&&D>0&&H.setValue("releasePeriod",String(D))},[D]);let Q=H.watch("stakeTokenAmount");(0,t.useEffect)(()=>{let e=0n;try{e=(0,N.vz)(Q||"0")}catch(s){e=0n}e>0n&&W&&W>0n&&W>=e?A(!0):A(!1)},[Q,W,X]);let{handleContractError:q}=(0,i.S)();return(0,t.useEffect)(()=>{B&&q(B,"stake"),Z&&q(Z,"token"),G&&q(G,"token")},[B,Z,G]),(0,l.jsxs)("div",{className:"w-full flex flex-col items-center pt-0 p-6",children:[(0,l.jsx)("div",{className:"w-full text-left mb-4",children:(0,l.jsx)(w.Z,{title:"质押增加治理收益"})}),(0,l.jsx)(j.l0,{...H,children:(0,l.jsxs)("form",{onSubmit:e=>e.preventDefault(),className:"w-full max-w-md space-y-4",children:[(0,l.jsx)(j.Wi,{control:H.control,name:"stakeTokenAmount",render:e=>{let{field:n}=e;return(0,l.jsxs)(j.xJ,{children:[(0,l.jsxs)(j.lX,{className:"text-sm text-greyscale-500",children:["质押数 (当前持有数量：",(0,l.jsxs)("span",{className:"text-secondary",children:[(0,N.LH)(s)," ",null==d?void 0:d.symbol]}),")"]}),(0,l.jsx)(j.NI,{children:(0,l.jsx)(v.I,{type:"number",placeholder:"输入 ".concat(null==d?void 0:d.symbol," 数量"),className:"!ring-secondary-foreground",...n})}),(0,l.jsx)(j.pf,{}),(0,l.jsx)(j.zG,{})]})}}),(0,l.jsx)(j.Wi,{control:H.control,name:"releasePeriod",render:e=>{let{field:s}=e;return(0,l.jsxs)(j.xJ,{children:[(0,l.jsx)(j.lX,{children:"释放期"}),(0,l.jsx)(j.NI,{children:(0,l.jsxs)(b.Ph,{onValueChange:e=>s.onChange(e),value:s.value,children:[(0,l.jsx)(b.i4,{className:"w-full !ring-secondary-foreground",children:(0,l.jsx)(b.ki,{placeholder:"选择释放期"})}),(0,l.jsx)(b.Bw,{children:Array.from({length:9},(e,s)=>s+4).filter(e=>e>=D).map(e=>(0,l.jsx)(b.Ql,{value:String(e),children:e},e))})]})}),(0,l.jsx)(j.pf,{children:"释放期：申请解锁后，几轮之后可以领取。"}),(0,l.jsx)(j.zG,{})]})}}),(0,l.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,l.jsx)(g.z,{ref:M,className:"w-1/2",disabled:X||T||S||x,onClick:()=>H.handleSubmit(J)(),children:X?(0,l.jsx)(y.Z,{className:"animate-spin h-4 w-4"}):T?"1.授权中...":S?"1.确认中...":x?"1.".concat(null==d?void 0:d.symbol,"已授权"):"1.授权".concat(null==d?void 0:d.symbol)}),(0,l.jsx)(g.z,{className:"w-1/2",disabled:!x||z||F||L,onClick:()=>H.handleSubmit(R)(),children:z?"2.质押中...":F?"2.确认中...":L?"2.已质押":"2.质押"})]})]})}),(0,l.jsx)(C.Z,{isLoading:T||S||z||F,text:T||z?"提交交易...":"确认交易..."})]})},E=n(77156),T=n(27460),S=n(34426);function P(){let{token:e}=(0,t.useContext)(a.M)||{},{address:s}=(0,r.m)(),{balance:n,isPending:c,error:o}=(0,E.hS)((null==e?void 0:e.stTokenAddress)||"",s||"0x0"),{handleContractError:d}=(0,i.S)();return((0,t.useEffect)(()=>{o&&d(o,"token")},[o]),null==e?void 0:e.stTokenAddress)?(0,l.jsx)("div",{className:"px-4 pt-0 pb-6",children:(0,l.jsxs)("div",{className:"bg-gray-100 rounded-lg p-4 text-sm mt-4",children:[(0,l.jsx)("div",{className:"flex items-center",children:(0,l.jsx)("div",{className:"mr-2",children:(0,l.jsxs)("div",{className:"flex items-center",children:[(0,l.jsxs)("span",{className:"font-bold text-2xl mr-2",children:["st",e.symbol]}),(0,l.jsx)(T.Z,{address:e.stTokenAddress}),(0,l.jsx)(S.Z,{tokenAddress:e.stTokenAddress,tokenSymbol:e.symbol||"",tokenDecimals:e.decimals||0})]})})}),(0,l.jsxs)("div",{className:"mt-1 flex items-center",children:[(0,l.jsx)("span",{className:"text-sm text-greyscale-500 mr-1",children:"我持有:"}),(0,l.jsx)("span",{className:"text-sm text-secondary",children:c?(0,l.jsx)(x.Z,{}):(0,N.LH)(n||0n)})]})]})}):(0,l.jsx)(x.Z,{})}var Z=()=>{let{token:e}=(0,t.useContext)(a.M)||{},{address:s}=(0,r.m)(),{balance:n}=(0,c.hS)(null==e?void 0:e.address,s),{tokenAmount:m,isPending:u,error:f}=(0,o.tT)(null==e?void 0:e.slTokenAddress),{handleContractError:h}=(0,i.S)();return(0,t.useEffect)(()=>{f&&h(f,"slToken")},[f]),(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(d.Z,{title:"质押代币"}),(0,l.jsxs)("main",{className:"flex-grow",children:[u&&(0,l.jsx)(x.Z,{}),!u&&!m&&(0,l.jsx)("div",{className:"flex justify-center items-center mt-10",children:"需要先质押流动性LP，才可以质押代币"}),m&&(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(P,{}),(0,l.jsx)(A,{tokenBalance:n||0n})]}),(0,l.jsxs)("div",{className:"flex flex-col w-full p-6 mt-4",children:[(0,l.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,l.jsx)("div",{className:"text-sm text-greyscale-500 mb-2",children:"1、单独质押代币可获得激励提升（最高不超过 2 倍的验证激励），同时获得 st类代币作为质押的凭证；"}),(0,l.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮；"})]})]})]})}}},function(e){e.O(0,[2624,2209,7569,4637,5263,7224,5343,4090,2888,9774,179],function(){return e(e.s=51906)}),_N_E=e.O()}]);