"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class ViewLoader {
    constructor(fileUri) {
        this._panel = vscode.window.createWebviewPanel("configView", "Config View", vscode.ViewColumn.One, {});
        this._panel.webview.html = this.getWebviewContent(fileUri.fsPath);
    }
    getWebviewContent(filepath) {
        return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vite App</title>
        <script type="module" crossorigin src="/assets/index.js"></script>
        <link rel="stylesheet" href="/assets/index.d3854ff8.css">
      </head>
      <body>
        <div id="app" style="height: 100%"></div>
        
      </body>
    </html>
    `;
    }
}
exports.default = ViewLoader;
//# sourceMappingURL=ViewLoader.js.map