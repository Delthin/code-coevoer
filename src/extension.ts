import * as vscode from 'vscode';
import { listenForCommitChanges } from './listenCommit';
import { processCommit } from './processCommit';
import { ChatViewProvider } from './view/chatViewProvider';
import { detectProjectLanguage } from './utils/languageDetector';

declare global {
    var chatViewProvider: import('./view/chatViewProvider').ChatViewProvider;
    interface Global {
        chatViewProvider: import('./view/chatViewProvider').ChatViewProvider;
    }
}

let statusBarItem: vscode.StatusBarItem;

function updateStatusBarItem() {
    const enabled = vscode.workspace.getConfiguration('code-coevoer').get('enable');
    statusBarItem.text = `$(${enabled ? 'light-bulb' : 'light-bulb-autofix'}) Code Coevoer`;
}

function initializeStatusBar(): vscode.StatusBarItem {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(light-bulb) Code Coevoer";
    statusBarItem.tooltip = "Code-Coevoer 设置";
    statusBarItem.command = 'code-coevoer.showQuickPick';
    statusBarItem.show();
    return statusBarItem;
}

async function handleQuickPickSelection(selected: vscode.QuickPickItem) {
    const config = vscode.workspace.getConfiguration('code-coevoer');

    if (selected.label.includes('设置')) {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'code-coevoer');
    } else if (selected.label.includes('显示')) {
        await vscode.commands.executeCommand('workbench.view.extension.code-coevoer-sidebar');
    } else if (selected.label.includes('自动创建')) {
        const currentAutoOpen = config.get('autoOpenFile');
        await config.update('autoOpenFile', !currentAutoOpen, true);
    } else {
        const currentEnabled = config.get('enable');
        await config.update('enable', !currentEnabled, true);
        updateStatusBarItem();
    }
}

function registerQuickPickCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('code-coevoer.showQuickPick', async () => {
        const config = vscode.workspace.getConfiguration('code-coevoer');
        const items: vscode.QuickPickItem[] = [
            {
                label: "$(settings-gear) Code-Coevoer 设置",
                description: "打开设置界面",
            },
            {
                label: `$(${config.get('enable') ? 'check' : 'x'}) Code Coevoer`,
                description: "启用/禁用插件",
            },
            {
                label: `$(${config.get('autoOpenFile') ? 'check' : 'x'}) 自动创建文件`,
                description: "启用/禁用自动创建推荐更新文件",
            },
            {
                label: "$(sidebar-right) 显示 Code-Coevoer 对话",
                description: "打开侧边栏对话视图"
            }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Code-Coevoer 设置'
        });

        if (selected) {
            await handleQuickPickSelection(selected);
        }
    });
}

function setupConfigurationListener(context: vscode.ExtensionContext) {
    return vscode.workspace.onDidChangeConfiguration(async (e) => {
        if (e.affectsConfiguration('code-coevoer.enable')) {
            const config = vscode.workspace.getConfiguration('code-coevoer');
            const enabled = config.get('enable');
            const detectedLang = await detectProjectLanguage();

            await config.update('language', detectedLang, true);
            await listenForCommitChanges();
            updateStatusBarItem();

            const message = enabled
                ? `Code-Coevoer插件当前已启用, 当前项目语言为${config.get<string>('language')}`
                : 'Code-Coevoer插件当前已禁用';

            vscode.window.showInformationMessage(message);
        }
    });
}

function registerChatViewProvider(context: vscode.ExtensionContext): ChatViewProvider {
    const chatViewProvider = new ChatViewProvider(context.extensionUri, context.globalState);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('code-coevoer.chatView', chatViewProvider)
    );
    return chatViewProvider;
}

function registerProcessCommitCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('code-coevoer.start', (workspacePath: string) => {
        processCommit(workspacePath);
    });
}

export async function activate(context: vscode.ExtensionContext) {
    // 初始化状态栏
    statusBarItem = initializeStatusBar();

    // 检测并设置项目语言
    const detectedLang = await detectProjectLanguage();
    await vscode.workspace.getConfiguration('code-coevoer').update('language', detectedLang, true);

    // 注册命令和提供程序
    const quickPickCommand = registerQuickPickCommand();
    const chatViewProvider = registerChatViewProvider(context);
    const processCommitCommand = registerProcessCommitCommand();
    const configListener = setupConfigurationListener(context);

    // 添加到订阅列表
    context.subscriptions.push(
        statusBarItem,
        quickPickCommand,
        processCommitCommand,
        configListener
    );

    // 设置全局变量
    global.chatViewProvider = chatViewProvider;

    // 启动监听
    await listenForCommitChanges();

    // 显示初始状态
    const config = vscode.workspace.getConfiguration('code-coevoer');
    const message = config.get('enable')
        ? `Code-Coevoer插件当前已启用, 当前项目语言为${config.get<string>('language')}`
        : 'Code-Coevoer插件当前已禁用';

    // 使用 withProgress 显示临时消息
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false
    }, async (progress) => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒后自动消失
    });

    // 检查 API Key
    const apiKey = config.get<string>('apikey');
    console.log('API Key:', apiKey);

    if (!apiKey) {
        const result = await vscode.window.showWarningMessage(
            'Code-Coevoer 需要设置 API Key 才能正常工作',
            '去设置'
        );

        if (result === '去设置') {
            await vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'code-coevoer.apikey'
            );
            return; // 终止激活直到用户设置 API Key
        }
    }
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