(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[7809],{51906:function(e,s,l){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/staketoken",function(){return l(10703)}])},10703:function(e,s,l){"use strict";l.r(s),l.d(s,{default:function(){return A}});var n=l(85893),r=l(67294),t=l(92321),a=l(93778),i=l(19638),o=l(67068),c=l(7224),d=l(37436),m=l(42083),u=l(86501),x=l(56312),f=l(87536),h=l(1604),j=l(76929),g=l(21774),v=l(27245),k=l(88659),N=l(48105),y=l(91529),b=l(92180),w=l(64777),p=l(44576),C=e=>{let{tokenBalance:s}=e,{address:l,chain:c}=(0,t.m)(),{token:d}=(0,r.useContext)(a.M)||{},{approve:m,isWriting:C,isConfirming:A,isConfirmed:E,writeError:_}=(0,i.yA)(null==d?void 0:d.address),{stakeToken:T,isWriting:z,isConfirming:S,isConfirmed:P,writeError:I}=(0,b.aE)(),W=(0,f.cI)({resolver:(0,x.F)(h.z.object({stakeTokenAmount:h.z.string().refine(e=>""!==e.trim(),{message:"请输入质押数量"}).refine(e=>Number(e)>0,{message:"质押代币数不能为0"}).refine(e=>(0,y.vz)(e)<=s,{message:"质押代币数不能大于持有代币数"}),releasePeriod:h.z.string().default("4")})),defaultValues:{stakeTokenAmount:"",releasePeriod:"4"},mode:"onChange"}),X=async e=>{if((0,N.S)(c))try{await m("0xad07a574eeC41371b3618Cd5896E0F1A108e7942",(0,y.vz)(e.stakeTokenAmount))}catch(e){u.Am.error((null==e?void 0:e.message)||"授权失败"),console.error("Approve failed",e)}};(0,r.useEffect)(()=>{E&&u.Am.success("授权成功")},[E]);let Z=async e=>{if((0,N.S)(c))try{await T(null==d?void 0:d.address,(0,y.vz)(e.stakeTokenAmount),BigInt(e.releasePeriod),l)}catch(e){console.error("Stake failed",e)}};(0,r.useEffect)(()=>{P&&(u.Am.success("质押成功"),W.reset(),setTimeout(()=>{window.location.href="/gov?symbol=".concat(null==d?void 0:d.symbol)},2e3))},[P,W,null==d?void 0:d.symbol]);let{handleContractError:B}=(0,o.S)();return(0,r.useEffect)(()=>{I&&B(I,"stake"),_&&B(_,"token")},[I,_,B]),(0,n.jsxs)("div",{className:"w-full flex flex-col items-center p-6 mt-1",children:[(0,n.jsx)("div",{className:"w-full text-left mb-4",children:(0,n.jsx)(w.Z,{title:"质押增加治理收益"})}),(0,n.jsx)(j.l0,{...W,children:(0,n.jsxs)("form",{onSubmit:e=>e.preventDefault(),className:"w-full max-w-md space-y-4",children:[(0,n.jsx)(j.Wi,{control:W.control,name:"stakeTokenAmount",render:e=>{let{field:l}=e;return(0,n.jsxs)(j.xJ,{children:[(0,n.jsxs)(j.lX,{className:"text-sm text-greyscale-500",children:["质押数 (当前持有数量：",(0,n.jsxs)("span",{className:"text-secondary",children:[(0,y.LH)(s)," ",null==d?void 0:d.symbol]}),")"]}),(0,n.jsx)(j.NI,{children:(0,n.jsx)(g.I,{type:"number",placeholder:"输入 ".concat(null==d?void 0:d.symbol," 数量"),className:"!ring-secondary-foreground",...l})}),(0,n.jsx)(j.pf,{}),(0,n.jsx)(j.zG,{})]})}}),(0,n.jsx)(j.Wi,{control:W.control,name:"releasePeriod",render:e=>{let{field:s}=e;return(0,n.jsxs)(j.xJ,{children:[(0,n.jsx)(j.lX,{className:"text-sm text-greyscale-500",children:"释放期"}),(0,n.jsx)(j.NI,{children:(0,n.jsxs)(k.Ph,{value:s.value,onValueChange:e=>s.onChange(e),children:[(0,n.jsx)(k.i4,{className:"w-full !ring-secondary-foreground",children:(0,n.jsx)(k.ki,{placeholder:"请选择释放期"})}),(0,n.jsx)(k.Bw,{children:Array.from({length:9},(e,s)=>s+4).map(e=>(0,n.jsx)(k.Ql,{value:e.toString(),children:e},e))})]})}),(0,n.jsx)(j.pf,{}),(0,n.jsx)(j.zG,{})]})}}),(0,n.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,n.jsx)(v.z,{className:"w-1/2",disabled:C||A||E,onClick:()=>W.handleSubmit(X)(),children:C?"1.授权中...":A?"1.确认中...":E?"1.已授权":"1.授权"}),(0,n.jsx)(v.z,{className:"w-1/2",disabled:!E||z||S||P,onClick:()=>W.handleSubmit(Z)(),children:z?"2.质押中...":S?"2.确认中...":P?"2.已质押":"2.质押"})]})]})}),(0,n.jsx)(p.Z,{isLoading:C||A||z||S,text:C||z?"提交交易...":"确认交易..."})]})},A=()=>{let{token:e}=(0,r.useContext)(a.M)||{},{address:s}=(0,t.m)(),{balance:l}=(0,i.hS)(null==e?void 0:e.address,s),{tokenAmount:u,isPending:x,error:f}=(0,c.tT)(null==e?void 0:e.slTokenAddress),{handleContractError:h}=(0,o.S)();return(0,r.useEffect)(()=>{f&&h(f,"slToken")},[f]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(d.Z,{title:"质押代币"}),(0,n.jsxs)("main",{className:"flex-grow",children:[x&&(0,n.jsx)(m.Z,{}),!x&&!u&&(0,n.jsx)("div",{className:"flex justify-center items-center mt-10",children:"需要先质押流动性LP，才可以质押代币"}),u&&(0,n.jsx)(C,{tokenBalance:l||0n}),(0,n.jsxs)("div",{className:"flex flex-col w-full p-6 mt-4",children:[(0,n.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,n.jsx)("div",{className:"text-sm text-greyscale-500 mb-2",children:"1、单独质押代币可获得激励提升（最高不超过 2 倍的验证激励），同时获得 st类代币作为质押的凭证；"}),(0,n.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、释放期指：申请解锁后，几轮之后可以领取。最小为4轮，最大为12轮；"})]})]})]})}}},function(e){e.O(0,[2624,7569,4637,5263,7224,5343,2888,9774,179],function(){return e(e.s=51906)}),_N_E=e.O()}]);