(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6138],{48764:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/launch/deploy",function(){return n(96233)}])},34680:function(e,t,n){"use strict";n.d(t,{Ol:function(){return i},SZ:function(){return d},Zb:function(){return o},aY:function(){return c},eW:function(){return u},ll:function(){return l}});var r=n(85893),s=n(67294),a=n(40108);let o=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",n),...s})});o.displayName="Card";let i=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("flex flex-col space-y-1.5 p-6",n),...s})});i.displayName="CardHeader";let l=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("text-2xl font-semibold leading-none tracking-tight",n),...s})});l.displayName="CardTitle";let d=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("text-sm text-muted-foreground",n),...s})});d.displayName="CardDescription";let c=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("p-6 pt-0",n),...s})});c.displayName="CardContent";let u=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,a.cn)("flex items-center p-6 pt-0",n),...s})});u.displayName="CardFooter"},76929:function(e,t,n){"use strict";n.d(t,{l0:function(){return u},NI:function(){return p},pf:function(){return y},Wi:function(){return f},xJ:function(){return h},lX:function(){return g},zG:function(){return v}});var r=n(85893),s=n(67294),a=n(4222),o=n(87536),i=n(40108),l=n(99489);let d=(0,n(12003).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),c=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(l.f,{ref:t,className:(0,i.cn)(d(),n),...s})});c.displayName=l.f.displayName;let u=o.RV,m=s.createContext({}),f=e=>{let{...t}=e;return(0,r.jsx)(m.Provider,{value:{name:t.name},children:(0,r.jsx)(o.Qr,{...t})})},x=()=>{let e=s.useContext(m),t=s.useContext(N),{getFieldState:n,formState:r}=(0,o.Gc)(),a=n(e.name,r);if(!e)throw Error("useFormField should be used within <FormField>");let{id:i}=t;return{id:i,name:e.name,formItemId:"".concat(i,"-form-item"),formDescriptionId:"".concat(i,"-form-item-description"),formMessageId:"".concat(i,"-form-item-message"),...a}},N=s.createContext({}),h=s.forwardRef((e,t)=>{let{className:n,...a}=e,o=s.useId();return(0,r.jsx)(N.Provider,{value:{id:o},children:(0,r.jsx)("div",{ref:t,className:(0,i.cn)("space-y-2",n),...a})})});h.displayName="FormItem";let g=s.forwardRef((e,t)=>{let{className:n,...s}=e,{error:a,formItemId:o}=x();return(0,r.jsx)(c,{ref:t,className:(0,i.cn)(a&&"text-destructive",n),htmlFor:o,...s})});g.displayName="FormLabel";let p=s.forwardRef((e,t)=>{let{...n}=e,{error:s,formItemId:o,formDescriptionId:i,formMessageId:l}=x();return(0,r.jsx)(a.g7,{ref:t,id:o,"aria-describedby":s?"".concat(i," ").concat(l):"".concat(i),"aria-invalid":!!s,...n})});p.displayName="FormControl";let y=s.forwardRef((e,t)=>{let{className:n,...s}=e,{formDescriptionId:a}=x();return(0,r.jsx)("p",{ref:t,id:a,className:(0,i.cn)("text-sm text-muted-foreground",n),...s})});y.displayName="FormDescription";let v=s.forwardRef((e,t)=>{let{className:n,children:s,...a}=e,{error:o,formMessageId:l}=x(),d=o?String(null==o?void 0:o.message):s;return d?(0,r.jsx)("p",{ref:t,id:l,className:(0,i.cn)("text-sm font-medium text-destructive",n),...a,children:d}):null});v.displayName="FormMessage"},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},42083:function(e,t,n){"use strict";var r=n(85893),s=n(23432);t.Z=()=>(0,r.jsx)(s.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},44576:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},37436:function(e,t,n){"use strict";n.d(t,{Z:function(){return y}});var r=n(85893),s=n(9008),a=n.n(s),o=n(67294),i=n(3294),l=n(68655),d=n(12003),c=n(40108);let u=(0,d.j)("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),m=o.forwardRef((e,t)=>{let{className:n,variant:s,...a}=e;return(0,r.jsx)("div",{ref:t,role:"alert",className:(0,c.cn)(u({variant:s}),n),...a})});m.displayName="Alert";let f=o.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("h5",{ref:t,className:(0,c.cn)("mb-1 font-medium leading-none tracking-tight",n),...s})});f.displayName="AlertTitle";let x=o.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-sm [&_p]:leading-relaxed",n),...s})});x.displayName="AlertDescription";var N=n(95049);let h=()=>{let{error:e,setError:t}=(0,N.V)(),[n,s]=(0,o.useState)(!1);return((0,o.useEffect)(()=>{e&&s(!0)},[e,t]),n&&e)?(0,r.jsxs)(m,{variant:"destructive",children:[(0,r.jsx)(l.Z,{className:"h-4 w-4"}),(0,r.jsx)(f,{children:e.name}),(0,r.jsx)(x,{children:e.message})]}):null};var g=n(5884),p=n(92321),y=e=>{let{title:t}=e,{address:n,chain:s}=(0,p.m)(),{setError:l}=(0,N.V)();return(0,o.useEffect)(()=>{n&&!s?l({name:"钱包网络错误",message:"请切换到 ".concat("thinkium801"," 网络")}):l(null)},[n,s]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(a(),{children:[(0,r.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,r.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,r.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,r.jsx)(g.vP,{className:"-ml-1"}),(0,r.jsx)(i.NL,{})]}),(0,r.jsx)("div",{className:"px-4",children:(0,r.jsx)(h,{})})]})}},67068:function(e,t,n){"use strict";n.d(t,{S:function(){return o}});let r={launch:{AlreadyInitialized:"已初始化，无需再次初始化",InvalidTokenSymbol:"无效的代币符号",TokenSymbolExists:"代币符号已存在",NotEligibleToDeployToken:"不符合部署代币的条件",LaunchAlreadyEnded:"公平发射已结束，无法进行操作",LaunchNotEnded:"公平发射未结束，无法进行操作",NoContribution:"没有申购，无法操作",TokensAlreadyClaimed:"代币已领取，请勿重复领取",LaunchAlreadyExists:"公平发射已存在",ParentTokenNotSet:"父代币未设置",ZeroContribution:"申购数量不能为0",InvalidParentToken:"无效的父代币"},join:{AlreadyInitialized:"已初始化",AmountIsZero:"数量不能为0",AddressCannotBeZero:"地址不能为空",CannotGenerateAtCurrentRound:"不能在当前轮次生成",LastBlocksOfRoundCannotJoin:"每轮最后".concat("1","个区块不能加入"),ActionNotVoted:"该行动本轮没有投票",InvalidToAddress:"目标地址无效",JoinedAmountIsZero:"加入数量为0",NotInWhiteList:"该地址不在白名单",JoinAmountExceedsMaxStake:"加入数量超过最大质押数量",RoundsIsZero:"轮次为0",RoundNotStarted:"轮次还没有开始，请耐心等待"},mint:{RoundNotFinished:"轮次未结束，无法铸造代币奖励",NoRewardAvailable:"没有奖励可用",RoundStartMustBeLessOrEqualToRoundEnd:"轮次开始必须小于或等于轮次结束",NotEnoughReward:"奖励不足，无法铸造",NotEnoughRewardToBurn:"奖励不足，无法销毁",RoundNotStarted:"轮次还没有开始，请耐心等待"},stake:{NotAllowedToStakeAtRoundZero:"不允许在0轮进行质押",InvalidToAddress:"无效的接收地址",StakeAmountMustBeSet:"质押数量必须大于0",ReleaseAlreadyRequested:"已请求释放",PromisedWaitingRoundsOutOfRange:"承诺等待的轮次超出范围",PromisedWaitingRoundsMustBeGreaterOrEqualThanBefore:"承诺等待的轮次必须大于或等于之前的轮次",NoStakedLiquidity:"无质押的流动性",NoStakedLiquidityOrToken:"没有质押的流动性或代币",AlreadyUnstaked:"已解除质押，无需再次解除",UnableToUnstakeAtRoundZero:"无法在第0轮解除质押",NotEnoughWaitingRounds:"等待轮次数量不足",RoundHasNotStartedYet:"轮次尚未开始",TokenAmountNotEnough:"代币数量不足",TransferTokenAmountForLPFailed:"为LP转账代币数量失败",TransferParentTokenAmountForLPFailed:"为LP转账父代币数量失败",TransferTokenAmountFailed:"转账代币数量失败",TransferSLTokenFailed:"转账SL代币失败",TransferSTTokenFailed:"转账ST代币失败",TransferParentTokenFailed:"转账父代币失败","transfer amount exceeds balance":"转账数量超过余额"},submit:{CannotSubmitAction:"您没有权限提交提案，请先质押获取足够代理票数",ActionIdNotExist:"提案ID不存在",ProposalIndexOutOfRange:"提案索引超出范围",StartGreaterThanEnd:"开始时间大于结束时间",MaxStakeZero:"最大质押数量必须大于0",MaxRandomAccountsZero:"最大随机账户数量必须大于0",AlreadySubmitted:"该提案已提交，请勿重复提交",OnlyOneSubmitPerRound:"每个轮次，1个地址只能提交1个行动"},token:{AlreadyInitialized:"已初始化",InvalidAddress:"无效的地址",NotEligibleToMint:"不符合铸造代币的条件",ExceedsMaxSupply:"超过最大供应量",InsufficientBalance:"余额不足",InvalidSupply:"无效的供应量"},slToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",InsufficientLiquidity:"流动性不足",TotalLpExceedsBalance:"总LP数量超过余额"},stToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁"},verify:{AlreadyInitialized:"已初始化",AddressCannotBeZero:"地址不能为空",FirstTokenAddressCannotBeZero:"第一个代币地址不能为空",RandomAddressCannotBeZero:"随机地址不能为空",ScoresAndAccountsLengthMismatch:"分数和地址数量不匹配",ScoresExceedVotesNum:"分数超过投票数量",RoundNotStarted:"轮次还没有开始，请耐心等待"},vote:{InvalidActionIds:"无效的提案ID",CannotVote:"没有权限投票",NotEnoughVotesLeft:"投票数量不足",VotesMustBeGreaterThanZero:"投票数量必须大于0"},uniswapV2Router:{EXPIRED:"交易已过期，请重新交易",INSUFFICIENT_A_AMOUNT:"A代币数量不足，请调整输入数量",INSUFFICIENT_B_AMOUNT:"B代币数量不足，请调整输入数量",INSUFFICIENT_OUTPUT_AMOUNT:"目标代币数量不足，请调整输入数量",EXCESSIVE_INPUT_AMOUNT:"输入数量过多，请调整输入数量",INVALID_PATH:"无效的兑换路径"}};var s=n(95049),a=n(67294);let o=()=>{let{setError:e}=(0,s.V)();return{handleContractError:(0,a.useCallback)((t,n)=>{console.error("context",n),console.error("error",t),e(function(e,t){let n=null!=e?e:"",s=n.match(/(?:([A-Za-z0-9_]+)\()|(?:ERC20:\s*(.+))/),a="";s&&(void 0!=s[1]||void 0!=s[2])&&(s[1]?a=s[1]:s[2]&&(a="".concat(s[2])));let o=r[t];if(o&&o[a])return{name:"交易错误",message:o[a]};let i=n.match(/User denied transaction signature/)?"用户取消了交易":"";if(i)return{name:"交易提示",message:i};let l=function(e){let t=e.split("\n").find(e=>e.trim().startsWith("Error:"));if(t){var n;let e=null===(n=t.split("Error:")[1])||void 0===n?void 0:n.trim();if(e)return e}let r=e.split("\n"),s=r.findIndex(e=>e.includes("the following reason:"));if(-1!==s&&s+1<r.length){let e=r[s+1].trim();if(e)return e}return""}(n);return l?{name:"交易错误",message:l}:{name:"交易错误",message:"交易失败，请稍后刷新重试"}}(t.message,n))},[e])}}},48105:function(e,t,n){"use strict";n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("thinkium801")),!1)},96233:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return b}});var r=n(85893),s=n(37436),a=n(1604),o=n(56312),i=n(87536),l=n(92321),d=n(11163),c=n(67294),u=n(86501),m=n(21774),f=n(27245),x=n(34680),N=n(76929),h=n(48105),g=n(70019),p=n(67068),y=n(93778),v=n(42083),j=n(44576);let A=a.z.object({symbol:a.z.string().nonempty("请输入代币符号").length(6,"代币符号必须是 6 个字符").regex(/^[A-Z0-9]+$/,"只能使用大写字母 A~Z 和数字 0~9").regex(/^[A-Z]/,"必须以大写字母 A~Z 开头")});function T(){let e=(0,d.useRouter)(),{token:t}=(0,c.useContext)(y.M)||{},{chain:n}=(0,l.m)(),{deployToken:s,isWriting:a,writeError:T,isConfirming:b,isConfirmed:I}=(0,g.Ct)(),{handleContractError:k}=(0,p.S)();(0,c.useEffect)(()=>{T&&k(T,"launch")},[T,k]);let E=(0,i.cI)({resolver:(0,o.F)(A),defaultValues:{symbol:""}});async function R(e){if(!(0,h.S)(n)){u.Am.error("请切换到正确的网络");return}try{await s(e.symbol,null==t?void 0:t.address)}catch(e){console.error(e)}}if((0,c.useEffect)(()=>{I&&e.push("/tokens")},[I,e]),!t)return(0,r.jsx)(v.Z,{});let w=a||b;return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(x.Zb,{className:"w-full border-none shadow-none rounded-none",children:[(0,r.jsxs)(x.Ol,{children:[(0,r.jsx)(x.ll,{className:"text-2xl font-bold text-center",children:"部署子币"}),(0,r.jsxs)(x.SZ,{className:"text-center",children:["创建 ",(0,r.jsx)("span",{className:"text-secondary",children:t.symbol})," 的子币"]})]}),(0,r.jsx)(N.l0,{...E,children:(0,r.jsxs)("form",{onSubmit:E.handleSubmit(R),children:[(0,r.jsx)(x.aY,{className:"space-y-4",children:(0,r.jsx)(N.Wi,{control:E.control,name:"symbol",render:e=>{let{field:t}=e;return(0,r.jsxs)(N.xJ,{children:[(0,r.jsx)(N.lX,{children:"子币符号："}),(0,r.jsx)(N.NI,{children:(0,r.jsx)(m.I,{id:"symbol",placeholder:"例如: TENNIS, LIFE20",disabled:w||I,className:"!ring-secondary-foreground",...t})}),(0,r.jsx)(N.pf,{children:"只能用大写字母A~Z和数字0~9，最多 6 个字符。"}),(0,r.jsx)(N.zG,{})]})}})}),(0,r.jsx)(x.eW,{className:"flex justify-center",children:(0,r.jsx)(f.z,{className:"w-1/2",type:"submit",disabled:w||I,children:a?"提交中...":b?"确认中...":I?"提交成功":"提交"})})]})}),(0,r.jsxs)("div",{className:"bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-0 m-6",children:[(0,r.jsx)("p",{className:"mb-1",children:"说明："}),(0,r.jsxs)("p",{children:["1. 部署者：须持有 ",null==t?void 0:t.symbol,"不少于 0.5%的治理票"]}),(0,r.jsxs)("p",{children:["2. 子币发射目标：须筹集 20,000,000个 ",null==t?void 0:t.symbol]})]})]}),(0,r.jsx)(j.Z,{isLoading:w,text:a?"提交交易...":"确认交易..."})]})}function b(){return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(s.Z,{title:"部署代币"}),(0,r.jsx)("main",{className:"flex-grow",children:(0,r.jsx)(T,{})})]})}},9008:function(e,t,n){e.exports=n(23867)}},function(e){e.O(0,[2624,19,2888,9774,179],function(){return e(e.s=48764)}),_N_E=e.O()}]);