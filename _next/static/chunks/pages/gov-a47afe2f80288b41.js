(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6700],{54889:function(e,s,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov",function(){return t(7263)}])},27460:function(e,s,t){"use strict";var l=t(85893),n=t(86501),r=t(74855),a=t(45356),c=t(91529);s.Z=e=>{let{address:s,showCopyButton:t=!0}=e;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)("span",{className:"text-xs text-gray-500",children:(0,c.Vu)(s)}),t&&(0,l.jsx)(r.CopyToClipboard,{text:s,onCopy:(e,s)=>{s?n.ZP.success("复制成功"):n.ZP.error("复制失败")},children:(0,l.jsx)("button",{className:"",onClick:e=>{e.preventDefault(),e.stopPropagation()},children:(0,l.jsx)(a.Z,{className:"h-4 w-4 text-xs text-gray-500"})})})]})}},74089:function(e,s,t){"use strict";var l=t(85893),n=t(67294),r=t(91529);s.Z=e=>{let{initialTimeLeft:s}=e,[t,a]=(0,n.useState)(s),c=(0,n.useRef)(null),x=(0,n.useRef)(!1);(0,n.useEffect)(()=>(x.current=!0,s<=0)?void 0:(a(s),c.current&&clearInterval(c.current),c.current=setInterval(()=>{x.current&&a(e=>e<=1?(clearInterval(c.current),console.log("1.prevTime",e),0):(console.log("2.prevTime",e),e-1))},1e3),()=>{x.current=!1,c.current&&clearInterval(c.current)}),[s]);let i=(0,r.ZC)(t);return(0,l.jsx)(l.Fragment,{children:i})}},7191:function(e,s,t){"use strict";var l=t(85893);t(67294);var n=t(3125),r=t(74089);s.Z=e=>{let{currentRound:s,roundName:t}=e,{data:a}=(0,n.O)(),c=Number("100")||0,x=Number("12")||0,i=a?c-Number(a)%c:0;return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsxs)("h1",{className:"text-base text-center font-bold",children:[t,"（第 ",(0,l.jsx)("span",{className:"text-red-500",children:Number(null!=s?s:0n)})," 轮）"]}),(0,l.jsxs)("span",{className:"text-sm text-gray-400 mt-1 pt-0",children:["本轮剩余：",(0,l.jsx)(r.Z,{initialTimeLeft:i>0?i*x:0})]})]})}},18308:function(e,s,t){"use strict";var l=t(85893),n=t(67294),r=t(92321),a=t(41664),c=t.n(a),x=t(7080),i=t(87250),d=t(93778),o=t(91529),m=t(91318),u=t(7191);s.Z=e=>{let{currentRound:s,showBtn:t=!0}=e,{token:a}=(0,n.useContext)(d.M)||{},{address:j}=(0,r.m)(),{votesNumByAccount:f,isPending:h,error:N}=(0,x.VI)(null==a?void 0:a.address,s,j||""),{scoreByVerifier:g,isPending:v,error:b}=(0,i.w3)(null==a?void 0:a.address,s,j||""),p=h||v?BigInt(0):f-g;return(0,l.jsxs)("div",{className:"flex flex-col items-center bg-white py-4",children:[(0,l.jsx)(u.Z,{currentRound:s,roundName:"验证轮"}),(0,l.jsxs)("div",{className:"flex w-full justify-center space-x-20 my-4",children:[(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投验证票"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:v?(0,l.jsx)(m.Z,{}):(0,o.LH)(g||BigInt(0))})]}),(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余验证票"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:h||v?(0,l.jsx)(m.Z,{}):(0,o.LH)(p)})]})]}),t&&(h||v?(0,l.jsx)(m.Z,{}):f>g?(0,l.jsx)(c(),{href:"/verify",className:"btn-primary btn w-1/2",children:"去验证"}):(0,l.jsx)("span",{className:"text-gray-500 text-sm",children:"无剩余验证票"}))]})}},68789:function(e,s,t){"use strict";var l=t(85893),n=t(67294),r=t(41664),a=t.n(r),c=t(27460),x=t(93778);s.Z=e=>{let{showGovernanceLink:s=!1}=e,t=(0,n.useContext)(x.M);if(!t||!t.token)return(0,l.jsx)("div",{className:"text-center text-error",children:"Token information is not available."});let{token:r}=t;return(0,l.jsxs)("div",{className:"flex items-center mb-4",children:[(0,l.jsx)("div",{className:"mr-2",children:(0,l.jsxs)("div",{className:"flex items-center",children:[(0,l.jsx)("span",{className:"font-bold text-2xl text-yellow-500",children:"$"}),(0,l.jsx)("span",{className:"font-bold text-2xl mr-2",children:r.symbol}),(0,l.jsx)(c.Z,{address:r.address})]})}),s&&(0,l.jsx)(a(),{href:"/gov",className:"text-blue-400 text-sm hover:underline ml-auto",children:"参与治理>>"})]})}},7263:function(e,s,t){"use strict";t.r(s),t.d(s,{default:function(){return w}});var l=t(85893),n=t(35337),r=t(7080),a=t(67294),c=t(92180),x=t(77156),i=t(93778),d=t(91529),o=t(68789),m=t(18303),u=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{govVotesNum:s,isPending:t}=(0,c.kc)(null==e?void 0:e.address),{totalSupply:n,isPending:r}=(0,x.A5)(null==e?void 0:e.stTokenAddress);return(0,l.jsxs)("div",{className:"p-6 bg-white ",children:[(0,l.jsx)(o.Z,{}),(0,l.jsxs)("div",{className:"flex w-full justify-center space-x-20 mb-4",children:[(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"总治理票"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:t?"Loading...":(0,d.LH)(s||BigInt(0))})]}),(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"代币质押量"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:r?"Loading...":(0,d.LH)(n||BigInt(0))})]})]}),(0,l.jsx)("div",{className:"w-full flex flex-col items-center space-y-4 bg-gray-100 rounded p-4",children:(0,l.jsx)(m.Z,{})})]})},j=t(92321),f=t(91318),h=t(41664),N=t.n(h),g=t(27245),v=()=>{let{token:e}=(0,a.useContext)(i.M)||{},{address:s}=(0,j.m)(),{govVotes:t,stAmount:n,isPending:r,error:x}=(0,c.L)((null==e?void 0:e.address)||"",s||"");return(0,l.jsxs)("div",{className:"flex flex-col items-center space-y-4 p-6 bg-white  mt-4",children:[(0,l.jsxs)("div",{className:"flex w-full justify-center space-x-20",children:[(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的治理票数"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:r?(0,l.jsx)(f.Z,{}):(0,d.LH)(t||BigInt(0))})]}),(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的质押数"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:r?(0,l.jsx)(f.Z,{}):(0,d.LH)(n||BigInt(0))})]})]}),(0,l.jsx)(N(),{href:"/gov/stake",className:"w-1/2",children:(0,l.jsx)(g.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去质押"})})]})},b=t(7191),p=e=>{let{currentRound:s}=e,{token:t}=(0,a.useContext)(i.M)||{},{address:n}=(0,j.m)(),{validGovVotes:x,isPending:o}=(0,c.Ty)((null==t?void 0:t.address)||"",n||""),{votesNumByAccount:m,isPending:u}=(0,r.VI)((null==t?void 0:t.address)||"",s,n||"");return console.log("validGovVotes",x),console.log("votesNumByAccount",m),(0,l.jsxs)("div",{className:"flex flex-col items-center p-6 bg-white mt-4 mb-4",children:[(0,l.jsx)(b.Z,{currentRound:s,roundName:"投票轮"}),(0,l.jsxs)("div",{className:"flex w-full justify-center space-x-20 my-4",children:[(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的已投票数"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:u?(0,l.jsx)(f.Z,{}):(0,d.LH)(m||BigInt(0))})]}),(0,l.jsxs)("div",{className:"flex flex-col items-center",children:[(0,l.jsx)("span",{className:"text-sm text-gray-500",children:"我的剩余票数"}),(0,l.jsx)("span",{className:"text-2xl font-bold text-orange-400",children:o||u?(0,l.jsx)(f.Z,{}):(0,d.LH)(x-m||BigInt(0))})]})]}),o||u?(0,l.jsx)(f.Z,{}):x>m?(0,l.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,l.jsx)(N(),{href:"/vote/actions4submit",children:(0,l.jsx)(g.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去推举"})}),(0,l.jsx)(N(),{href:"/vote",children:(0,l.jsx)(g.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去投票"})})]}):(0,l.jsxs)("div",{className:"flex justify-center space-x-6",children:[(0,l.jsx)(N(),{href:"/vote/actions4submit",children:(0,l.jsx)(g.z,{className:"w-full bg-blue-600 hover:bg-blue-700",children:"去推举"})}),(0,l.jsx)(g.z,{className:"w-1/2 bg-gray-400 cursor-not-allowed",children:"去投票"})]})]})},y=t(18308),w=()=>{let{currentRound:e}=(0,r.Bk)();return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(n.Z,{title:"治理首页"}),(0,l.jsxs)("main",{className:"flex-grow",children:[(0,l.jsx)(u,{}),(0,l.jsx)(v,{}),(0,l.jsx)(p,{currentRound:e}),(0,l.jsx)(y.Z,{currentRound:e>2?e-2n:0n})]})]})}}},function(e){e.O(0,[4784,8424,5608,7080,765,7250,7716,2888,9774,179],function(){return e(e.s=54889)}),_N_E=e.O()}]);