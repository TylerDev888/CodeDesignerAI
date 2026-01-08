import * as vscode from 'vscode';
import { exec } from 'child_process';

let outputChannel: vscode.OutputChannel;

interface CompilerResult {
    cheatCodes?: string;
    debugMessages?: string[];
}

export function activate(context: vscode.ExtensionContext) {

    outputChannel = vscode.window.createOutputChannel('CDS Assembler');

    const provider = new CDSAssemblerPanelProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'cdsAssemblerPanel',
            provider
        )
    );
}

class CDSAssemblerPanelProvider implements vscode.WebviewViewProvider {

    private webview?: vscode.Webview;

    resolveWebviewView(webviewView: vscode.WebviewView) {

        this.webview = webviewView.webview;

        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this.getHtml(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {

                case 'connect':
                    vscode.window.showInformationMessage(
                        'Connect clicked (emulator hookup later)'
                    );
                    break;

                case 'compile':
                    this.runCds('-c');
                    break;

                case 'decompile':
                    this.runCds('-d');
                    break;
            }
        });
    }

    private getWorkspaceRoot(): string | null {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return null;
        }
        return folders[0].uri.fsPath;
    }

    private runCds(option: string) {

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file.');
            return;
        }

        const sourcePath = editor.document.uri.fsPath;

        const exePath =
            'C:\\Users\\tholu\\source\\repos\\CodeDesignerAI\\CodeDesigner.ConsoleApp\\bin\\Debug\\net9.0\\CodeDesigner.ConsoleApp.exe';

        const command = `"${exePath}" CDS ${option} -f "${sourcePath}"`;

        outputChannel.clear();
        outputChannel.show(true);
        outputChannel.appendLine(`> ${command}\n`);
        //outputChannel.appendLine(this.getWorkspaceRoot() ?? 'No workspace root');

        exec(command, (error, stdout, stderr) => {

            if (stderr) {
                outputChannel.appendLine(stderr);
            }

            if (error) {
                outputChannel.appendLine(`ERROR: ${error.message}`);
                return;
            }

            try {
                const result: CompilerResult = JSON.parse(stdout);

                // Show debug messages
                result.debugMessages?.forEach(msg =>
                    outputChannel.appendLine(msg)
                );

                // Push cheatCodes back into the panel textarea
                if (result.cheatCodes && this.webview) {
                    this.webview.postMessage({
                        command: 'setCode',
                        code: result.cheatCodes
                    });
                }

            } catch (e) {
                outputChannel.appendLine('Failed to parse compiler JSON output');
                outputChannel.appendLine(stdout);
            }
        });
    }

    private getHtml(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               style-src 'unsafe-inline';
               script-src 'nonce-${nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<style>
body {
    margin: 0;
    padding: 10px;
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
}

select, textarea, button {
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
}

select, textarea {
    width: 100%;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    margin-bottom: 8px;
    padding: 4px;
}

textarea {
    height: 220px;
    resize: vertical;
    font-family: var(--vscode-editor-font-family);
    font-size: var(--vscode-editor-font-size);
}

button {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    padding: 4px 10px;
    cursor: pointer;
}

button:hover {
    background: var(--vscode-button-hoverBackground);
}

button:disabled {
    opacity: 0.5;
    cursor: default;
}

.row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}
</style>
</head>

<body>

<div class="row">
    <select>
        <option>Select Emulator...</option>
    </select>
    <button id="connectBtn">Connect</button>
    <button disabled>Send</button>
</div>

<textarea id="codeArea"
    placeholder="Paste CDS source here (optional)..."></textarea>

<div class="row">
    <button id="compileBtn">Compile</button>
    <button id="decompileBtn">Decompile</button>
</div>

<script nonce="${nonce}">
const vscode = acquireVsCodeApi();

document.getElementById('connectBtn').onclick = () => {
    vscode.postMessage({ command: 'connect' });
};

document.getElementById('compileBtn').onclick = () => {
    vscode.postMessage({ command: 'compile' });
};

document.getElementById('decompileBtn').onclick = () => {
    vscode.postMessage({ command: 'decompile' });
};

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'setCode') {
        document.getElementById('codeArea').value = message.code;
    }
});
</script>

</body>
</html>`;
    }
}

function getNonce() {
    let text = '';
    const chars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
}
