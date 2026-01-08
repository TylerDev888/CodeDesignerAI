"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
function activate(context) {
    context.subscriptions.push(vscode.window.registerCustomEditorProvider("cdsDisasm.binEditor", new BinEditorProvider(), { webviewOptions: { retainContextWhenHidden: true } }));
}
class BinEditorProvider {
    async openCustomDocument(uri) {
        return { uri, dispose() { } };
    }
    async resolveCustomEditor(document, webviewPanel) {
        webviewPanel.webview.options = { enableScripts: true };
        // Set a loading placeholder immediately
        webviewPanel.webview.html = this.getHtml();
        // Async read binary
        fs.readFile(document.uri.fsPath, (err, data) => {
            if (err) {
                webviewPanel.webview.postMessage({ type: "error", message: err.message });
                return;
            }
            const rows = disassemble(data);
            webviewPanel.webview.postMessage({ type: "disasm", rows });
        });
    }
    getHtml() {
        const nonce = getNonce();
        return `
<!DOCTYPE html>
<html>
<head>
<style>
body { margin: 0; font-family: monospace; }
#grid { outline: none; height: 100vh; overflow: auto; }
.row { display: grid; grid-template-columns: 10ch 26ch 18ch 8ch 26ch 1fr; padding: 2px 6px; cursor: default; }
.row.active { background: var(--vscode-editor-selectionBackground); }
.addr { color: #c586c0; }
.bytes { color: #9cdcfe; }
.label { color: #4ec9b0; }
.op { color: #dcdcaa; }
.args { color: #ce9178; }
.comment { color: #6a9955; }
</style>
</head>
<body>
<div id="grid" tabindex="0">Loading BIN...</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const grid = document.getElementById("grid");
let cursor = 0;

window.addEventListener("message", event => {
  const msg = event.data;
  if (msg.type === "disasm") render(msg.rows);
  if (msg.type === "error") grid.textContent = "Error: " + msg.message;
});

function render(rows) {
  grid.innerHTML = "";
  rows.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.index = i;
    if (i === cursor) row.classList.add("active");
    row.innerHTML = \`
      <span class="addr">\${r.addr}</span>
      <span class="bytes">\${r.bytes}</span>
      <span class="label">\${r.label}</span>
      <span class="op">\${r.op}</span>
      <span class="args">\${r.args}</span>
      <span class="comment">\${r.comment}</span>
    \`;
    row.onclick = () => { cursor = i; updateCursor(); };
    grid.appendChild(row);
  });
}

grid.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") cursor++;
  if (e.key === "ArrowUp") cursor--;
  cursor = Math.max(0, Math.min(cursor, grid.children.length - 1));
  updateCursor();
});

function updateCursor() {
  [...grid.children].forEach(r => r.classList.remove("active"));
  grid.children[cursor]?.classList.add("active");
  grid.children[cursor]?.scrollIntoView({ block: "nearest" });
}
</script>
</body>
</html>
`;
    }
}
/* ---------------- DISASSEMBLY ---------------- */
function disassemble(buffer) {
    const rows = [];
    let addr = 0x00370F6C;
    for (let i = 0; i < buffer.length; i += 4) {
        const bytes = buffer.slice(i, i + 4);
        if (bytes.length < 4)
            break;
        // Little-endian
        const bytesLE = Array.from(bytes).reverse().map(b => b.toString(16).padStart(2, "0")).join(" ");
        rows.push({
            addr: addr.toString(16).toUpperCase().padStart(8, "0"),
            bytes: bytesLE,
            label: i === 0 ? "FUNC_" + addr.toString(16).toUpperCase() : "",
            op: "nop",
            args: "",
            comment: ""
        });
        addr += 4;
    }
    return rows;
}
function getNonce() {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++)
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    return text;
}
function deactivate() { }
//# sourceMappingURL=extension.js.map