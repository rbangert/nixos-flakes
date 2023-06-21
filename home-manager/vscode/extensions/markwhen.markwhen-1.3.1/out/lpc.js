"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lpc = void 0;
const nonce_1 = require("./utilities/nonce");
const lpc = (webview, updateText, allowedSource, showInEditor) => {
    const calls = new Map();
    const postRequest = (type, params) => {
        const id = (0, nonce_1.getNonce)();
        return new Promise((resolve, reject) => {
            calls.set(id, { resolve, reject });
            post({
                type,
                request: true,
                id,
                params,
            });
        });
    };
    const postResponse = (type, id, params) => post({ type, response: true, id, params });
    const post = (message) => webview.postMessage(message);
    webview.onDidReceiveMessage((e) => {
        if (!e.id) {
            throw new Error("No id");
        }
        if (e.response) {
            calls.get(e.id)?.resolve(e);
            calls.delete(e.id);
        }
        else if (e.request) {
            switch (e.type) {
                case "update":
                    updateText(e.params.text);
                    postResponse("update", e.id);
                    break;
                case "canUseSource":
                    allowedSource(e.params.source);
                    break;
                case "showInEditor":
                    showInEditor(e.params.location);
            }
        }
        else {
            throw new Error("Not a request or response");
        }
    });
    const hoverFromEditor = (index) => postRequest("hoverFromEditor", { index });
    const updateWebviewText = (text) => postRequest("update", { text });
    const scrollTo = (path) => postRequest("scrollTo", { path });
    const allowedSources = (sources) => postRequest("canUseSource", { sources });
    return { hoverFromEditor, updateWebviewText, scrollTo, allowedSources };
};
exports.lpc = lpc;
//# sourceMappingURL=lpc.js.map