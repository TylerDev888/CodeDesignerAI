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
exports.BasePanelProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const helpers_1 = require("../../helpers");
/**
 * Base class for panels using WebviewViewProvider
 * htmlFileName: the HTML file to load
 */
class BasePanelProvider {
    viewId;
    htmlFileName;
    providerName;
    constructor(viewId, htmlFileName, providerName) {
        this.viewId = viewId;
        this.htmlFileName = htmlFileName;
        this.providerName = providerName;
    }
    // Register the provider with VS Code
    register(context) {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(this.viewId, this));
    }
    // This is required by WebviewViewProvider
    resolveWebviewView(webviewView) {
        // Common setup
        webviewView.webview.options = {
            enableScripts: true
        };
        // Load HTML from file
        webviewView.webview.html = this.loadHtml(webviewView.webview);
        // Delegate child-specific behavior
        this.onDidResolveWebviewView(webviewView);
    }
    // Load HTML and optionally replace nonce
    loadHtml(webview) {
        // Compute the provider folder name by stripping "Provider" from the class name
        const providerFolder = this.providerName;
        // Path to compiled JS output + provider folder
        const htmlPath = path.join(__dirname, '..', '..', providerFolder, this.htmlFileName);
        let html = fs.readFileSync(htmlPath, 'utf8');
        // Add nonce for inline scripts
        const nonce = (0, helpers_1.getNonce)();
        html = html.replace('<script>', `<script nonce="${nonce}">`);
        return html;
    }
}
exports.BasePanelProvider = BasePanelProvider;
//# sourceMappingURL=BasePanelProvider.js.map