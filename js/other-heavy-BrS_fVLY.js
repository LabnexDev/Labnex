import{R as e,r as t}from"./router-W3ruk9z3.js";import{g as r}from"./react-core-eVk5PToZ.js";var n,i,o,a,s,c={exports:{}};function l(){if(i)return n;i=1;return n="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"}function u(){if(a)return o;a=1;var e=l();function t(){}function r(){}return r.resetWarningCache=t,o=function(){function n(t,r,n,i,o,a){if(a!==e){var s=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw s.name="Invariant Violation",s}}function i(){return n}n.isRequired=n;var o={array:n,bigint:n,bool:n,func:n,number:n,object:n,string:n,symbol:n,any:n,arrayOf:i,element:n,elementType:n,instanceOf:i,node:n,objectOf:i,oneOf:i,oneOfType:i,shape:i,exact:i,checkPropTypes:r,resetWarningCache:t};return o.PropTypes=o,o}}function p(){return s||(s=1,c.exports=u()()),c.exports}const f=r(p());var d,m;const h=r(function(){if(m)return d;m=1;var e="undefined"!=typeof Element,t="function"==typeof Map,r="function"==typeof Set,n="function"==typeof ArrayBuffer&&!!ArrayBuffer.isView;function i(o,a){if(o===a)return!0;if(o&&a&&"object"==typeof o&&"object"==typeof a){if(o.constructor!==a.constructor)return!1;var s,c,l,u;if(Array.isArray(o)){if((s=o.length)!=a.length)return!1;for(c=s;0!==c--;)if(!i(o[c],a[c]))return!1;return!0}if(t&&o instanceof Map&&a instanceof Map){if(o.size!==a.size)return!1;for(u=o.entries();!(c=u.next()).done;)if(!a.has(c.value[0]))return!1;for(u=o.entries();!(c=u.next()).done;)if(!i(c.value[1],a.get(c.value[0])))return!1;return!0}if(r&&o instanceof Set&&a instanceof Set){if(o.size!==a.size)return!1;for(u=o.entries();!(c=u.next()).done;)if(!a.has(c.value[0]))return!1;return!0}if(n&&ArrayBuffer.isView(o)&&ArrayBuffer.isView(a)){if((s=o.length)!=a.length)return!1;for(c=s;0!==c--;)if(o[c]!==a[c])return!1;return!0}if(o.constructor===RegExp)return o.source===a.source&&o.flags===a.flags;if(o.valueOf!==Object.prototype.valueOf&&"function"==typeof o.valueOf&&"function"==typeof a.valueOf)return o.valueOf()===a.valueOf();if(o.toString!==Object.prototype.toString&&"function"==typeof o.toString&&"function"==typeof a.toString)return o.toString()===a.toString();if((s=(l=Object.keys(o)).length)!==Object.keys(a).length)return!1;for(c=s;0!==c--;)if(!Object.prototype.hasOwnProperty.call(a,l[c]))return!1;if(e&&o instanceof Element)return!1;for(c=s;0!==c--;)if(("_owner"!==l[c]&&"__v"!==l[c]&&"__o"!==l[c]||!o.$$typeof)&&!i(o[l[c]],a[l[c]]))return!1;return!0}return o!=o&&a!=a}return d=function(e,t){try{return i(e,t)}catch(r){if((r.message||"").match(/stack|recursion/i))return!1;throw r}}}());var y,g;var b=g?y:(g=1,y=function(e,t,r,n,i,o,a,s){if(!e){var c;if(void 0===t)c=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var l=[r,n,i,o,a,s],u=0;(c=new Error(t.replace(/%s/g,function(){return l[u++]}))).name="Invariant Violation"}throw c.framesToPop=1,c}});const v=r(b);var T,x;const O=r(x?T:(x=1,T=function(e,t,r,n){var i=r?r.call(n,e,t):void 0;if(void 0!==i)return!!i;if(e===t)return!0;if("object"!=typeof e||!e||"object"!=typeof t||!t)return!1;var o=Object.keys(e),a=Object.keys(t);if(o.length!==a.length)return!1;for(var s=Object.prototype.hasOwnProperty.bind(t),c=0;c<o.length;c++){var l=o[c];if(!s(l))return!1;var u=e[l],p=t[l];if(!1===(i=r?r.call(n,u,p,l):void 0)||void 0===i&&u!==p)return!1}return!0}));function A(){return A=Object.assign||function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(e[n]=r[n])}return e},A.apply(this,arguments)}function w(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,C(e,t)}function C(e,t){return(C=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function E(e,t){if(null==e)return{};var r,n,i={},o=Object.keys(e);for(n=0;n<o.length;n++)t.indexOf(r=o[n])>=0||(i[r]=e[r]);return i}var S={BASE:"base",BODY:"body",HEAD:"head",HTML:"html",LINK:"link",META:"meta",NOSCRIPT:"noscript",SCRIPT:"script",STYLE:"style",TITLE:"title",FRAGMENT:"Symbol(react.fragment)"},j={rel:["amphtml","canonical","alternate"]},P={type:["application/ld+json"]},k={charset:"",name:["robots","description"],property:["og:type","og:title","og:url","og:image","og:image:alt","og:description","twitter:url","twitter:title","twitter:description","twitter:image","twitter:image:alt","twitter:card","twitter:site"]},I=Object.keys(S).map(function(e){return S[e]}),L={accesskey:"accessKey",charset:"charSet",class:"className",contenteditable:"contentEditable",contextmenu:"contextMenu","http-equiv":"httpEquiv",itemprop:"itemProp",tabindex:"tabIndex"},M=Object.keys(L).reduce(function(e,t){return e[L[t]]=t,e},{}),D=function(e,t){for(var r=e.length-1;r>=0;r-=1){var n=e[r];if(Object.prototype.hasOwnProperty.call(n,t))return n[t]}return null},N=function(e){var t=D(e,S.TITLE),r=D(e,"titleTemplate");if(Array.isArray(t)&&(t=t.join("")),r&&t)return r.replace(/%s/g,function(){return t});var n=D(e,"defaultTitle");return t||n||void 0},R=function(e){return D(e,"onChangeClientState")||function(){}},H=function(e,t){return t.filter(function(t){return void 0!==t[e]}).map(function(t){return t[e]}).reduce(function(e,t){return A({},e,t)},{})},_=function(e,t){return t.filter(function(e){return void 0!==e[S.BASE]}).map(function(e){return e[S.BASE]}).reverse().reduce(function(t,r){if(!t.length)for(var n=Object.keys(r),i=0;i<n.length;i+=1){var o=n[i].toLowerCase();if(-1!==e.indexOf(o)&&r[o])return t.concat(r)}return t},[])},$=function(e,t,r){var n={};return r.filter(function(t){return!!Array.isArray(t[e])||(void 0!==t[e]&&console&&console.warn,!1)}).map(function(t){return t[e]}).reverse().reduce(function(e,r){var i={};r.filter(function(e){for(var r,o=Object.keys(e),a=0;a<o.length;a+=1){var s=o[a],c=s.toLowerCase();-1===t.indexOf(c)||"rel"===r&&"canonical"===e[r].toLowerCase()||"rel"===c&&"stylesheet"===e[c].toLowerCase()||(r=c),-1===t.indexOf(s)||"innerHTML"!==s&&"cssText"!==s&&"itemprop"!==s||(r=s)}if(!r||!e[r])return!1;var l=e[r].toLowerCase();return n[r]||(n[r]={}),i[r]||(i[r]={}),!n[r][l]&&(i[r][l]=!0,!0)}).reverse().forEach(function(t){return e.push(t)});for(var o=Object.keys(i),a=0;a<o.length;a+=1){var s=o[a],c=A({},n[s],i[s]);n[s]=c}return e},[]).reverse()},z=function(e,t){if(Array.isArray(e)&&e.length)for(var r=0;r<e.length;r+=1)if(e[r][t])return!0;return!1},U=function(e){return Array.isArray(e)?e.join(""):e},B=function(e,t){return Array.isArray(e)?e.reduce(function(e,r){return function(e,t){for(var r=Object.keys(e),n=0;n<r.length;n+=1)if(t[r[n]]&&t[r[n]].includes(e[r[n]]))return!0;return!1}(r,t)?e.priority.push(r):e.default.push(r),e},{priority:[],default:[]}):{default:e}},q=function(e,t){var r;return A({},e,((r={})[t]=void 0,r))},Y=[S.NOSCRIPT,S.SCRIPT,S.STYLE],F=function(e,t){return void 0===t&&(t=!0),!1===t?String(e):String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;")},K=function(e){return Object.keys(e).reduce(function(t,r){var n=void 0!==e[r]?r+'="'+e[r]+'"':""+r;return t?t+" "+n:n},"")},V=function(e,t){return void 0===t&&(t={}),Object.keys(e).reduce(function(t,r){return t[L[r]||r]=e[r],t},t)},W=function(t,r){return r.map(function(r,n){var i,o=((i={key:n})["data-rh"]=!0,i);return Object.keys(r).forEach(function(e){var t=L[e]||e;"innerHTML"===t||"cssText"===t?o.dangerouslySetInnerHTML={__html:r.innerHTML||r.cssText}:o[t]=r[e]}),e.createElement(t,o)})},G=function(t,r,n){switch(t){case S.TITLE:return{toComponent:function(){return n=r.titleAttributes,(i={key:t=r.title})["data-rh"]=!0,o=V(n,i),[e.createElement(S.TITLE,o,t)];var t,n,i,o},toString:function(){return e=t,i=r.title,o=r.titleAttributes,a=n,s=K(o),c=U(i),s?"<"+e+' data-rh="true" '+s+">"+F(c,a)+"</"+e+">":"<"+e+' data-rh="true">'+F(c,a)+"</"+e+">";var e,i,o,a,s,c}};case"bodyAttributes":case"htmlAttributes":return{toComponent:function(){return V(r)},toString:function(){return K(r)}};default:return{toComponent:function(){return W(t,r)},toString:function(){return e=t,i=n,r.reduce(function(t,r){var n=Object.keys(r).filter(function(e){return!("innerHTML"===e||"cssText"===e)}).reduce(function(e,t){var n=void 0===r[t]?t:t+'="'+F(r[t],i)+'"';return e?e+" "+n:n},""),o=r.innerHTML||r.cssText||"",a=-1===Y.indexOf(e);return t+"<"+e+' data-rh="true" '+n+(a?"/>":">"+o+"</"+e+">")},"");var e,i}}}},Z=function(e){var t,r,n,i,o,a,s,c=e.baseTag,l=e.bodyAttributes,u=e.encode,p=e.htmlAttributes,f=e.noscriptTags,d=e.styleTags,m=e.title,h=void 0===m?"":m,y=e.titleAttributes,g=e.linkTags,b=e.metaTags,v=e.scriptTags,T={toComponent:function(){},toString:function(){return""}};if(e.prioritizeSeoTags){var x=(r=(t=e).linkTags,n=t.scriptTags,i=t.encode,o=B(t.metaTags,k),a=B(r,j),s=B(n,P),{priorityMethods:{toComponent:function(){return[].concat(W(S.META,o.priority),W(S.LINK,a.priority),W(S.SCRIPT,s.priority))},toString:function(){return G(S.META,o.priority,i)+" "+G(S.LINK,a.priority,i)+" "+G(S.SCRIPT,s.priority,i)}},metaTags:o.default,linkTags:a.default,scriptTags:s.default});T=x.priorityMethods,g=x.linkTags,b=x.metaTags,v=x.scriptTags}return{priority:T,base:G(S.BASE,c,u),bodyAttributes:G("bodyAttributes",l,u),htmlAttributes:G("htmlAttributes",p,u),link:G(S.LINK,g,u),meta:G(S.META,b,u),noscript:G(S.NOSCRIPT,f,u),script:G(S.SCRIPT,v,u),style:G(S.STYLE,d,u),title:G(S.TITLE,{title:h,titleAttributes:y},u)}},J=[],Q=function(e,t){var r=this;void 0===t&&(t="undefined"!=typeof document),this.instances=[],this.value={setHelmet:function(e){r.context.helmet=e},helmetInstances:{get:function(){return r.canUseDOM?J:r.instances},add:function(e){(r.canUseDOM?J:r.instances).push(e)},remove:function(e){var t=(r.canUseDOM?J:r.instances).indexOf(e);(r.canUseDOM?J:r.instances).splice(t,1)}}},this.context=e,this.canUseDOM=t,t||(e.helmet=Z({baseTag:[],bodyAttributes:{},htmlAttributes:{},linkTags:[],metaTags:[],noscriptTags:[],scriptTags:[],styleTags:[],title:"",titleAttributes:{}}))},X=e.createContext({}),ee=f.shape({setHelmet:f.func,helmetInstances:f.shape({get:f.func,add:f.func,remove:f.func})}),te="undefined"!=typeof document,re=function(t){function r(e){var n;return(n=t.call(this,e)||this).helmetData=new Q(n.props.context,r.canUseDOM),n}return w(r,t),r.prototype.render=function(){return e.createElement(X.Provider,{value:this.helmetData.value},this.props.children)},r}(t.Component);re.canUseDOM=te,re.propTypes={context:f.shape({helmet:f.shape()}),children:f.node.isRequired},re.defaultProps={context:{}},re.displayName="HelmetProvider";var ne=function(e,t){var r,n=document.head||document.querySelector(S.HEAD),i=n.querySelectorAll(e+"[data-rh]"),o=[].slice.call(i),a=[];return t&&t.length&&t.forEach(function(t){var n=document.createElement(e);for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&("innerHTML"===i?n.innerHTML=t.innerHTML:"cssText"===i?n.styleSheet?n.styleSheet.cssText=t.cssText:n.appendChild(document.createTextNode(t.cssText)):n.setAttribute(i,void 0===t[i]?"":t[i]));n.setAttribute("data-rh","true"),o.some(function(e,t){return r=t,n.isEqualNode(e)})?o.splice(r,1):a.push(n)}),o.forEach(function(e){return e.parentNode.removeChild(e)}),a.forEach(function(e){return n.appendChild(e)}),{oldTags:o,newTags:a}},ie=function(e,t){var r=document.getElementsByTagName(e)[0];if(r){for(var n=r.getAttribute("data-rh"),i=n?n.split(","):[],o=[].concat(i),a=Object.keys(t),s=0;s<a.length;s+=1){var c=a[s],l=t[c]||"";r.getAttribute(c)!==l&&r.setAttribute(c,l),-1===i.indexOf(c)&&i.push(c);var u=o.indexOf(c);-1!==u&&o.splice(u,1)}for(var p=o.length-1;p>=0;p-=1)r.removeAttribute(o[p]);i.length===o.length?r.removeAttribute("data-rh"):r.getAttribute("data-rh")!==a.join(",")&&r.setAttribute("data-rh",a.join(","))}},oe=function(e,t){var r,n,i=e.baseTag,o=e.htmlAttributes,a=e.linkTags,s=e.metaTags,c=e.noscriptTags,l=e.onChangeClientState,u=e.scriptTags,p=e.styleTags,f=e.title,d=e.titleAttributes;ie(S.BODY,e.bodyAttributes),ie(S.HTML,o),n=d,void 0!==(r=f)&&document.title!==r&&(document.title=U(r)),ie(S.TITLE,n);var m={baseTag:ne(S.BASE,i),linkTags:ne(S.LINK,a),metaTags:ne(S.META,s),noscriptTags:ne(S.NOSCRIPT,c),scriptTags:ne(S.SCRIPT,u),styleTags:ne(S.STYLE,p)},h={},y={};Object.keys(m).forEach(function(e){var t=m[e],r=t.newTags,n=t.oldTags;r.length&&(h[e]=r),n.length&&(y[e]=m[e].oldTags)}),t&&t(),l(e,h,y)},ae=null,se=function(e){function t(){for(var t,r=arguments.length,n=new Array(r),i=0;i<r;i++)n[i]=arguments[i];return(t=e.call.apply(e,[this].concat(n))||this).rendered=!1,t}w(t,e);var r=t.prototype;return r.shouldComponentUpdate=function(e){return!O(e,this.props)},r.componentDidUpdate=function(){this.emitChange()},r.componentWillUnmount=function(){this.props.context.helmetInstances.remove(this),this.emitChange()},r.emitChange=function(){var e,t,r=this.props.context,n=r.setHelmet,i=null,o=(e=r.helmetInstances.get().map(function(e){var t=A({},e.props);return delete t.context,t}),{baseTag:_(["href"],e),bodyAttributes:H("bodyAttributes",e),defer:D(e,"defer"),encode:D(e,"encodeSpecialCharacters"),htmlAttributes:H("htmlAttributes",e),linkTags:$(S.LINK,["rel","href"],e),metaTags:$(S.META,["name","charset","http-equiv","property","itemprop"],e),noscriptTags:$(S.NOSCRIPT,["innerHTML"],e),onChangeClientState:R(e),scriptTags:$(S.SCRIPT,["src","innerHTML"],e),styleTags:$(S.STYLE,["cssText"],e),title:N(e),titleAttributes:H("titleAttributes",e),prioritizeSeoTags:z(e,"prioritizeSeoTags")});re.canUseDOM?(t=o,ae&&cancelAnimationFrame(ae),t.defer?ae=requestAnimationFrame(function(){oe(t,function(){ae=null})}):(oe(t),ae=null)):Z&&(i=Z(o)),n(i)},r.init=function(){this.rendered||(this.rendered=!0,this.props.context.helmetInstances.add(this),this.emitChange())},r.render=function(){return this.init(),null},t}(t.Component);se.propTypes={context:ee.isRequired},se.displayName="HelmetDispatcher";var ce=["children"],le=["children"],ue=function(t){function r(){return t.apply(this,arguments)||this}w(r,t);var n=r.prototype;return n.shouldComponentUpdate=function(e){return!h(q(this.props,"helmetData"),q(e,"helmetData"))},n.mapNestedChildrenToProps=function(e,t){if(!t)return null;switch(e.type){case S.SCRIPT:case S.NOSCRIPT:return{innerHTML:t};case S.STYLE:return{cssText:t};default:throw new Error("<"+e.type+" /> elements are self-closing and can not contain children. Refer to our API for more information.")}},n.flattenArrayTypeChildren=function(e){var t,r=e.child,n=e.arrayTypeChildren;return A({},n,((t={})[r.type]=[].concat(n[r.type]||[],[A({},e.newChildProps,this.mapNestedChildrenToProps(r,e.nestedChildren))]),t))},n.mapObjectTypeChildren=function(e){var t,r,n=e.child,i=e.newProps,o=e.newChildProps,a=e.nestedChildren;switch(n.type){case S.TITLE:return A({},i,((t={})[n.type]=a,t.titleAttributes=A({},o),t));case S.BODY:return A({},i,{bodyAttributes:A({},o)});case S.HTML:return A({},i,{htmlAttributes:A({},o)});default:return A({},i,((r={})[n.type]=A({},o),r))}},n.mapArrayTypeChildrenToProps=function(e,t){var r=A({},t);return Object.keys(e).forEach(function(t){var n;r=A({},r,((n={})[t]=e[t],n))}),r},n.warnOnInvalidChildren=function(e,t){return v(I.some(function(t){return e.type===t}),"function"==typeof e.type?"You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to our API for more information.":"Only elements types "+I.join(", ")+" are allowed. Helmet does not support rendering <"+e.type+"> elements. Refer to our API for more information."),v(!t||"string"==typeof t||Array.isArray(t)&&!t.some(function(e){return"string"!=typeof e}),"Helmet expects a string as a child of <"+e.type+">. Did you forget to wrap your children in braces? ( <"+e.type+">{``}</"+e.type+"> ) Refer to our API for more information."),!0},n.mapChildrenToProps=function(t,r){var n=this,i={};return e.Children.forEach(t,function(e){if(e&&e.props){var t=e.props,o=t.children,a=E(t,ce),s=Object.keys(a).reduce(function(e,t){return e[M[t]||t]=a[t],e},{}),c=e.type;switch("symbol"==typeof c?c=c.toString():n.warnOnInvalidChildren(e,o),c){case S.FRAGMENT:r=n.mapChildrenToProps(o,r);break;case S.LINK:case S.META:case S.NOSCRIPT:case S.SCRIPT:case S.STYLE:i=n.flattenArrayTypeChildren({child:e,arrayTypeChildren:i,newChildProps:s,nestedChildren:o});break;default:r=n.mapObjectTypeChildren({child:e,newProps:r,newChildProps:s,nestedChildren:o})}}}),this.mapArrayTypeChildrenToProps(i,r)},n.render=function(){var t=this.props,r=t.children,n=E(t,le),i=A({},n),o=n.helmetData;return r&&(i=this.mapChildrenToProps(r,i)),!o||o instanceof Q||(o=new Q(o.context,o.instances)),o?e.createElement(se,A({},i,{context:o.value,helmetData:void 0})):e.createElement(X.Consumer,null,function(t){return e.createElement(se,A({},i,{context:t}))})},r}(t.Component);ue.propTypes={base:f.object,bodyAttributes:f.object,children:f.oneOfType([f.arrayOf(f.node),f.node]),defaultTitle:f.string,defer:f.bool,encodeSpecialCharacters:f.bool,htmlAttributes:f.object,link:f.arrayOf(f.object),meta:f.arrayOf(f.object),noscript:f.arrayOf(f.object),onChangeClientState:f.func,script:f.arrayOf(f.object),style:f.arrayOf(f.object),title:f.string,titleAttributes:f.object,titleTemplate:f.string,prioritizeSeoTags:f.bool,helmetData:f.object},ue.defaultProps={defer:!0,encodeSpecialCharacters:!0,prioritizeSeoTags:!1},ue.displayName="Helmet";let pe,fe,de,me={data:""},he=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,ye=/\/\*[^]*?\*\/|  +/g,ge=/\n+/g,be=(e,t)=>{let r="",n="",i="";for(let o in e){let a=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+a+";":n+="f"==o[1]?be(a,o):o+"{"+be(a,"k"==o[1]?"":t)+"}":"object"==typeof a?n+=be(a,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=a&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),i+=be.p?be.p(o,a):o+":"+a+";")}return r+(t&&i?t+"{"+i+"}":i)+n},ve={},Te=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+Te(e[r]);return t}return e};function xe(e){let t=this||{},r=e.call?e(t.p):e;return((e,t,r,n,i)=>{let o=Te(e),a=ve[o]||(ve[o]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(o));if(!ve[a]){let t=o!==e?e:(e=>{let t,r,n=[{}];for(;t=he.exec(e.replace(ye,""));)t[4]?n.shift():t[3]?(r=t[3].replace(ge," ").trim(),n.unshift(n[0][r]=n[0][r]||{})):n[0][t[1]]=t[2].replace(ge," ").trim();return n[0]})(e);ve[a]=be(i?{["@keyframes "+a]:t}:t,r?"":"."+a)}let s=r&&ve.g?ve.g:null;return r&&(ve.g=ve[a]),c=ve[a],l=t,u=n,(p=s)?l.data=l.data.replace(p,c):-1===l.data.indexOf(c)&&(l.data=u?c+l.data:l.data+c),a;var c,l,u,p})(r.unshift?r.raw?((e,t,r)=>e.reduce((e,n,i)=>{let o=t[i];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":be(e,""):!1===e?"":e}return e+n+(null==o?"":o)},""))(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,(n=t.target,"object"==typeof window?((n?n.querySelector("#_goober"):window._goober)||Object.assign((n||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:n||me),t.g,t.o,t.k);var n}xe.bind({g:1});let Oe=xe.bind({k:1});function Ae(e,t){let r=this||{};return function(){let t=arguments;return function n(i,o){let a=Object.assign({},i),s=a.className||n.className;r.p=Object.assign({theme:fe&&fe()},a),r.o=/ *go\d+/.test(s),a.className=xe.apply(r,t)+(s?" "+s:"");let c=e;return e[0]&&(c=a.as||e,delete a.as),de&&c[0]&&de(a),pe(c,a)}}}var we=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,Ce=(()=>{let e=0;return()=>(++e).toString()})(),Ee=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),Se=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:r}=t;return Se(e,{type:e.toasts.find(e=>e.id===r.id)?1:0,toast:r});case 3:let{toastId:n}=t;return{...e,toasts:e.toasts.map(e=>e.id===n||void 0===n?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+i}))}}},je=[],Pe={toasts:[],pausedAt:void 0},ke=e=>{Pe=Se(Pe,e),je.forEach(e=>{e(Pe)})},Ie={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},Le=e=>(t,r)=>{let n=((e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||Ce()}))(t,e,r);return ke({type:2,toast:n}),n.id},Me=(e,t)=>Le("blank")(e,t);Me.error=Le("error"),Me.success=Le("success"),Me.loading=Le("loading"),Me.custom=Le("custom"),Me.dismiss=e=>{ke({type:3,toastId:e})},Me.remove=e=>ke({type:4,toastId:e}),Me.promise=(e,t,r)=>{let n=Me.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let i=t.success?we(t.success,e):void 0;return i?Me.success(i,{id:n,...r,...null==r?void 0:r.success}):Me.dismiss(n),e}).catch(e=>{let i=t.error?we(t.error,e):void 0;i?Me.error(i,{id:n,...r,...null==r?void 0:r.error}):Me.dismiss(n)}),e};var De,Ne,Re,He,_e=(e,t)=>{ke({type:1,toast:{id:e,height:t}})},$e=()=>{ke({type:5,time:Date.now()})},ze=new Map,Ue=e=>{let{toasts:r,pausedAt:n}=((e={})=>{let[r,n]=t.useState(Pe),i=t.useRef(Pe);t.useEffect(()=>(i.current!==Pe&&n(Pe),je.push(n),()=>{let e=je.indexOf(n);e>-1&&je.splice(e,1)}),[]);let o=r.toasts.map(t=>{var r,n,i;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(n=e[t.type])?void 0:n.duration)||(null==e?void 0:e.duration)||Ie[t.type],style:{...e.style,...null==(i=e[t.type])?void 0:i.style,...t.style}}});return{...r,toasts:o}})(e);t.useEffect(()=>{if(n)return;let e=Date.now(),t=r.map(t=>{if(t.duration===1/0)return;let r=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(!(r<0))return setTimeout(()=>Me.dismiss(t.id),r);t.visible&&Me.dismiss(t.id)});return()=>{t.forEach(e=>e&&clearTimeout(e))}},[r,n]);let i=t.useCallback(()=>{n&&ke({type:6,time:Date.now()})},[n]),o=t.useCallback((e,t)=>{let{reverseOrder:n=!1,gutter:i=8,defaultPosition:o}=t||{},a=r.filter(t=>(t.position||o)===(e.position||o)&&t.height),s=a.findIndex(t=>t.id===e.id),c=a.filter((e,t)=>t<s&&e.visible).length;return a.filter(e=>e.visible).slice(...n?[c+1]:[0,c]).reduce((e,t)=>e+(t.height||0)+i,0)},[r]);return t.useEffect(()=>{r.forEach(e=>{if(e.dismissed)((e,t=1e3)=>{if(ze.has(e))return;let r=setTimeout(()=>{ze.delete(e),ke({type:4,toastId:e})},t);ze.set(e,r)})(e.id,e.removeDelay);else{let t=ze.get(e.id);t&&(clearTimeout(t),ze.delete(e.id))}})},[r]),{toasts:r,handlers:{updateHeight:_e,startPause:$e,endPause:i,calculateOffset:o}}},Be=Oe`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,qe=Oe`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Ye=Oe`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Fe=Ae("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Be} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${qe} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Ye} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,Ke=Oe`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Ve=Ae("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${Ke} 1s linear infinite;
`,We=Oe`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,Ge=Oe`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Ze=Ae("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${We} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${Ge} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Je=Ae("div")`
  position: absolute;
`,Qe=Ae("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Xe=Oe`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,et=Ae("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Xe} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,tt=({toast:e})=>{let{icon:r,type:n,iconTheme:i}=e;return void 0!==r?"string"==typeof r?t.createElement(et,null,r):r:"blank"===n?null:t.createElement(Qe,null,t.createElement(Ve,{...i}),"loading"!==n&&t.createElement(Je,null,"error"===n?t.createElement(Fe,{...i}):t.createElement(Ze,{...i})))},rt=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,nt=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,it=Ae("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ot=Ae("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,at=t.memo(({toast:e,position:r,style:n,children:i})=>{let o=e.height?((e,t)=>{let r=e.includes("top")?1:-1,[n,i]=Ee()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[rt(r),nt(r)];return{animation:t?`${Oe(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${Oe(i)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||r||"top-center",e.visible):{opacity:0},a=t.createElement(tt,{toast:e}),s=t.createElement(ot,{...e.ariaProps},we(e.message,e));return t.createElement(it,{className:e.className,style:{...o,...n,...e.style}},"function"==typeof i?i({icon:a,message:s}):t.createElement(t.Fragment,null,a,s))});De=t.createElement,be.p=Ne,pe=De,fe=Re,de=He;var st=({id:e,className:r,style:n,onHeightUpdate:i,children:o})=>{let a=t.useCallback(t=>{if(t){let r=()=>{let r=t.getBoundingClientRect().height;i(e,r)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,i]);return t.createElement("div",{ref:a,className:r,style:n},o)},ct=xe`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,lt=({reverseOrder:e,position:r="top-center",toastOptions:n,gutter:i,children:o,containerStyle:a,containerClassName:s})=>{let{toasts:c,handlers:l}=Ue(n);return t.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...a},className:s,onMouseEnter:l.startPause,onMouseLeave:l.endPause},c.map(n=>{let a=n.position||r,s=((e,t)=>{let r=e.includes("top"),n=r?{top:0}:{bottom:0},i=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:Ee()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...n,...i}})(a,l.calculateOffset(n,{reverseOrder:e,gutter:i,defaultPosition:r}));return t.createElement(st,{id:n.id,key:n.id,onHeightUpdate:l.updateHeight,className:n.visible?ct:"",style:s},"custom"===n.type?we(n.message,n):o?o(n):t.createElement(at,{toast:n,position:a}))}))},ut=Me;export{lt as O,ut as V,ue as W,Me as c,re as q};
