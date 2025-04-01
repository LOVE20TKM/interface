(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3064],{37985:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/tokens",function(){return n(92929)}])},34680:function(e,t,n){"use strict";n.d(t,{Ol:function(){return o},SZ:function(){return u},Zb:function(){return i},aY:function(){return c},eW:function(){return d},ll:function(){return l}});var r=n(85893),s=n(67294),a=n(40108);let i=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",n),...s})});i.displayName="Card";let o=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("flex flex-col space-y-1.5 p-6",n),...s})});o.displayName="CardHeader";let l=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("text-2xl font-semibold leading-none tracking-tight",n),...s})});l.displayName="CardTitle";let u=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("text-sm text-muted-foreground",n),...s})});u.displayName="CardDescription";let c=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("p-6 pt-0",n),...s})});c.displayName="CardContent";let d=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("flex items-center p-6 pt-0",n),...s})});d.displayName="CardFooter"},4307:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]])},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},42083:function(e,t,n){"use strict";var r=n(85893),s=n(23432);t.Z=()=>(0,r.jsx)(s.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},37436:function(e,t,n){"use strict";n.d(t,{Z:function(){return p}});var r=n(85893),s=n(9008),a=n.n(s),i=n(67294),o=n(3294),l=n(68655),u=n(12003),c=n(40108);let d=(0,u.j)("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),f=i.forwardRef((e,t)=>{let{className:n,variant:s,...a}=e;return(0,r.jsx)("div",{ref:t,role:"alert",className:(0,c.cn)(d({variant:s}),n),...a})});f.displayName="Alert";let m=i.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("h5",{ref:t,className:(0,c.cn)("mb-1 font-medium leading-none tracking-tight",n),...s})});m.displayName="AlertTitle";let x=i.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-sm [&_p]:leading-relaxed",n),...s})});x.displayName="AlertDescription";var h=n(95049);let N=()=>{let{error:e,setError:t}=(0,h.V)(),[n,s]=(0,i.useState)(!1);return((0,i.useEffect)(()=>{e&&s(!0)},[e,t]),n&&e)?(0,r.jsxs)(f,{variant:"destructive",children:[(0,r.jsx)(l.Z,{className:"h-4 w-4"}),(0,r.jsx)(m,{children:e.name}),(0,r.jsx)(x,{children:e.message})]}):null};var g=n(5884),v=n(92321),p=e=>{let{title:t}=e,{address:n,chain:s}=(0,v.m)(),{setError:l}=(0,h.V)();return(0,i.useEffect)(()=>{n&&!s?l({name:"钱包网络错误",message:"请切换到 ".concat("thinkium801"," 网络")}):l(null)},[n,s]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(a(),{children:[(0,r.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,r.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,r.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,r.jsx)(g.vP,{className:"-ml-1"}),(0,r.jsx)(o.NL,{})]}),(0,r.jsx)("div",{className:"px-4",children:(0,r.jsx)(N,{})})]})}},67068:function(e,t,n){"use strict";n.d(t,{S:function(){return i}});let r={launch:{AlreadyInitialized:"已初始化，无需再次初始化",InvalidTokenSymbol:"无效的代币符号",TokenSymbolExists:"代币符号已存在",NotEligibleToDeployToken:"不符合部署代币的条件",LaunchAlreadyEnded:"公平发射已结束，无法进行操作",LaunchNotEnded:"公平发射未结束，无法进行操作",NoContribution:"没有申购，无法操作",TokensAlreadyClaimed:"代币已领取，请勿重复领取",LaunchAlreadyExists:"公平发射已存在",ParentTokenNotSet:"父代币未设置",ZeroContribution:"申购数量不能为0",InvalidParentToken:"无效的父代币"},join:{AlreadyInitialized:"已初始化",AmountIsZero:"数量不能为0",AddressCannotBeZero:"地址不能为空",CannotGenerateAtCurrentRound:"不能在当前轮次生成",LastBlocksOfPhaseCannotJoin:"每轮最后".concat("1","个区块不能加入"),ActionNotVoted:"该行动本轮没有投票",InvalidToAddress:"目标地址无效",JoinedAmountIsZero:"加入数量为0",NotInWhiteList:"该地址不在白名单",JoinAmountExceedsMaxStake:"加入数量超过最大质押数量"},mint:{NoRewardAvailable:"没有奖励可用",RoundStartMustBeLessOrEqualToRoundEnd:"轮次开始必须小于或等于轮次结束",NotEnoughReward:"奖励不足，无法铸造",NotEnoughRewardToBurn:"奖励不足，无法销毁"},stake:{NotAllowedToStakeAtRoundZero:"不允许在0轮进行质押",InvalidToAddress:"无效的接收地址",StakeAmountMustBeSet:"质押数量必须大于0",ReleaseAlreadyRequested:"已请求释放",ReleaseNotRequested:"未请求释放",PromisedWaitingRoundsOutOfRange:"承诺等待的轮次超出范围",PromisedWaitingRoundsMustBeGreaterOrEqualThanBefore:"承诺等待的轮次必须大于或等于之前的轮次",NoStakedLiquidity:"无质押的流动性",NoStakedLiquidityOrToken:"没有质押的流动性或代币",AlreadyUnstaked:"已解除质押，无需再次解除",UnableToUnstakeAtRoundZero:"无法在第0轮解除质押",NotEnoughWaitingPhases:"等待阶段数量不足",NotEnoughWaitingBlocks:"等待区块数量不足",RoundHasNotStartedYet:"轮次尚未开始",TokenAmountNotEnough:"代币数量不足","transfer amount exceeds balance":"转账数量超过余额"},submit:{CannotSubmitAction:"您没有权限提交提案，请先质押获取足够代理票数",ActionIdNotExist:"提案ID不存在",StartGreaterThanEnd:"开始时间大于结束时间",MaxStakeZero:"最大质押数量必须大于0",MaxRandomAccountsZero:"最大随机账户数量必须大于0",AlreadySubmitted:"该提案已提交，请勿重复提交",OnlyOneSubmitPerRound:"每个轮次，1个地址只能提交1个行动"},token:{AlreadyInitialized:"已初始化",InvalidAddress:"无效的地址",NotEligibleToMint:"不符合铸造代币的条件",ExceedsMaxSupply:"超过最大供应量",InsufficientBalance:"余额不足",InvalidSupply:"无效的供应量"},slToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",InsufficientLiquidity:"流动性不足",TotalLpExceedsBalance:"总LP数量超过余额"},stToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁"},verify:{AlreadyVerified:"已验证，不能重复验证",AddressCannotBeZero:"地址不能为空",ScoresAndAccountsLengthMismatch:"分数和地址数量不匹配",ScoresExceedVotesNum:"分数超过投票数量",ScoresMustIncrease:"验证得分必须增加"},vote:{InvalidActionIds:"无效的提案ID",CannotVote:"没有权限投票",NotEnoughVotesLeft:"投票数量不足",VotesMustBeGreaterThanZero:"投票数量必须大于0"},uniswapV2Router:{EXPIRED:"交易已过期，请重新交易",INSUFFICIENT_A_AMOUNT:"A代币数量不足，请调整输入数量",INSUFFICIENT_B_AMOUNT:"B代币数量不足，请调整输入数量",INSUFFICIENT_OUTPUT_AMOUNT:"目标代币数量不足，请调整输入数量",EXCESSIVE_INPUT_AMOUNT:"输入数量过多，请调整输入数量",INVALID_PATH:"无效的兑换路径"}};var s=n(95049),a=n(67294);let i=()=>{let{setError:e}=(0,s.V)();return{handleContractError:(0,a.useCallback)((t,n)=>{console.error("context",n),console.error("error",t),e(function(e,t){let n=null!=e?e:"",s=n.match(/(?:([A-Za-z0-9_]+)\()|(?:ERC20:\s*(.+))/),a="";s&&(void 0!=s[1]||void 0!=s[2])&&(s[1]?a=s[1]:s[2]&&(a="".concat(s[2])));let i=r[t];if(i&&i[a])return{name:"交易错误",message:i[a]};let o=n.match(/User denied transaction signature/)?"用户取消了交易":"";if(o)return{name:"交易提示",message:o};let l=function(e){let t=e.split("\n").find(e=>e.trim().startsWith("Error:"));if(t){var n;let e=null===(n=t.split("Error:")[1])||void 0===n?void 0:n.trim();if(e)return e}let r=e.split("\n"),s=r.findIndex(e=>e.includes("the following reason:"));if(-1!==s&&s+1<r.length){let e=r[s+1].trim();if(e)return e}return""}(n);return l?{name:"交易错误",message:l}:{name:"交易错误",message:"交易失败，请稍后刷新重试"}}(t.message,n))},[e])}}},92929:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return g}});var r=n(85893),s=n(37436),a=n(67294),i=n(27245),o=n(4307),l=n(34680),u=n(86501),c=n(11163),d=n(45551),f=n(70019),m=n(67068),x=n(93778),h=n(42083);function N(){let e=(0,c.useRouter)(),{token:t,setToken:n}=(0,a.useContext)(x.M)||{},[s,N]=(0,a.useState)(0n),[g,v]=(0,a.useState)(BigInt(10)),[p,y]=(0,a.useState)([]);(0,a.useEffect)(()=>{y([]),N(0n),v(BigInt(10))},[]);let{tokens:A,isPending:k,error:E}=(0,f.N4)(s,g,!0),{tokens:b,launchInfos:T,isPending:j,error:w}=(0,d.OJ)(A||[]);(0,a.useEffect)(()=>{if(A&&b&&T){let e=b.map((e,n)=>{var r;return{name:e.name,symbol:e.symbol,address:A[n],decimals:Number(e.decimals),parentTokenAddress:T[n].parentTokenAddress,parentTokenSymbol:e.parentTokenSymbol,slTokenAddress:e.slAddress,stTokenAddress:e.stAddress,initialStakeRound:Number(e.initialStakeRound),hasEnded:T[n].hasEnded,voteOriginBlocks:null!==(r=null==t?void 0:t.voteOriginBlocks)&&void 0!==r?r:0}});y(t=>{let n=new Set(t.map(e=>e.symbol));return[...t,...e.filter(e=>!n.has(e.symbol))]})}},[b,T]);let I=(0,a.useCallback)(()=>{!k&&b&&b.length>0&&(N(g),v(g+BigInt(10)))},[k,b,g]),R=function(e,t,n){var r=this,s=(0,a.useRef)(null),i=(0,a.useRef)(0),o=(0,a.useRef)(null),l=(0,a.useRef)([]),u=(0,a.useRef)(),c=(0,a.useRef)(),d=(0,a.useRef)(e),f=(0,a.useRef)(!0);d.current=e;var m="undefined"!=typeof window,x=!t&&0!==t&&m;if("function"!=typeof e)throw TypeError("Expected a function");t=+t||0;var h=!!(n=n||{}).leading,N=!("trailing"in n)||!!n.trailing,g="maxWait"in n,v="debounceOnServer"in n&&!!n.debounceOnServer,p=g?Math.max(+n.maxWait||0,t):null;return(0,a.useEffect)(function(){return f.current=!0,function(){f.current=!1}},[]),(0,a.useMemo)(function(){var e=function(e){var t=l.current,n=u.current;return l.current=u.current=null,i.current=e,c.current=d.current.apply(n,t)},n=function(e,t){x&&cancelAnimationFrame(o.current),o.current=x?requestAnimationFrame(e):setTimeout(e,t)},a=function(e){if(!f.current)return!1;var n=e-s.current;return!s.current||n>=t||n<0||g&&e-i.current>=p},y=function(t){return o.current=null,N&&l.current?e(t):(l.current=u.current=null,c.current)},A=function e(){var r=Date.now();if(a(r))return y(r);if(f.current){var o=t-(r-s.current);n(e,g?Math.min(o,p-(r-i.current)):o)}},k=function(){if(m||v){var d=Date.now(),x=a(d);if(l.current=[].slice.call(arguments),u.current=r,s.current=d,x){if(!o.current&&f.current)return i.current=s.current,n(A,t),h?e(s.current):c.current;if(g)return n(A,t),e(s.current)}return o.current||n(A,t),c.current}};return k.cancel=function(){o.current&&(x?cancelAnimationFrame(o.current):clearTimeout(o.current)),i.current=0,l.current=s.current=u.current=o.current=null},k.isPending=function(){return!!o.current},k.flush=function(){return o.current?y(Date.now()):c.current},k},[h,g,t,p,N,x,m,v])}(()=>{window.innerHeight+window.scrollY>=document.body.offsetHeight-500&&I()},200);(0,a.useEffect)(()=>(window.addEventListener("scroll",R),()=>{window.removeEventListener("scroll",R)}),[R]);let S=t=>{if(!n){u.Am.error("请先选择代币");return}n(t),t.hasEnded?e.push("/acting/?symbol=".concat(t.symbol)):e.push("/launch/?symbol=".concat(t.symbol))},{handleContractError:C}=(0,m.S)();return(0,a.useEffect)(()=>{E&&C(E,"launch"),w&&C(w,"dataViewer")},[E,w]),(0,r.jsxs)("div",{className:"space-y-4 m-4",children:[p.map((e,t)=>(0,r.jsx)(l.Zb,{onClick:()=>S(e),children:(0,r.jsxs)(l.aY,{className:"p-4 flex justify-between items-center",children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("p",{className:"flex items-center gap-2 ",children:[(0,r.jsx)("span",{className:"font-semibold mr-4",children:e.symbol}),(0,r.jsx)("span",{className:"text-greyscale-500 text-sm",children:"父币 "}),(0,r.jsx)("span",{className:"text-sm",children:e.parentTokenSymbol})]}),(0,r.jsx)("p",{className:"text-sm text-muted-foreground",children:e.hasEnded?(0,r.jsx)("span",{className:"text-greyscale-500",children:"发射已完成"}):(0,r.jsx)("span",{className:"text-secondary",children:"发射中"})})]}),(0,r.jsx)(i.z,{variant:"ghost",size:"icon",children:(0,r.jsx)(o.Z,{className:"h-4 w-4"})})]})},t)),(k||j)&&(0,r.jsx)(h.Z,{})]})}function g(){return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s.Z,{title:"代币列表"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)("header",{className:"flex justify-between items-center m-4",children:(0,r.jsx)("h1",{className:"text-lg font-bold",children:"所有代币"})}),(0,r.jsx)(N,{})]})]})}},9008:function(e,t,n){e.exports=n(23867)}},function(e){e.O(0,[19,2888,9774,179],function(){return e(e.s=37985)}),_N_E=e.O()}]);