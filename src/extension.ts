import * as vscode from 'vscode';
import { listenForCommitChanges } from './listenCommit';
import { processCommit } from './processCommit';
import { callLLMApi } from './utils/llmApi';

class SidebarItem extends vscode.TreeItem {
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
    }
}

class SidebarDataProvider implements vscode.TreeDataProvider<SidebarItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined> = new vscode.EventEmitter<SidebarItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined> = this._onDidChangeTreeData.event;

    constructor() {}

    getTreeItem(element: SidebarItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SidebarItem): Thenable<SidebarItem[]> {
        if (!element) {
            return Promise.resolve([
                new SidebarItem('Welcome to Code Coevoer', vscode.TreeItemCollapsibleState.None),
                new SidebarItem('Git Commit Info', vscode.TreeItemCollapsibleState.Collapsed)
            ]);
        }
        if (element.label === 'Git Commit Info') {
            return Promise.resolve([
                new SidebarItem('Commit 1: Fixed a bug', vscode.TreeItemCollapsibleState.None),
                new SidebarItem('Commit 2: Added new feature', vscode.TreeItemCollapsibleState.None),
                new SidebarItem('Commit 3: Updated documentation', vscode.TreeItemCollapsibleState.None)
            ]);
        }
        return Promise.resolve([]);
    }
}

export function activate(context: vscode.ExtensionContext) {
    const dataProvider = new SidebarDataProvider();

    vscode.window.createTreeView('code-coevoer-view', {
        treeDataProvider: dataProvider
    });

    const showSidebarCommand = vscode.commands.registerCommand('code-coevoer.showSidebar', () => {
        vscode.commands.executeCommand('workbench.view.extension.code-coevoer-sidebar');
    });

    context.subscriptions.push(showSidebarCommand);

    listenForCommitChanges();

    const processCommitCommand = vscode.commands.registerCommand('code-coevoer.start', (workspacePath: string) => {
        processCommit(workspacePath);
    });

    context.subscriptions.push(processCommitCommand);

    vscode.window.showInformationMessage('Code Coevoer插件已启动，正在监听commit信息更新...');
}

function getWebviewContent(): string {
    return `
        <html>
        <body>
            <h1>Welcome to Code Coevoer</h1>
            <p>This is the sidebar content!</p>
        </body>
        </html>
    `;
}

export function deactivate() {
    // Nothing to do here
}