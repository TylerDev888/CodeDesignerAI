import * as vscode from 'vscode';
import { BasePanelProvider } from '../BaseProvider/BasePanelProvider';

export class DisasmPanelProvider extends BasePanelProvider {
    constructor() {
        super('disasmPanel', 'DisasmPanelProvider.html', "DisasmPanel"); // HTML file
    }

    protected onDidResolveWebviewView(webviewView: vscode.WebviewView) {
        // Listen to messages from the webview
        webviewView.webview.onDidReceiveMessage(msg => {
            if (msg.command === 'connect') {
                vscode.window.showInformationMessage('Panel works!');
            }
        });
    }
}
