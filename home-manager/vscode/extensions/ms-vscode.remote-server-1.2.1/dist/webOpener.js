var e={d:(r,o)=>{for(var t in o)e.o(o,t)&&!e.o(r,t)&&Object.defineProperty(r,t,{enumerable:!0,get:o[t]})},o:(e,r)=>Object.prototype.hasOwnProperty.call(e,r)},r={};async function o(e,r){if(!e.workspace)return;let o,t="folderUri"in e.workspace?e.workspace.folderUri:e.workspace.workspaceUri;if("vscode-remote"===t.scheme&&t.authority&&(o=t.authority.includes(":")?t.authority.split(":")[0]:t.authority),!o)throw Error("Cannot resolve remote host from path!");const n=function(e){return e.with({authority:(r=e.authority,"tunnel+"+r)});var r}(t);e.workbenchOptions={...e.workbenchOptions,productConfiguration:{extensionAllowedProposedApi:["ms-vscode.remote-server"],extensionEnabledApiProposals:{"ms-vscode.remote-server":["resolvers"]}},commands:[{id:"remote-tunnels.internal.getTunnelKeyFromHash",handler:()=>window.location.hash.slice(1)}],remoteAuthority:n.authority},e.workspace="folderUri"in e.workspace?{folderUri:n}:{workspaceUri:n}}e.d(r,{Z:()=>o});var t=r.Z;export{t as default};