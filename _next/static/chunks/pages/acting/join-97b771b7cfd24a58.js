(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3487],{20640:function(e,t,n){"use strict";var r=n(11742),s={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,o,a,i,l,c,d,u,f=!1;t||(t={}),a=t.debug||!1;try{if(l=r(),c=document.createRange(),d=document.getSelection(),(u=document.createElement("span")).textContent=e,u.ariaHidden="true",u.style.all="unset",u.style.position="fixed",u.style.top=0,u.style.clip="rect(0, 0, 0, 0)",u.style.whiteSpace="pre",u.style.webkitUserSelect="text",u.style.MozUserSelect="text",u.style.msUserSelect="text",u.style.userSelect="text",u.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){a&&console.warn("unable to use e.clipboardData"),a&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=s[t.format]||s.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(u),c.selectNodeContents(u),d.addRange(c),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){a&&console.error("unable to copy using execCommand: ",r),a&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){a&&console.error("unable to copy using clipboardData: ",r),a&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",o=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",i=n.replace(/#{\s*key\s*}/g,o),window.prompt(i,e)}}finally{d&&("function"==typeof d.removeRange?d.removeRange(c):d.removeAllRanges()),u&&document.body.removeChild(u),l()}return f}},66030:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/acting/join",function(){return n(11989)}])},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},20725:function(e,t,n){"use strict";var r=n(85893),s=n(67294),o=n(94782),a=n(93778),i=n(91529),l=n(27460),c=n(42083);t.Z=e=>{var t;let{actionId:n,round:d,showSubmitter:u}=e,{token:f}=(0,s.useContext)(a.M)||{},{actionInfo:p,isPending:m,error:x}=(0,o.dI)(null==f?void 0:f.address,n),{actionSubmits:y,isPending:b,error:h}=(0,o.WZ)(null==f?void 0:f.address,u?d:0n),v=(null==y?void 0:null===(t=y.find(e=>e.actionId==Number(n)))||void 0===t?void 0:t.submitter)||"N/A";return m?(0,r.jsx)(c.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2 border-t border-greyscale-100",children:[(0,r.jsxs)("div",{className:"flex flex-col",children:[(0,r.jsxs)("span",{className:"text-sm text-greyscale-500",children:["No.",null==p?void 0:p.head.id.toString()]}),(0,r.jsx)("span",{className:"text-xl font-bold text-black",children:null==p?void 0:p.body.action})]}),(0,r.jsx)("div",{className:"mt-1",children:(0,r.jsx)("span",{className:"text-greyscale-600",children:null==p?void 0:p.body.consensus})}),(0,r.jsxs)("div",{className:"mt-0 text-xs text-greyscale-500 flex justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center",children:["创建人 ",(0,r.jsx)(l.Z,{address:null==p?void 0:p.head.author})]}),u&&(0,r.jsxs)("div",{className:"flex items-center",children:["推举人"," ",b?(0,r.jsx)(c.Z,{}):(0,r.jsx)(l.Z,{address:v})]})]})]}),(0,r.jsxs)("div",{className:"max-w-4xl mx-auto p-6 pt-4 pb-2",children:[(0,r.jsxs)("div",{className:"mb-6",children:[(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"参与资产上限"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(0,i.LH)((null==p?void 0:p.body.maxStake)||BigInt(0))})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"随机奖励地址数"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.maxRandomAccounts.toString())||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证规则"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.verificationRule)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"验证信息填写指引"}),(0,r.jsx)("p",{className:"text-greyscale-500",children:(null==p?void 0:p.body.verificationInfoGuide)||"-"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("h3",{className:"text-sm font-bold",children:"白名单"}),(0,r.jsx)("p",{className:"text-greyscale-500 flex flex-wrap items-center",children:(null==p?void 0:p.body.whiteList.length)?p.body.whiteList.map((e,t)=>(0,r.jsx)("span",{className:"flex items-center mr-2",children:(0,r.jsx)(l.Z,{address:e})},t)):"无限制"})]})]}),(x||u&&h)&&(0,r.jsx)("div",{className:"text-center text-sm text-red-500",children:(null==x?void 0:x.message)||(null==h?void 0:h.message)})]})]})}},42083:function(e,t,n){"use strict";var r=n(85893),s=n(23432);t.Z=()=>(0,r.jsx)(s.Z,{className:"mx-auto h-4 w-4 animate-spin text-greyscale-500"})},44576:function(e,t,n){"use strict";var r=n(85893);n(67294);var s=n(23432);t.Z=e=>{let{isLoading:t,text:n="Loading"}=e;return t?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50",children:(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)(s.Z,{className:"mx-auto h-8 w-8 animate-spin text-white"}),(0,r.jsx)("p",{className:"mt-2 text-sm font-medium text-white",children:n})]})}):null}},11989:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return N}});var r=n(85893),s=n(67294),o=n(11163),a=n(94782),i=n(5028),l=n(93778),c=n(58732),d=n(92321),u=n(91529),f=n(64777),p=n(42083),m=e=>{let{actionId:t,onStakedAmountChange:n}=e,{address:o}=(0,d.m)(),{token:a}=(0,s.useContext)(l.M)||{},{stakedAmountByAccountByActionId:c,isPending:m,error:x}=(0,i.um)((null==a?void 0:a.address)||"",o||"",t);return((0,s.useEffect)(()=>{m||null==n||n(c||BigInt(0))},[c,m]),x)?(console.error(x),(0,r.jsx)("div",{children:"加载失败"})):(0,r.jsxs)("div",{className:"px-6 pt-1 pb-4",children:[(0,r.jsx)(f.Z,{title:"上次参与"}),(0,r.jsx)("div",{className:"stats w-full divide-x-0",children:(0,r.jsxs)("div",{className:"stat place-items-center",children:[(0,r.jsx)("div",{className:"stat-title",children:"已结束, 未取回的代币"}),(0,r.jsx)("div",{className:"stat-value text-2xl text-secondary",children:m?(0,r.jsx)(p.Z,{}):(0,u.LH)(c||BigInt(0))}),(0,r.jsxs)("div",{className:"stat-desc text-xs text-greyscale-400",children:[(0,r.jsx)("span",{className:"text-secondary",children:"提示："}),"未取回的代币，再加入时默认直接参与"]})]})})]})},x=n(27245),y=n(86501),b=n(78543),h=n(19638),v=n(44576),g=e=>{let{actionInfo:t,stakedAmount:n}=e,a=(0,o.useRouter)(),{token:c}=(0,s.useContext)(l.M)||{},{address:p,chain:m}=(0,d.m)(),[g,j]=(0,s.useState)(""),[N,w]=(0,s.useState)(""),[C,O]=(0,s.useState)(""),{balance:k,error:S}=(0,h.hS)(null==c?void 0:c.address,p),{approve:P,isWriting:I,isConfirming:E,isConfirmed:A,writeError:Z}=(0,h.yA)(null==c?void 0:c.address),_=async()=>{if((0,b.S)(m)){if(n&&(0,u.vz)(g)+n>BigInt(t.body.maxStake)){y.Am.error("增加的代币数不能超过最大参与代币数");return}if(!n&&!g){y.Am.error("请输入增加的代币数");return}try{await P("0x34Aa27F8d9f85d36d797402BD672Fc9977417f1a",(0,u.vz)(g))}catch(e){console.error("Approve failed",e)}}},{join:D,isPending:B,isConfirming:R,isConfirmed:T,error:$}=(0,i.z7)(),L=async()=>{if((0,b.S)(m))try{await D(null==c?void 0:c.address,BigInt(t.head.id),(0,u.vz)(g),C,BigInt(N))}catch(e){console.error("Join failed",e)}};(0,s.useEffect)(()=>{T&&(y.Am.success("加入成功"),j(""),w(""),O(""),setTimeout(()=>{a.push("/action/".concat(t.head.id,"?type=join&symbol=").concat(null==c?void 0:c.symbol))},2e3))},[T]);let M=BigInt(t.body.maxStake)-(n||0n),z=!!n&&!g&&!!N&&!!C;return console.log("ifCanSubmitAndNotNeedApprove",z),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{className:"px-6 pt-0 pb-2",children:[(0,r.jsx)(f.Z,{title:"加入行动"}),(0,r.jsxs)("div",{className:"my-4",children:[(0,r.jsxs)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:[n?"增加":"","参与代币: (当前持有：",(0,u.LH)(k||0n)," ",null==c?void 0:c.symbol,")"]}),(0,r.jsx)("input",{type:"number",disabled:M<=0n,placeholder:M>0n?"".concat(n?"可填 0 不追加。如需追加":"","不能超过 ").concat((0,u.LH)(M)):"已到最大".concat((0,u.LH)(BigInt(t.body.maxStake)),"，不能再追加"),value:g,onChange:e=>j(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:"参与轮数:"}),(0,r.jsx)("input",{type:"number",placeholder:"输入参数轮数",value:N,onChange:e=>w(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"})]}),(0,r.jsxs)("div",{className:"mb-4",children:[(0,r.jsx)("label",{className:"block text-left mb-1 text-sm text-greyscale-500",children:"验证信息:"}),(0,r.jsx)("textarea",{placeholder:"".concat(null==t?void 0:t.body.verificationInfoGuide),value:C,onChange:e=>O(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"})]}),(0,r.jsxs)("div",{className:"flex justify-center space-x-4",children:[(0,r.jsx)(x.z,{className:"w-1/2",disabled:I||E||A||z||T,onClick:_,children:I?"1.授权中...":E?"1.确认中...":A?"1.已授权":z?"1.无需授权":"1.授权"}),(0,r.jsx)(x.z,{className:"w-1/2",disabled:(!A||B||R||T)&&!z,onClick:L,children:B?"2.加入中...":R?"2.确认中...":T?"2.已加入":"2.加入"})]}),S&&(0,r.jsx)("div",{className:"text-red-500 text-center",children:S.message}),Z&&(0,r.jsx)("div",{className:"text-red-500 text-center",children:Z.message}),$&&(0,r.jsx)("div",{className:"text-red-500 text-center",children:$.message})]}),(0,r.jsx)(v.Z,{isLoading:I||E||B||R,text:I||B?"提交交易...":"确认交易..."})]})},j=n(20725),N=()=>{let{id:e}=(0,o.useRouter)().query,[t,n]=(0,s.useState)(void 0),{token:d}=(0,s.useContext)(l.M)||{},{currentRound:u,isPending:f,error:x}=(0,i.Bk)(),{actionInfo:y,isPending:b,error:h}=(0,a.dI)(null==d?void 0:d.address,void 0===e?void 0:BigInt(e));return!e||Array.isArray(e)||b||f?(0,r.jsx)(p.Z,{}):h||x?(console.error(h,x),(0,r.jsx)("div",{children:"加载失败"})):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(c.Z,{title:"加入行动"}),(0,r.jsxs)("main",{className:"flex-grow",children:[(0,r.jsx)(m,{actionId:BigInt(e),onStakedAmountChange:function(e){n(e)}}),(0,r.jsx)(g,{actionInfo:y,stakedAmount:t}),(0,r.jsxs)("div",{className:"flex flex-col w-full rounded p-4",children:[(0,r.jsx)("div",{className:"text-base font-bold text-greyscale-700 pb-2",children:"规则说明："}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"1、参与代币越多，被选中验证并获得奖励的概率越大"}),(0,r.jsx)("div",{className:"text-sm text-greyscale-500",children:"2、轮次结束后，可随时在我的页面取回参与的代币，或者继续参与此行动的之后轮次"})]}),(0,r.jsx)(j.Z,{actionId:BigInt(e),round:u,showSubmitter:!1})]})]})}},78543:function(e,t,n){"use strict";n.d(t,{S:function(){return s}});var r=n(86501);let s=e=>!!e||(r.Am.error("请先将钱包链接 ".concat("sepolia")),!1)},9008:function(e,t,n){e.exports=n(23867)},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var s=i(n(67294)),o=i(n(20640)),a=["text","onCopy","options","children"];function i(e){return e&&e.__esModule?e:{default:e}}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function c(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach(function(t){p(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function d(e,t){return(d=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function u(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function p(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var m=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&d(e,t)}(l,e);var t,n,i=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(l);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return u(e)}(this,e)});function l(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,l);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return p(u(e=i.call.apply(i,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,a=n.onCopy,i=n.children,l=n.options,c=s.default.Children.only(i),d=(0,o.default)(r,l);a&&a(r,d),c&&c.props&&"function"==typeof c.props.onClick&&c.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,s=function(e,t){if(null==e)return{};var n,r,s={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}(e,a),r=s.default.Children.only(t);return s.default.cloneElement(r,c(c({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(l.prototype,n),Object.defineProperty(l,"prototype",{writable:!1}),l}(s.default.PureComponent);t.CopyToClipboard=m,p(m,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),s=n.startsWith("-");if(s&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,s,o]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],a=Math.round(Number(`${s}.${o}`));(r=a>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${a}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${s?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})}},function(e){e.O(0,[1502,4637,9871,2888,9774,179],function(){return e(e.s=66030)}),_N_E=e.O()}]);