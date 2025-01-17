(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[8589],{83080:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/gov/unstake",function(){return n(18183)}])},27460:function(e,t,n){"use strict";var r=n(85893),a=n(86501),s=n(74855),o=n(18289),i=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0,showAddress:l=!0,colorClassName:d=""}=e;return(0,r.jsxs)("span",{className:"flex items-center space-x-2",children:[l&&(0,r.jsx)("span",{className:"text-xs ".concat(null!=d?d:"text-greyscale-500"),children:(0,i.Vu)(t)}),n&&(0,r.jsx)(s.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?a.ZP.success("复制成功"):a.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:(0,r.jsx)(o.Z,{className:"h-4 w-4 ".concat(null!=d?d:"text-greyscale-500")})})})]})}},64777:function(e,t,n){"use strict";var r=n(85893);t.Z=e=>{let{title:t}=e;return(0,r.jsx)("div",{className:"flex justify-between items-center",children:(0,r.jsx)("h1",{className:"text-lg font-bold",children:t})})}},37436:function(e,t,n){"use strict";n.d(t,{Z:function(){return v}});var r=n(85893),a=n(9008),s=n.n(a),o=n(67294),i=n(3294),l=n(68655),d=n(12003),u=n(40108);let c=(0,d.j)("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",{variants:{variant:{default:"bg-background text-foreground",destructive:"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"}},defaultVariants:{variant:"default"}}),f=o.forwardRef((e,t)=>{let{className:n,variant:a,...s}=e;return(0,r.jsx)("div",{ref:t,role:"alert",className:(0,u.cn)(c({variant:a}),n),...s})});f.displayName="Alert";let m=o.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("h5",{ref:t,className:(0,u.cn)("mb-1 font-medium leading-none tracking-tight",n),...a})});m.displayName="AlertTitle";let x=o.forwardRef((e,t)=>{let{className:n,...a}=e;return(0,r.jsx)("div",{ref:t,className:(0,u.cn)("text-sm [&_p]:leading-relaxed",n),...a})});x.displayName="AlertDescription";var N=n(95049);let T=()=>{let{error:e,setError:t}=(0,N.V)(),[n,a]=(0,o.useState)(!1);return((0,o.useEffect)(()=>{e&&a(!0)},[e,t]),n&&e)?(0,r.jsxs)(f,{variant:"destructive",children:[(0,r.jsx)(l.Z,{className:"h-4 w-4"}),(0,r.jsx)(m,{children:e.name}),(0,r.jsx)(x,{children:e.message})]}):null};var g=n(5884),h=n(92321),v=e=>{let{title:t}=e,{address:n,chain:a}=(0,h.m)(),{setError:l}=(0,N.V)();return(0,o.useEffect)(()=>{n&&!a&&l({name:n?"钱包网络错误":"未连接钱包",message:n?"请切换到 ".concat("sepolia"," 网络"):"请先连接钱包，再进行操作"})},[n,a]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(s(),{children:[(0,r.jsx)("title",{children:"".concat(t," - LIFE20")}),(0,r.jsx)("meta",{name:"".concat(t," - LIFE20"),content:"A Web3 DApp for Life20 token management"})]}),(0,r.jsxs)("header",{className:"flex justify-between items-center py-2 px-4",children:[(0,r.jsx)(g.vP,{className:"-ml-1"}),(0,r.jsx)(i.NL,{})]}),(0,r.jsx)("div",{className:"px-4",children:(0,r.jsx)(T,{})})]})}},67068:function(e,t,n){"use strict";n.d(t,{S:function(){return o}});let r={launch:{AlreadyInitialized:"已初始化，无需再次初始化",InvalidTokenSymbol:"无效的代币符号",TokenSymbolExists:"代币符号已存在",NotEligibleToDeployToken:"不符合部署代币的条件",LaunchAlreadyEnded:"公平发射已结束，无法进行操作",LaunchNotEnded:"公平发射未结束，无法进行操作",NoContribution:"没有申购，无法操作",TokensAlreadyClaimed:"代币已领取，请勿重复领取",TransferFailed:"转账失败，请稍后重试",LaunchAlreadyExists:"公平发射已存在",ParentTokenNotSet:"父代币未设置",ZeroContribution:"申购数量不能为0",InvalidParentToken:"无效的父代币"},join:{RoundsIsZero:"轮次为0",LastBlocksOfRoundCannotJoin:"每轮最后一些区块不能加入",ActionNotVoted:"该行动本轮没有投票",TransferFailed:"转账失败",StakedAmountIsZero:"质押数量为0",ActionAlreadyJoined:"您已加入该行动，请勿重复加入",JoinedRoundIsNotFinished:"加入的轮次未结束",VerificationInfoIsEmpty:"验证信息为空",RoundNotFinished:"轮次未结束",NotInWhiteList:"该地址不在白名单",StakedAmountExceedsMaxStake:"质押数量超过最大质押数量"},mint:{RoundNotFinished:"轮次未结束，无法铸造代币奖励",NoRewardAvailable:"没有奖励可用",RoundStartMustBeLessOrEqualToRoundEnd:"轮次开始必须小于或等于轮次结束",NotEnoughReward:"奖励不足，无法铸造",NotEnoughRewardToBurn:"奖励不足，无法销毁"},stake:{NotAllowedToStakeAtRoundZero:"不允许在0轮进行质押",InvalidToAddress:"无效的接收地址",StakeAmountMustBeSet:"质押数量必须大于0",ReleaseAlreadyRequested:"已请求释放",PromisedWaitingRoundsOutOfRange:"承诺等待的轮次超出范围",PromisedWaitingRoundsMustBeGreaterOrEqualThanBefore:"承诺等待的轮次必须大于或等于之前的轮次",NoStakedLiquidity:"无质押的流动性",NoStakedLiquidityOrToken:"没有质押的流动性或代币",AlreadyUnstaked:"已解除质押，无需再次解除",UnableToUnstakeAtRoundZero:"无法在第0轮解除质押",NotEnoughWaitingRounds:"等待轮次数量不足",RoundHasNotStartedYet:"轮次尚未开始",TokenAmountNotEnough:"代币数量不足",TransferTokenAmountForLPFailed:"为LP转账代币数量失败",TransferParentTokenAmountForLPFailed:"为LP转账父代币数量失败",TransferTokenAmountFailed:"转账代币数量失败",TransferSLTokenFailed:"转账SL代币失败",TransferSTTokenFailed:"转账ST代币失败",TransferParentTokenFailed:"转账父代币失败","transfer amount exceeds balance":"转账数量超过余额"},submit:{CannotSubmitAction:"您没有权限提交提案，请先质押获取足够代理票数",ActionIdNotExist:"提案ID不存在",ProposalIndexOutOfRange:"提案索引超出范围",StartGreaterThanEnd:"开始时间大于结束时间",MaxStakeZero:"最大质押数量必须大于0",MaxRandomAccountsZero:"最大随机账户数量必须大于0",AlreadySubmitted:"该提案已提交，请勿重复提交",OnlyOneSubmitPerRound:"每个轮次，1个地址只能提交1个行动"},token:{AlreadyInitialized:"已初始化",InvalidAddress:"无效的地址",NotEligibleToMint:"不符合铸造代币的条件",ExceedsMaxSupply:"超过最大供应量",InsufficientBalance:"余额不足",TransferFailed:"转账失败，请稍后重试",InvalidSupply:"无效的供应量"},slToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",InsufficientLiquidity:"流动性不足",TotalLpExceedsBalance:"总LP数量超过余额",TransferFailed:"转账失败，请稍后重试"},stToken:{NotEligibleToMint:"不符合铸造代币的条件",InvalidAddress:"无效的地址",NoTokensToBurn:"没有代币可销毁",TransferFailed:"转账失败，请稍后重试"},verify:{AlreadyInitialized:"已初始化",AddressCannotBeZero:"地址不能为空",FirstTokenAddressCannotBeZero:"第一个代币地址不能为空",RandomAddressCannotBeZero:"随机地址不能为空",ScoresAndAccountsLengthMismatch:"分数和地址数量不匹配",ScoresExceedVotesNum:"分数超过投票数量"},vote:{InvalidActionIds:"无效的提案ID",CannotVote:"没有权限投票",NotEnoughVotesLeft:"投票数量不足",VotesMustBeGreaterThanZero:"投票数量必须大于0"},uniswapV2Router:{EXPIRED:"交易已过期，请重新交易",INSUFFICIENT_A_AMOUNT:"A代币数量不足，请调整输入数量",INSUFFICIENT_B_AMOUNT:"B代币数量不足，请调整输入数量",INSUFFICIENT_OUTPUT_AMOUNT:"目标代币数量不足，请调整输入数量",EXCESSIVE_INPUT_AMOUNT:"输入数量过多，请调整输入数量",INVALID_PATH:"无效的兑换路径"}};var a=n(95049),s=n(67294);let o=()=>{let{setError:e}=(0,a.V)();return{handleContractError:(0,s.useCallback)((t,n)=>{console.error("context",n),console.error("error",t),e(function(e,t){let n=null!=e?e:"",a=n.match(/(?:([A-Za-z0-9_]+)\()|(?:ERC20:\s*(.+))/),s="";a&&(void 0!=a[1]||void 0!=a[2])&&(a[1]?s=a[1]:a[2]&&(s="".concat(a[2])));let o=r[t];if(o&&o[s])return{name:"交易错误",message:o[s]};let i=n.match(/User denied transaction signature/)?"用户取消了交易":"";if(i)return{name:"交易提示",message:i};let l=function(e){let t=e.split("\n").find(e=>e.trim().startsWith("Error:"));if(t){var n;let e=null===(n=t.split("Error:")[1])||void 0===n?void 0:n.trim();if(e)return e}let r=e.split("\n"),a=r.findIndex(e=>e.includes("the following reason:"));if(-1!==a&&a+1<r.length){let e=r[a+1].trim();if(e)return e}return""}(n);return l?{name:"交易错误",message:l}:{name:"交易错误",message:"交易失败，请稍后刷新重试"}}(t.message,n))},[e])}}},91529:function(e,t,n){"use strict";n.d(t,{LH:function(){return o},Vu:function(){return s},bM:function(){return l},cK:function(){return d},vz:function(){return i}});var r=n(21803),a=n(15229);let s=e=>e?"".concat(e.substring(0,6),"...").concat(e.substring(e.length-4)):"",o=e=>{let t=l(e);return new Intl.NumberFormat("en-US",{maximumFractionDigits:2}).format(Number(t))},i=e=>{let t=parseInt("18",10);try{return(0,r.v)(e,t)}catch(e){return console.error("parseUnits error:",e),0n}},l=e=>{let t=parseInt("18",10);return(0,a.b)(e,t)},d=(e,t)=>e&&t?e-BigInt(t.initialStakeRound)+1n:0n},18183:function(e,t,n){"use strict";n.r(t);var r=n(85893),a=n(67294),s=n(93778),o=n(37436),i=n(64777),l=n(40057);t.default=()=>{let{token:e}=(0,a.useContext)(s.M)||{};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(o.Z,{title:"取消质押"}),(0,r.jsx)("main",{className:"flex-grow",children:(0,r.jsxs)("div",{className:"flex-col items-center px-6 pt-6 pb-2",children:[(0,r.jsx)(i.Z,{title:"取消质押"}),(0,r.jsx)(l.Z,{token:e,enableWithdraw:!0})]})})]})}}},function(e){e.O(0,[1664,2209,5263,7224,8321,2888,9774,179],function(){return e(e.s=83080)}),_N_E=e.O()}]);