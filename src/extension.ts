import * as vscode from 'vscode';
import { listenForCommitChanges } from './listenCommit';
import { processCommit } from './processCommit';

class SidebarItem extends vscode.TreeItem {
    
}

class SidebarDataProvider implements vscode.TreeDataProvider<SidebarItem> {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined> = new vscode.EventEmitter<SidebarItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined> = this._onDidChangeTreeData.event;

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

let statusBarItem: vscode.StatusBarItem;

function updateStatusBarItem() {
    const enabled = vscode.workspace.getConfiguration('code-coevoer').get('enable');
    statusBarItem.text = `$(${enabled ? 'copilot' : 'copilot-error'}) Code Coevoer`;
}

export function activate(context: vscode.ExtensionContext) {
    // 创建状态栏项
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(copilot) Code Coevoer";
    statusBarItem.tooltip = "Code-Coevoer 设置";
    statusBarItem.command = 'code-coevoer.showQuickPick';
    statusBarItem.show();

    // 注册快速选择命令
    let disposable = vscode.commands.registerCommand('code-coevoer.showQuickPick', async () => {
        const items: vscode.QuickPickItem[] = [
            {
                label: "$(settings-gear) Code-Coevoer 设置",
                description: "打开设置界面",
            },
            {
                label: `$(${vscode.workspace.getConfiguration('code-coevoer').get('enable') ? 'check' : 'x'}) Code Coevoer`,
                description: "启用/禁用插件",
            }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Code-Coevoer 设置'
        });

        if (selected) {
            if (selected.label.includes('设置')) {
                vscode.commands.executeCommand('workbench.action.openSettings', 'code-coevoer');
            } else {
                const config = vscode.workspace.getConfiguration('code-coevoer');
                const currentEnabled = config.get('enable');
                await config.update('enable', !currentEnabled, true);
                // vscode.window.showInformationMessage(
                //     `Code-Coevoer 已${!currentEnabled ? '启用' : '禁用'}`
                // );
                // 更新状态栏图标
                updateStatusBarItem();
            }
        }
    });

    context.subscriptions.push(disposable, statusBarItem);


    const dataProvider = new SidebarDataProvider();

    vscode.window.createTreeView('code-coevoer-view', {
        treeDataProvider: dataProvider
    });

    const showSidebarCommand = vscode.commands.registerCommand('code-coevoer.showSidebar', () => {
        vscode.commands.executeCommand('workbench.view.extension.code-coevoer-sidebar');
    });

    context.subscriptions.push(showSidebarCommand);

    // 监听配置变更
    vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('code-coevoer.enable')) {
            // 配置更改时重新执行监听函数
            vscode.window.showInformationMessage(`Code Coevoer插件当前已${vscode.workspace.getConfiguration('code-coevoer').get('enable') ? '启用' : '禁用'}`);
            await listenForCommitChanges();
            updateStatusBarItem();
        }
    }, null, context.subscriptions);

    listenForCommitChanges();

    const processCommitCommand = vscode.commands.registerCommand('code-coevoer.start', (workspacePath: string) => {
        processCommit(workspacePath);
    });

    context.subscriptions.push(processCommitCommand);

    vscode.window.showInformationMessage(`Code Coevoer插件当前已${vscode.workspace.getConfiguration('code-coevoer').get('enable') ? '启用' : '禁用'}`);
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
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}