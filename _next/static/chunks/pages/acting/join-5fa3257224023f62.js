(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3487],{20640:function(e,t,r){"use strict";var n=r(11742),o={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var r,a,i,s,c,l,u,d,f=!1;t||(t={}),i=t.debug||!1;try{if(c=n(),l=document.createRange(),u=document.getSelection(),(d=document.createElement("span")).textContent=e,d.ariaHidden="true",d.style.all="unset",d.style.position="fixed",d.style.top=0,d.style.clip="rect(0, 0, 0, 0)",d.style.whiteSpace="pre",d.style.webkitUserSelect="text",d.style.MozUserSelect="text",d.style.msUserSelect="text",d.style.userSelect="text",d.addEventListener("copy",function(r){if(r.stopPropagation(),t.format){if(r.preventDefault(),void 0===r.clipboardData){i&&console.warn("unable to use e.clipboardData"),i&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var n=o[t.format]||o.default;window.clipboardData.setData(n,e)}else r.clipboardData.clearData(),r.clipboardData.setData(t.format,e)}t.onCopy&&(r.preventDefault(),t.onCopy(r.clipboardData))}),document.body.appendChild(d),l.selectNodeContents(d),u.addRange(l),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(n){i&&console.error("unable to copy using execCommand: ",n),i&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(n){i&&console.error("unable to copy using clipboardData: ",n),i&&console.error("falling back to prompt"),r="message"in t?t.message:"Copy to clipboard: #{key}, Enter",a=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",s=r.replace(/#{\s*key\s*}/g,a),window.prompt(s,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(l):u.removeAllRanges()),d&&document.body.removeChild(d),c()}return f}},66030:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/acting/join",function(){return r(12547)}])},27245:function(e,t,r){"use strict";r.d(t,{z:function(){return l}});var n=r(85893),o=r(67294),a=r(88426),i=r(45139),s=r(98997);let c=(0,i.j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-md px-8",icon:"h-10 w-10"}},defaultVariants:{variant:"default",size:"default"}}),l=o.forwardRef((e,t)=>{let{className:r,variant:o,size:i,asChild:l=!1,...u}=e,d=l?a.g7:"button";return(0,n.jsx)(d,{className:(0,s.cn)(c({variant:o,size:i,className:r})),ref:t,...u})});l.displayName="Button"},98997:function(e,t,r){"use strict";r.d(t,{cn:function(){return a}});var n=r(90512),o=r(98388);function a(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return(0,o.m6)((0,n.W)(t))}},31134:function(e,t,r){"use strict";r.d(t,{Z:function(){return c}});var n=r(67294);let o=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),a=function(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return t.filter((e,t,r)=>!!e&&""!==e.trim()&&r.indexOf(e)===t).join(" ").trim()};var i={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let s=(0,n.forwardRef)((e,t)=>{let{color:r="currentColor",size:o=24,strokeWidth:s=2,absoluteStrokeWidth:c,className:l="",children:u,iconNode:d,...f}=e;return(0,n.createElement)("svg",{ref:t,...i,width:o,height:o,stroke:r,strokeWidth:c?24*Number(s)/Number(o):s,className:a("lucide",l),...f},[...d.map(e=>{let[t,r]=e;return(0,n.createElement)(t,r)}),...Array.isArray(u)?u:[u]])}),c=(e,t)=>{let r=(0,n.forwardRef)((r,i)=>{let{className:c,...l}=r;return(0,n.createElement)(s,{ref:i,iconNode:t,className:a("lucide-".concat(o(e)),c),...l})});return r.displayName="".concat(e),r}},18289:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});let n=(0,r(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},12547:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return v}});var n=r(85893),o=r(67294),a=r(11163),i=r(94782),s=r(5028),c=r(93778),l=r(35337),u=r(27460),d=e=>{var t;let{actionInfo:r,round:a,showSubmitter:s=!0}=e,{token:l}=(0,o.useContext)(c.M)||{},{actionSubmits:d,isPending:f,error:p}=(0,i.WZ)(null==l?void 0:l.address,s?a:0n),m=(null==d?void 0:null===(t=d.find(e=>e.actionId==Number(null==r?void 0:r.head.id)))||void 0===t?void 0:t.submitter)||"-";return(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"max-w-4xl mx-auto p-6 bg-white  mb-4",children:[(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsxs)("span",{className:"text-sm text-gray-500",children:["No.",null==r?void 0:r.head.id.toString()]}),(0,n.jsx)("span",{className:"text-2xl font-bold text-black",children:null==r?void 0:r.body.action})]}),(0,n.jsx)("div",{className:"mt-2",children:(0,n.jsx)("span",{className:"text-gray-600",children:null==r?void 0:r.body.consensus})}),(0,n.jsxs)("div",{className:"mt-2 text-xs text-gray-500 flex justify-between",children:[(0,n.jsxs)("div",{className:"flex items-center",children:["创建人 ",(0,n.jsx)(u.Z,{address:null==r?void 0:r.head.author})]}),s&&(0,n.jsxs)("div",{className:"flex items-center",children:["推举人 ",(0,n.jsx)(u.Z,{address:m})]})]})]})})},f=r(92321),p=r(91318),m=r(91529),y=e=>{let{actionId:t,onStakedAmountChange:r}=e,{address:a}=(0,f.m)(),{token:i}=(0,o.useContext)(c.M)||{},{stakedAmountByAccountByActionId:l,isPending:u,error:d}=(0,s.um)((null==i?void 0:i.address)||"",a||"",t);return((0,o.useEffect)(()=>{u||null==r||r(l||BigInt(0))},[l,u]),d)?(console.error(d),(0,n.jsx)("div",{children:"加载失败"})):(0,n.jsxs)("div",{className:"flex items-end w-full p-4 bg-white mb-4",children:[(0,n.jsx)("span",{className:"text-sm text-gray-500 mr-2",children:"待参与代币数:"}),(0,n.jsx)("span",{className:"text-xl font-bold text-orange-400",children:u?(0,n.jsx)(p.Z,{}):(0,m.LH)(l||BigInt(0))}),(0,n.jsx)("span",{className:"text-xs text-gray-400 ml-auto",children:"(之前参与，未取回的代币)"})]})},b=r(86501),g=r(27245),x=r(19638),h=e=>{let{actionInfo:t,stakedAmount:r}=e,i=(0,a.useRouter)(),{token:l}=(0,o.useContext)(c.M)||{},{address:u}=(0,f.m)(),[d,p]=(0,o.useState)(""),[y,h]=(0,o.useState)(""),[v,j]=(0,o.useState)(""),{balance:w,error:C}=(0,x.hS)(null==l?void 0:l.address,u),{approve:N,isWriting:k,isConfirmed:O,writeError:E}=(0,x.yA)(null==l?void 0:l.address),{join:P,isPending:S,isConfirming:_,isConfirmed:A,error:D}=(0,s.z7)(),[I,R]=(0,o.useState)(!1),B=async()=>{if(r&&(0,m.vz)(d)+r>BigInt(t.body.maxStake)){b.Am.error("增加的代币数不能超过最大参与代币数");return}if(!r&&!d){b.Am.error("请输入增加的代币数");return}try{R(!0),await N("0x34Aa27F8d9f85d36d797402BD672Fc9977417f1a",(0,m.vz)(d))}catch(e){console.error("Approve failed",e),R(!1)}};(0,o.useEffect)(()=>{O&&I&&P(null==l?void 0:l.address,BigInt(t.head.id),(0,m.vz)(d),v,BigInt(y)).then(()=>{R(!1)}).catch(e=>{console.error("Stake failed",e),R(!1)})},[O,I]),(0,o.useEffect)(()=>{A&&(b.Am.success("加入成功"),p(""),h(""),j(""),setTimeout(()=>{i.push("/action/".concat(t.head.id,"?type=join"))},2e3))},[A]);let T=BigInt(t.body.maxStake)-(r||0n);return(0,n.jsx)(n.Fragment,{children:(0,n.jsxs)("div",{className:"w-full flex flex-col rounded p-4 bg-white mt-1",children:[(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsxs)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:["增加参与代币: (当前持有：",(0,m.LH)(w||0n)," ",null==l?void 0:l.symbol,")"]}),(0,n.jsx)("input",{type:"number",disabled:T<=0n,placeholder:T>0n?"".concat(null==l?void 0:l.symbol," 数量，不能超过 ").concat((0,m.LH)(T)):"已到最大".concat((0,m.LH)(BigInt(t.body.maxStake)),"，不能再追加"),value:d,onChange:e=>p(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"})]}),(0,n.jsxs)("div",{className:"mb-4",children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"参与轮数:"}),(0,n.jsx)("input",{type:"number",placeholder:"输入参数轮数",value:y,onChange:e=>h(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"})]}),(0,n.jsxs)("div",{children:[(0,n.jsx)("label",{className:"block text-left mb-1 text-sm text-gray-500",children:"验证信息:"}),(0,n.jsx)("textarea",{placeholder:"".concat(null==t?void 0:t.body.verificationInfoGuide),value:v,onChange:e=>j(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"})]}),(0,n.jsx)("div",{className:"flex justify-center",children:A?(0,n.jsx)(g.z,{className:"mt-4 w-1/2 bg-blue-600 hover:bg-blue-700",children:"加入成功"}):(0,n.jsx)(g.z,{onClick:B,disabled:S||_,className:"mt-4 w-1/2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400",children:S||_?"加入中...":"加入行动"})}),C&&(0,n.jsx)("div",{className:"text-red-500 text-center",children:C.message}),E&&(0,n.jsx)("div",{className:"text-red-500 text-center",children:E.message}),D&&(0,n.jsx)("div",{className:"text-red-500 text-center",children:D.message})]})})},v=()=>{let{id:e}=(0,a.useRouter)().query,[t,r]=(0,o.useState)(void 0),{token:u}=(0,o.useContext)(c.M)||{},{currentRound:f,isPending:m,error:b}=(0,s.Bk)(),{actionInfo:g,isPending:x,error:v}=(0,i.dI)(null==u?void 0:u.address,void 0===e?void 0:BigInt(e));return!e||Array.isArray(e)||x||m?(0,n.jsx)(p.Z,{}):v||b?(console.error(v,b),(0,n.jsx)("div",{children:"加载失败"})):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(l.Z,{title:"加入行动"}),(0,n.jsxs)("main",{className:"flex-grow",children:[(0,n.jsx)(d,{actionInfo:g,round:f}),(0,n.jsx)(y,{actionId:BigInt(e),onStakedAmountChange:function(e){r(e)}}),(0,n.jsx)(h,{actionInfo:g,stakedAmount:t}),(0,n.jsxs)("div",{className:"flex flex-col w-full rounded p-4 bg-white mt-4",children:[(0,n.jsx)("div",{className:"text-base font-bold text-gray-700 pb-2",children:"规则说明："}),(0,n.jsx)("div",{className:"text-sm text-gray-500",children:"1、参与代币越多，被选中验证并获得奖励的概率越大"}),(0,n.jsx)("div",{className:"text-sm text-gray-500",children:"2、轮次结束后，可随时在我的页面取回参与的代币，或者继续参与此行动的之后轮次"})]})]})]})}},11163:function(e,t,r){e.exports=r(43079)},74300:function(e,t,r){"use strict";function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var o=s(r(67294)),a=s(r(20640)),i=["text","onCopy","options","children"];function s(e){return e&&e.__esModule?e:{default:e}}function c(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?c(Object(r),!0).forEach(function(t){p(e,t,r[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):c(Object(r)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))})}return e}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function d(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function p(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var m=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t)}(c,e);var t,r,s=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,r=f(c);return e=t?Reflect.construct(r,arguments,f(this).constructor):r.apply(this,arguments),function(e,t){if(t&&("object"===n(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return d(e)}(this,e)});function c(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,c);for(var t=arguments.length,r=Array(t),n=0;n<t;n++)r[n]=arguments[n];return p(d(e=s.call.apply(s,[this].concat(r))),"onClick",function(t){var r=e.props,n=r.text,i=r.onCopy,s=r.children,c=r.options,l=o.default.Children.only(s),u=(0,a.default)(n,c);i&&i(n,u),l&&l.props&&"function"==typeof l.props.onClick&&l.props.onClick(t)}),e}return r=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),r=function(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],!(t.indexOf(r)>=0)&&Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}(e,i),n=o.default.Children.only(t);return o.default.cloneElement(n,l(l({},r),{},{onClick:this.onClick}))}}],function(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}(c.prototype,r),Object.defineProperty(c,"prototype",{writable:!1}),c}(o.default.PureComponent);t.CopyToClipboard=m,p(m,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,r){"use strict";var n=r(74300).CopyToClipboard;n.CopyToClipboard=n,e.exports=n},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,r=[],n=0;n<e.rangeCount;n++)r.push(e.getRangeAt(n));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||r.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},89810:function(e,t,r){"use strict";r.d(t,{u:function(){return c}});var n=r(37003),o=r(36100),a=r(82451),i=r(82002),s=r(37122);function c(e={}){let{abi:t,address:r,functionName:c,query:l={}}=e,u=e.code,d=(0,s.Z)(e),f=(0,i.x)({config:d}),p=function(e,t={}){return{async queryFn({queryKey:r}){let o=t.abi;if(!o)throw Error("abi is required");let{functionName:a,scopeKey:i,...s}=r[1],c=(()=>{let e=r[1];if(e.address)return{address:e.address};if(e.code)return{code:e.code};throw Error("address or code is required")})();if(!a)throw Error("functionName is required");return(0,n.L)(e,{abi:o,functionName:a,args:s.args,...c,...s})},queryKey:function(e={}){let{abi:t,...r}=e;return["readContract",(0,o.OP)(r)]}(t)}}(d,{...e,chainId:e.chainId??f}),m=!!((r||u)&&t&&c&&(l.enabled??!0));return(0,a.aM)({...l,...p,enabled:m,structuralSharing:l.structuralSharing??o.if})}}},function(e){e.O(0,[4846,8424,7140,9638,2624,2888,9774,179],function(){return e(e.s=66030)}),_N_E=e.O()}]);