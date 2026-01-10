import * as vscode from 'vscode';
import { DisasmEditorProvider } from './providers/DisasmEditor/DisasmEditorProvider';
import { DisasmPanelProvider } from './providers/DisasmPanel/DisasmPanelProvider';

export function activate(context: vscode.ExtensionContext) {

    // Custom editor
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            'disasm.disasmEditor',
            new DisasmEditorProvider(),
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    // Sidebar panel
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'disasm.disasmPanel',
            new DisasmPanelProvider()
        )
    );

    // Command to show sidebar
    context.subscriptions.push(
        vscode.commands.registerCommand('disasm.showPanel', () => {
            vscode.commands.executeCommand(
                'workbench.view.extension.disasmSidebar'
            );
        })
    );
}

export function deactivate() {}
