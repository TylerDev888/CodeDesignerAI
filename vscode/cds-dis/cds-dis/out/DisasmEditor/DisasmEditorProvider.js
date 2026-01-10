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
exports.DisasmEditorProvider = void 0;
const fs = __importStar(require("fs"));
const helpers_1 = require("../helpers");
const BaseEditorProvider_1 = require("../BaseProvider/BaseEditorProvider");
class DisasmEditorProvider extends BaseEditorProvider_1.BaseEditorProvider {
    constructor() {
        super('DisasmEditorProvider.html', "DisasmEditor");
    }
    async onDidResolveWebview(webviewPanel, document) {
        fs.readFile(document.uri.fsPath, (err, data) => {
            if (err) {
                webviewPanel.webview.postMessage({
                    type: 'error',
                    message: err.message
                });
                return;
            }
            const rows = (0, helpers_1.disassemble)(data);
            webviewPanel.webview.postMessage({
                type: 'disasm',
                rows
            });
        });
    }
}
exports.DisasmEditorProvider = DisasmEditorProvider;
//# sourceMappingURL=DisasmEditorProvider.js.map