(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[5781,1250],{65160:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/launch/burn",function(){return n(72587)}])},76929:function(e,t,n){"use strict";n.d(t,{l0:function(){return c},NI:function(){return v},pf:function(){return p},Wi:function(){return f},xJ:function(){return N},lX:function(){return g},zG:function(){return b}});var r=n(85893),s=n(67294),a=n(4222),i=n(87536),o=n(40108),l=n(99489);let d=(0,n(12003).j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),u=s.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)(l.f,{ref:t,className:(0,o.cn)(d(),n),...s})});u.displayName=l.f.displayName;let c=i.RV,m=s.createContext({}),f=e=>{let{...t}=e;return(0,r.jsx)(m.Provider,{value:{name:t.name},children:(0,r.jsx)(i.Qr,{...t})})},x=()=>{let e=s.useContext(m),t=s.useContext(h),{getFieldState:n,formState:r}=(0,i.Gc)(),a=n(e.name,r);if(!e)throw Error("useFormField should be used within <FormField>");let{id:o}=t;return{id:o,name:e.name,formItemId:"".concat(o,"-form-item"),formDescriptionId:"".concat(o,"-form-item-description"),formMessageId:"".concat(o,"-form-item-message"),...a}},h=s.createContext({}),N=s.forwardRef((e,t)=>{let{className:n,...a}=e,i=s.useId();return(0,r.jsx)(h.Provider,{value:{id:i},children:(0,r.jsx)("div",{ref:t,className:(0,o.cn)("space-y-2",n),...a})})});N.displayName="FormItem";let g=s.forwardRef((e,t)=>{let{className:n,...s}=e,{error:a,formItemId:i}=x();return(0,r.jsx)(u,{ref:t,className:(0,o.cn)(a&&"text-destructive",n),htmlFor:i,...s})});g.displayName="FormLabel";let v=s.forwardRef((e,t)=>{let{...n}=e,{error:s,formItemId:i,formDescriptionId:o,formMessageId:l}=x();return(0,r.jsx)(a.g7,{ref:t,id:i,"aria-describedby":s?"".concat(o," ").concat(l):"".concat(o),"aria-invalid":!!s,...n})});v.displayName="FormControl";let p=s.forwardRef((e,t)=>{let{className:n,...s}=e,{formDescriptionId:a}=x();return(0,r.jsx)("p",{ref:t,id:a,className:(0,o.cn)("text-sm text-muted-foreground",n),...s})});p.displayName="FormDescription";let b=s.forwardRef((e,t)=>{let{className:n,children:s,...a}=e,{error:i,formMessageId:l}=x(),d=i?String(null==i?void 0:i.message):s;return d?(0,r.jsx)("p",{ref:t,id:l,className:(0,o.cn)("text-sm font-medium text-destructive",n),...a,children:d}):null});b.displayName="FormMessage"},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},42083:function(e,t,n){"use strict";var r=n(85893),s=n(23432);t.Z=()=>(0,r.jsx)(s.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},44576:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},37436:function(e,t,n){"use strict";n.d(t,{Z:function(){return p}});var r=n(85893),s=n(9008),a=n.n(s),i=n(67294),o=n(3294),l=n(68655),d=n(12003),u=n(40108);let c=(0,d.j)("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),m=i.forwardRef((e,t)=>{let{className:n,variant:s,...a}=e;return(0,r.jsx)("div",{ref:t,role:"alert",className:(0,u.cn)(c({variant:s}),n),...a})});m.displayName="Alert";let f=i.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("h5",{ref:t,className:(0,u.cn)("mb-1 font-medium leading-none tracking-tight",n),...s})});f.displayName="AlertTitle";let x=i.forwardRef((e,t)=>{let{className:n,...s}=e;return(0,r.jsx)("div",{ref:t,className:(0,u.cn)("text-sm [&_p]:leading-relaxed",n),...s})});x.displayName="AlertDescription";var h=n(95049);let N=()=>{let{error:e,setError:t}=(0,h.V)(),[n,s]=(0,i.useState)(!1);return((0,i.useEffect)(()=>{e&&s(!0)},[e,t]),n&&e)?(0,r.jsxs)(m,{variant:"destructive",children:[(0,r.jsx)(l.Z,{className:"h-4 w-4"}),(0,r.jsx)(f,{children:e.name}),(0,r.jsx)(x,{children:e.message})]}):null};var g=n(5884),v=n(92321),p=e=>{let{title:t}=e,{address:n,chain:s}=(0,v.m)(),{setError:l}=(0,h.V)();return(0,i.useEffect)(()=>{n&&!s?l({name:"钱包网络错误",message:"请切换到 ".concat("thinkium801"," 网络")}):l(null)},[n,s]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(a(),{children:[(0,r.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,r.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,r.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,r.jsx)(g.vP,{className:"-ml-1"}),(0,r.jsx)(o.NL,{})]}),(0,r.jsx)("div",{className:"px-4",children:(0,r.jsx)(N,{})})]})}},67068:function(e,t,n){"use strict";n.d(t,{S:function(){return i}});let r={launch:{AlreadyInitialized:"已初始化，无需再次初始化",InvalidTokenSymbol:"无效的代币符号",TokenSymbolExists:"代币符号已存在",NotEligibleToDeployToken:"不符合部署代币的条件",LaunchAlreadyEnded:"公平发射已结束，无法进行操作",LaunchNotEnded:"公平发射未结束，无法进行操作",NoContribution:"没有申购，无法操作",TokensAlreadyClaimed:"代币已领取，请勿重复领取",TransferFailed:"转账失败，请稍后重试",LaunchAlreadyExists:"公平发射已存在",ParentTokenNotSet:"父代币未设置",ZeroContribution:"申购数量不能为0",InvalidParentToken:"无效的父代币"},join:{AlreadyInitialized:"已初始化",AmountIsZero:"数量不能为0",AddressCannotBeZero:"地址不能为空",CannotGenerateAtCurrentRound:"不能在当前轮次生成",LastBlocksOfRoundCannotJoin:"每轮最后".concat("1","个区块不能加入"),ActionNotVoted:"该行动本轮没有投票",TransferFailed:"转账失败",InvalidToAddress:"目标地址无效",JoinedAmountIsZero:"加入数量为0",NotInWhiteList:"该地址不在白名单",JoinAmountExceedsMaxStake:"加入数量超过最大质押数量",RoundsIsZero:"轮次为0",RoundNotStarted:"轮次还没有开始，请耐心等待"},mint:{RoundNotFinished:"轮次未结束，无法铸造代币奖励",NoRewardAvailable:"没有奖励可用",RoundStartMustBeLessOrEqualToRoundEnd:"轮次开始必须小于或等于轮次结束",NotEnoughReward:"奖励不足，无法铸造",NotEnoughRewardToBurn:"奖励不足，无法销毁",RoundNotStarted:"轮次还没有开始，请耐心等待"},stake:{NotAllowedToStakeAtRoundZero:"不允许在0轮进行质押",InvalidToAddress:"无效的接收地址",StakeAmountMustBeSet:"质押数量必须大于0",ReleaseAlreadyRequested:"已请求释放",PromisedWaitingRoundsOutOfRange:"承诺等待的轮次超出范围",PromisedWaitingRoundsMustBeGreaterOrEqualThanBefore:"承诺等待的轮次必须大于或等于之前的轮次",NoStakedLiquidity:"无质押的流动性",NoStakedLiquidityOrToken:"没有质押的流动性或代币",AlreadyUnstaked:"已解除质押，无需再次解除",UnableToUnstakeAtRoundZero:"无法在第0轮解除质押",NotEnoughWaitingRounds:"等待轮次数量不足",RoundHasNotStartedYet:"轮次尚未开始",TokenAmountNotEnough:"代币数量不足",TransferTokenAmountForLPFailed:"为LP转账代币数量失败",TransferParentTokenAmountForLPFailed:"为LP转账父代币数量失败",TransferTokenAmountFailed:"转账代币数量失败",TransferSLTokenFailed:"转账SL代币失败",TransferSTTokenFailed:"转账ST代币失败",TransferParentTokenFailed:"转账父代币失败","transfer amount exceeds balance":"转账数量超过余额"},submit:{CannotSubmitAction:"您没有权限提交提案，请先质押获取足够代理票数",ActionIdNotExist:"提案ID不存在",ProposalIndexOutOfRange:"提案索引超出范围",StartGreaterThanEnd:"开始时间大于结束时间",MaxStakeZero:"最大质押数量必须大于0",MaxRandomAccountsZero:"最大随机账户数量必须大于0",AlreadySubmitted:"该提案已提交，请勿重复提交",OnlyOneSubmitPerRound:"每个轮次，1个地址只能提交1个行动"},token:{AlreadyInitialized:"已初始化",InvalidAddress:"无效的地址",NotEligibleToMint:"不符合铸造代币的条件",ExceedsMaxSupply:"超过最大供应量",InsufficientBalance:"余额不足",TransferFailed:"转账失败，请稍后重试",InvalidSupply:"无效的供应量"},slToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",InsufficientLiquidity:"流动性不足",TotalLpExceedsBalance:"总LP数量超过余额",TransferFailed:"转账失败，请稍后重试"},stToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",TransferFailed:"转账失败，请稍后重试"},verify:{AlreadyInitialized:"已初始化",AddressCannotBeZero:"地址不能为空",FirstTokenAddressCannotBeZero:"第一个代币地址不能为空",RandomAddressCannotBeZero:"随机地址不能为空",ScoresAndAccountsLengthMismatch:"分数和地址数量不匹配",ScoresExceedVotesNum:"分数超过投票数量",RoundNotStarted:"轮次还没有开始，请耐心等待"},vote:{InvalidActionIds:"无效的提案ID",CannotVote:"没有权限投票",NotEnoughVotesLeft:"投票数量不足",VotesMustBeGreaterThanZero:"投票数量必须大于0"},uniswapV2Router:{EXPIRED:"交易已过期，请重新交易",INSUFFICIENT_A_AMOUNT:"A代币数量不足，请调整输入数量",INSUFFICIENT_B_AMOUNT:"B代币数量不足，请调整输入数量",INSUFFICIENT_OUTPUT_AMOUNT:"目标代币数量不足，请调整输入数量",EXCESSIVE_INPUT_AMOUNT:"输入数量过多，请调整输入数量",INVALID_PATH:"无效的兑换路径"}};var s=n(95049),a=n(67294);let i=()=>{let{setError:e}=(0,s.V)();return{handleContractError:(0,a.useCallback)((t,n)=>{console.error("context",n),console.error("error",t),e(function(e,t){let n=null!=e?e:"",s=n.match(/(?:([A-Za-z0-9_]+)\()|(?:ERC20:\s*(.+))/),a="";s&&(void 0!=s[1]||void 0!=s[2])&&(s[1]?a=s[1]:s[2]&&(a="".concat(s[2])));let i=r[t];if(i&&i[a])return{name:"交易错误",message:i[a]};let o=n.match(/User denied transaction signature/)?"用户取消了交易":"";if(o)return{name:"交易提示",message:o};let l=function(e){let t=e.split("\n").find(e=>e.trim().startsWith("Error:"));if(t){var n;let e=null===(n=t.split("Error:")[1])||void 0===n?void 0:n.trim();if(e)return e}let r=e.split("\n"),s=r.findIndex(e=>e.includes("the following reason:"));if(-1!==s&&s+1<r.length){let e=r[s+1].trim();if(e)return e}return""}(n);return l?{name:"交易错误",message:l}:{name:"交易错误",message:"交易失败，请稍后刷新重试"}}(t.message,n))},[e])}}},91529:function(e,t,n){"use strict";n.d(t,{LH:function(){return i},Vu:function(){return a},bM:function(){return l},cK:function(){return u},eb:function(){return c},kP:function(){return d},vz:function(){return o}});var r=n(21803),s=n(15229);let a=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",i=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:4,n=Number(l(e));return e<10n?"0":n<1e-4?"<0.0001":new Intl.NumberFormat("en-US",{maximumFractionDigits:t}).format(n)},o=e=>{let t=parseInt("18",10);try{let n=e.replace(/,/g,"");return(0,r.v)(n,t)}catch(e){return console.error("parseUnits error:",e),0n}},l=e=>{let t=parseInt("18",10);return(0,s.b)(e,t)},d=e=>e.includes(".")?parseFloat(e).toString():e,u=(e,t)=>e&&t?e-BigInt(t.initialStakeRound)+1n:0n,c=(e,t,n)=>{let r=Number(e);if(r>=1)return new Intl.NumberFormat("en-US",{maximumFractionDigits:t}).format(r);if(r>=.001)return new Intl.NumberFormat("en-US",{maximumFractionDigits:n+1}).format(r);{if(0===r)return"0";let e=r.toFixed(n+10),t=e.split(".");if(t.length<2)return e;let s=t[1],a=0;for(let e of s)if("0"===e)a++;else break;let i=s.slice(a);return"0.{".concat(a,"}").concat(i)}}},48105:function(e,t,n){"use strict";n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("thinkium801")),!1)},72587:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return k}});var r=n(85893),s=n(67294),a=n(93778),i=n(70019),o=n(67068),l=n(1604),d=n(56312),u=n(87536),c=n(92321),m=n(86501),f=n(11163),x=n(27245),h=n(21774),N=n(76929),g=n(91529),v=n(48105),p=n(19638),b=n(64777),y=n(42083),j=n(44576),A=e=>{let{token:t,launchInfo:n}=e,{address:a,chain:i}=(0,c.m)(),A=(0,f.useRouter)(),{balance:T,isPending:k,error:I}=(0,p.hS)(null==t?void 0:t.address,a),{balance:S,isPending:E,error:F}=(0,p.hS)(null==t?void 0:t.parentTokenAddress,null==t?void 0:t.address),{totalSupply:w,isPending:R,error:C}=(0,p.A5)(null==t?void 0:t.address),L=(0,s.useMemo)(()=>l.z.object({burnAmount:l.z.string().nonempty({message:"请输入销毁数量"}).refine(e=>Number(e)>0,{message:"销毁数量不能为0"})}).refine(e=>{if(!T)return!0;try{return!!(0,g.vz)(e.burnAmount)&&(0,g.vz)(e.burnAmount)<=T}catch(e){return!1}},{message:"销毁数量不能超过您的余额",path:["burnAmount"]}),[T]),Z=(0,u.cI)({resolver:(0,d.F)(L),defaultValues:{burnAmount:""},mode:"onChange"}),P=Z.watch("burnAmount");(0,s.useMemo)(()=>{try{return P?(0,g.vz)(P):0n}catch(e){return 0n}},[P]);let[M,B]=(0,s.useState)(0n);(0,s.useEffect)(()=>{let e=Z.getValues("burnAmount");w&&S&&e&&B((0,g.vz)(e)*S/w)},[Z.watch("burnAmount"),w,S]);let{burnForParentToken:_,isPending:z,isConfirming:U,isConfirmed:O,writeError:V}=(0,p.l3)(null==t?void 0:t.address),D=async e=>{if((0,v.S)(i))try{await _((0,g.vz)(e.burnAmount))}catch(e){console.error(e)}};(0,s.useEffect)(()=>{O&&(m.Am.success("销毁成功"),setTimeout(()=>{A.push("/launch?symbol=".concat(null==t?void 0:t.symbol))},2e3))},[O,A,null==t?void 0:t.symbol]);let{handleContractError:$}=(0,o.S)();return((0,s.useEffect)(()=>{I&&$(I,"token"),F&&$(F,"token"),C&&$(C,"token"),V&&$(V,"token")},[I,F,C,V,$]),!t||k)?(0,r.jsx)(y.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsx)(b.Z,{title:"底池销毁"}),(0,r.jsx)("div",{className:"stats w-full",children:(0,r.jsxs)("div",{className:"stat place-items-center",children:[(0,r.jsx)("div",{className:"stat-title text-sm mr-6",children:"底池总量"}),(0,r.jsxs)("div",{className:"stat-value text-secondary mt-2",children:[(0,g.LH)(S||0n),(0,r.jsx)("span",{className:"text-greyscale-500 font-normal text-sm ml-2",children:t.parentTokenSymbol})]}),(0,r.jsxs)("div",{className:"stat-desc text-sm mt-2",children:["销毁 ",t.symbol,"，可从底池取回 ",t.parentTokenSymbol]})]})}),(0,r.jsxs)("div",{className:"mt-6",children:[(0,r.jsx)(N.l0,{...Z,children:(0,r.jsxs)("form",{onSubmit:e=>e.preventDefault(),children:[(0,r.jsx)(N.Wi,{control:Z.control,name:"burnAmount",render:e=>{let{field:n}=e;return(0,r.jsxs)(N.xJ,{children:[(0,r.jsxs)(N.lX,{children:["要销毁的 ",t.symbol," 数量："]}),(0,r.jsx)(N.NI,{children:(0,r.jsx)(h.I,{type:"number",placeholder:"请输入数量",disabled:0n>=(T||0n)||z||U,className:"!ring-secondary-foreground",...n})}),(0,r.jsx)(N.zG,{})]})}}),(0,r.jsxs)("div",{className:"flex items-center text-sm",children:[(0,r.jsxs)("span",{className:"text-greyscale-400",children:["我的 ",t.symbol,": ",(0,r.jsx)("span",{className:"text-secondary",children:(0,g.LH)(T||0n)})]}),(0,r.jsx)(x.z,{variant:"link",size:"sm",onClick:()=>{Z.setValue("burnAmount",(0,g.bM)(T||0n))},disabled:0n>=(T||0n)||z||U,className:"text-secondary",children:"全选"})]}),(0,r.jsx)("div",{className:"flex items-center justify-end text-sm my-2",children:(0,r.jsxs)("span",{className:"text-greyscale-400",children:["预计可取回 ",(0,r.jsx)("span",{className:"text-secondary",children:(0,g.LH)(M)})," ",t.parentTokenSymbol]})}),(0,r.jsx)("div",{className:"flex justify-center",children:(0,r.jsx)(x.z,{className:"w-1/2 text-white py-2 rounded-lg",onClick:Z.handleSubmit(D),disabled:z||U||O,children:z?"销毁中...":U?"确认中...":O?"销毁成功":"销毁"})})]})}),(0,r.jsxs)("div",{className:"bg-gray-100 text-greyscale-500 rounded-lg p-4 text-sm mt-4",children:[(0,r.jsx)("p",{className:"mb-1",children:"计算公式："}),(0,r.jsxs)("p",{children:["所得 ",t.parentTokenSymbol," 数量 = 底池 ",t.parentTokenSymbol," 总量 * (销毁 ",t.symbol," 数量 /"," ",t.symbol," 总发行量)"]})]})]})]}),(0,r.jsx)(j.Z,{isLoading:z||U,text:z?"提交交易...":"确认交易..."})]})},T=n(37436);function k(){let{token:e}=(0,s.useContext)(a.M)||{},{launchInfo:t,isPending:n,error:l}=(0,i.zL)(e?e.address:"0x0"),{handleContractError:d}=(0,o.S)();return((0,s.useEffect)(()=>{l&&d(l,"launch")},[l]),n)?(0,r.jsx)(y.Z,{}):t?(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(T.Z,{title:"底池销毁"}),(0,r.jsx)("main",{className:"flex-grow",children:(0,r.jsx)(A,{token:e,launchInfo:t})})]}):(0,r.jsx)("div",{className:"text-red-500",children:"找不到发射信息"})}},9008:function(e,t,n){e.exports=n(23867)},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),s=n.startsWith("-");if(s&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,s,a]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],i=Math.round(Number(`${s}.${a}`));(r=i>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${i}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${s?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})}},function(e){e.O(0,[2624,7380,19,2888,9774,179],function(){return e(e.s=65160)}),_N_E=e.O()}]);