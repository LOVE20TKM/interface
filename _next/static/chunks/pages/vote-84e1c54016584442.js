(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[1786],{20640:function(e,t,n){"use strict";var r=n(11742),o={"text/plain":"Text","text/html":"Url",default:"Text"};e.exports=function(e,t){var n,c,s,a,l,i,u,d,f=!1;t||(t={}),s=t.debug||!1;try{if(l=r(),i=document.createRange(),u=document.getSelection(),(d=document.createElement("span")).textContent=e,d.ariaHidden="true",d.style.all="unset",d.style.position="fixed",d.style.top=0,d.style.clip="rect(0, 0, 0, 0)",d.style.whiteSpace="pre",d.style.webkitUserSelect="text",d.style.MozUserSelect="text",d.style.msUserSelect="text",d.style.userSelect="text",d.addEventListener("copy",function(n){if(n.stopPropagation(),t.format){if(n.preventDefault(),void 0===n.clipboardData){s&&console.warn("unable to use e.clipboardData"),s&&console.warn("trying IE specific stuff"),window.clipboardData.clearData();var r=o[t.format]||o.default;window.clipboardData.setData(r,e)}else n.clipboardData.clearData(),n.clipboardData.setData(t.format,e)}t.onCopy&&(n.preventDefault(),t.onCopy(n.clipboardData))}),document.body.appendChild(d),i.selectNodeContents(d),u.addRange(i),!document.execCommand("copy"))throw Error("copy command was unsuccessful");f=!0}catch(r){s&&console.error("unable to copy using execCommand: ",r),s&&console.warn("trying IE specific stuff");try{window.clipboardData.setData(t.format||"text",e),t.onCopy&&t.onCopy(window.clipboardData),f=!0}catch(r){s&&console.error("unable to copy using clipboardData: ",r),s&&console.error("falling back to prompt"),n="message"in t?t.message:"Copy to clipboard: #{key}, Enter",c=(/mac os x/i.test(navigator.userAgent)?"⌘":"Ctrl")+"+C",a=n.replace(/#{\s*key\s*}/g,c),window.prompt(a,e)}}finally{u&&("function"==typeof u.removeRange?u.removeRange(i):u.removeAllRanges()),d&&document.body.removeChild(d),l()}return f}},75125:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/vote",function(){return n(36968)}])},34680:function(e,t,n){"use strict";n.d(t,{Ol:function(){return a},SZ:function(){return i},Zb:function(){return s},aY:function(){return u},eW:function(){return d},ll:function(){return l}});var r=n(85893),o=n(67294),c=n(40108);let s=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("rounded-lg border bg-card text-card-foreground shadow-sm",n),...o})});s.displayName="Card";let a=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("flex flex-col space-y-1.5 p-6",n),...o})});a.displayName="CardHeader";let l=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-2xl font-semibold leading-none tracking-tight",n),...o})});l.displayName="CardTitle";let i=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("text-sm text-muted-foreground",n),...o})});i.displayName="CardDescription";let u=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("p-6 pt-0",n),...o})});u.displayName="CardContent";let d=o.forwardRef((e,t)=>{let{className:n,...o}=e;return(0,r.jsx)("div",{ref:t,className:(0,c.cn)("flex items-center p-6 pt-0",n),...o})});d.displayName="CardFooter"},78865:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]])},68655:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]])},18289:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},23432:function(e,t,n){"use strict";n.d(t,{Z:function(){return r}});let r=(0,n(31134).Z)("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]])},27460:function(e,t,n){"use strict";var r=n(85893),o=n(67294),c=n(74855),s=n(78865),a=n(18289),l=n(86501),i=n(91529);t.Z=e=>{let{address:t,showCopyButton:n=!0,showAddress:u=!0,colorClassName:d=""}=e,[f,p]=(0,o.useState)(!1);return(0,r.jsxs)("span",{className:"flex items-center space-x-2",children:[u&&(0,r.jsx)("span",{className:"text-xs ".concat(null!=d?d:"text-greyscale-500"),children:(0,i.Vu)(t)}),n&&(0,r.jsx)(c.CopyToClipboard,{text:t,onCopy:(e,t)=>{t?p(!0):l.ZP.error("复制失败")},children:(0,r.jsx)("button",{className:"flex items-center justify-center p-1 rounded hover:bg-gray-200 focus:outline-none",onClick:e=>{e.preventDefault(),e.stopPropagation()},"aria-label":"复制地址",children:f?(0,r.jsx)(s.Z,{className:"h-4 w-4 ".concat(null!=d?d:"text-greyscale-500")}):(0,r.jsx)(a.Z,{className:"h-4 w-4 ".concat(null!=d?d:"text-greyscale-500")})})})]})}},64777:function(e,t,n){"use strict";var r=n(85893);t.Z=e=>{let{title:t}=e;return(0,r.jsx)("div",{className:"flex justify-between items-center",children:(0,r.jsx)("h1",{className:"text-lg font-bold",children:t})})}},36968:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return g}});var r=n(85893),o=n(67294),c=n(7080),s=n(67068),a=n(37436),l=n(11163),i=n(86501),u=n(27245),d=n(34680),f=n(41664),p=n.n(f),y=n(94782),m=n(93778),x=n(27460),b=n(64777),h=n(42083),v=e=>{let{currentRound:t}=e,{token:n}=(0,o.useContext)(m.M)||{},a=(0,l.useRouter)(),{votes:f,isPending:v,error:g}=(0,c.$S)((null==n?void 0:n.address)||"",t),{actionSubmits:j,isPending:w,error:C}=(0,y.WZ)((null==n?void 0:n.address)||"",t),N=Array.from(new Set((null==j?void 0:j.map(e=>BigInt(e.actionId)))||[])).sort((e,t)=>Number(e)-Number(t)),{actionInfos:O,isPending:k,error:P}=(0,y.fT)((null==n?void 0:n.address)||"",N),[S,E]=(0,o.useState)(new Set),D=e=>{E(t=>{let n=new Set(t);return n.has(e)?n.delete(e):n.add(e),n})},R=(null==f?void 0:f.reduce((e,t)=>e+t,0n))||0n,{handleContractError:_}=(0,s.S)();return((0,o.useEffect)(()=>{g&&_(g,"vote"),P&&_(P,"submit")},[g,P]),v||w||N&&N.length>0&&k)?(0,r.jsx)("div",{className:"p-4 flex justify-center items-center",children:(0,r.jsx)(h.Z,{})}):n?(1===N.length&&a.push("/vote/vote?ids=".concat(N[0],"&symbol=").concat(null==n?void 0:n.symbol)),1!==N.length&&(0,r.jsxs)("div",{className:"p-4",children:[(0,r.jsxs)("div",{className:"flex justify-between items-center mb-4",children:[(0,r.jsx)(b.Z,{title:"投票中的行动"}),n&&(0,r.jsx)(u.z,{variant:"outline",size:"sm",className:"text-secondary border-secondary",asChild:!0,children:(0,r.jsx)(p(),{href:"/vote/actions4submit?symbol=".concat(null==n?void 0:n.symbol),children:"推举其他行动"})})]}),(0,r.jsx)("div",{className:"space-y-4",children:N.length>0?(0,r.jsxs)(r.Fragment,{children:[null==O?void 0:O.map((e,t)=>{var o;let c=null==j?void 0:null===(o=j.find(t=>BigInt(t.actionId)===BigInt(e.head.id)))||void 0===o?void 0:o.submitter;return(0,r.jsxs)(d.Zb,{className:"shadow-none flex items-center",children:[(0,r.jsx)("input",{type:"checkbox",className:"checkbox accent-secondary ml-2",checked:S.has(BigInt(e.head.id)),onChange:()=>D(BigInt(e.head.id))}),(0,r.jsxs)(p(),{href:"/action/".concat(e.head.id,"?type=vote&symbol=").concat(null==n?void 0:n.symbol),className:"w-full",children:[(0,r.jsxs)(d.Ol,{className:"px-3 pt-2 pb-1 flex-row justify-start items-baseline",children:[(0,r.jsx)("span",{className:"text-greyscale-400 text-sm mr-1",children:"No.".concat(e.head.id)}),(0,r.jsx)("span",{className:"font-bold text-greyscale-800",children:"".concat(e.body.action)})]}),(0,r.jsxs)(d.aY,{className:"px-3 pt-1 pb-2",children:[(0,r.jsx)("div",{className:"text-greyscale-500",children:e.body.consensus}),(0,r.jsxs)("div",{className:"flex justify-between mt-1 text-sm",children:[(0,r.jsxs)("span",{className:"flex items-center",children:[(0,r.jsx)("span",{className:"text-greyscale-400 mr-1",children:"推举人"}),(0,r.jsx)("span",{className:"text-secondary",children:(0,r.jsx)(x.Z,{address:c,showCopyButton:!1})})]}),(0,r.jsxs)("span",{children:[(0,r.jsx)("span",{className:"text-greyscale-400 mr-1",children:"投票占比"}),(0,r.jsxs)("span",{className:"text-secondary",children:[0===Number((null==f?void 0:f[t])||0n)?"0":(100*Number((null==f?void 0:f[t])||0n)/Number(R)).toFixed(1),"%"]})]})]})]})]},e.head.id)]},e.head.id)}),(0,r.jsx)("div",{className:"flex justify-center mt-4",children:(0,r.jsx)(u.z,{variant:"outline",className:"w-1/2 text-secondary border-secondary",onClick:()=>{let e=Array.from(S).join(",");if(0===e.length){i.Am.error("请选择行动");return}a.push("/vote/vote?ids=".concat(e,"&symbol=").concat(null==n?void 0:n.symbol))},children:"给选中的行动投票"})})]}):(0,r.jsx)("div",{className:"text-sm text-greyscale-500 text-center mt-8",children:"本轮没有行动，请先推举"})})]})):(0,r.jsx)(h.Z,{})},g=()=>{let{currentRound:e,isPending:t,error:n}=(0,c.Bk)(),{handleContractError:l}=(0,s.S)();return((0,o.useEffect)(()=>{n&&l(n,"vote")},[n]),t)?(0,r.jsx)(h.Z,{}):(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(a.Z,{title:"投票首页"}),(0,r.jsx)("main",{className:"flex-grow",children:(0,r.jsx)(v,{currentRound:e})})]})}},9008:function(e,t,n){e.exports=n(23867)},74300:function(e,t,n){"use strict";function r(e){return(r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.CopyToClipboard=void 0;var o=a(n(67294)),c=a(n(20640)),s=["text","onCopy","options","children"];function a(e){return e&&e.__esModule?e:{default:e}}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach(function(t){p(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function u(e,t){return(u=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function d(e){if(void 0===e)throw ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function p(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var y=function(e){!function(e,t){if("function"!=typeof t&&null!==t)throw TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),Object.defineProperty(e,"prototype",{writable:!1}),t&&u(e,t)}(l,e);var t,n,a=(t=function(){if("undefined"==typeof Reflect||!Reflect.construct||Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){})),!0}catch(e){return!1}}(),function(){var e,n=f(l);return e=t?Reflect.construct(n,arguments,f(this).constructor):n.apply(this,arguments),function(e,t){if(t&&("object"===r(t)||"function"==typeof t))return t;if(void 0!==t)throw TypeError("Derived constructors may only return object or undefined");return d(e)}(this,e)});function l(){var e;!function(e,t){if(!(e instanceof t))throw TypeError("Cannot call a class as a function")}(this,l);for(var t=arguments.length,n=Array(t),r=0;r<t;r++)n[r]=arguments[r];return p(d(e=a.call.apply(a,[this].concat(n))),"onClick",function(t){var n=e.props,r=n.text,s=n.onCopy,a=n.children,l=n.options,i=o.default.Children.only(a),u=(0,c.default)(r,l);s&&s(r,u),i&&i.props&&"function"==typeof i.props.onClick&&i.props.onClick(t)}),e}return n=[{key:"render",value:function(){var e=this.props,t=(e.text,e.onCopy,e.options,e.children),n=function(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)n=c[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)n=c[r],!(t.indexOf(n)>=0)&&Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}(e,s),r=o.default.Children.only(t);return o.default.cloneElement(r,i(i({},n),{},{onClick:this.onClick}))}}],function(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}(l.prototype,n),Object.defineProperty(l,"prototype",{writable:!1}),l}(o.default.PureComponent);t.CopyToClipboard=y,p(y,"defaultProps",{onCopy:void 0,options:void 0})},74855:function(e,t,n){"use strict";var r=n(74300).CopyToClipboard;r.CopyToClipboard=r,e.exports=r},11742:function(e){e.exports=function(){var e=document.getSelection();if(!e.rangeCount)return function(){};for(var t=document.activeElement,n=[],r=0;r<e.rangeCount;r++)n.push(e.getRangeAt(r));switch(t.tagName.toUpperCase()){case"INPUT":case"TEXTAREA":t.blur();break;default:t=null}return e.removeAllRanges(),function(){"Caret"===e.type&&e.removeAllRanges(),e.rangeCount||n.forEach(function(t){e.addRange(t)}),t&&t.focus()}}},21803:function(e,t,n){"use strict";function r(e,t){let[n,r="0"]=e.split("."),o=n.startsWith("-");if(o&&(n=n.slice(1)),r=r.replace(/(0+)$/,""),0===t)1===Math.round(Number(`.${r}`))&&(n=`${BigInt(n)+1n}`),r="";else if(r.length>t){let[e,o,c]=[r.slice(0,t-1),r.slice(t-1,t),r.slice(t)],s=Math.round(Number(`${o}.${c}`));(r=s>9?`${BigInt(e)+BigInt(1)}0`.padStart(e.length+1,"0"):`${e}${s}`).length>t&&(r=r.slice(1),n=`${BigInt(n)+1n}`),r=r.slice(0,t)}else r=r.padEnd(t,"0");return BigInt(`${o?"-":""}${n}${r}`)}n.d(t,{v:function(){return r}})}},function(e){e.O(0,[1664,1250,4782,2888,9774,179],function(){return e(e.s=75125)}),_N_E=e.O()}]);