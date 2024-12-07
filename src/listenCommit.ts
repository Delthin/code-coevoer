import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import { getGitLogPath } from './utils/file';

let watcher: chokidar.FSWatcher | undefined;

export async function listenForCommitChanges(): Promise<void> {
    const config = vscode.workspace.getConfiguration('code-coevoer');
    const isEnabled = config.get<boolean>('enable');

    // 如果插件被禁用，停止现有的监听
    if (!isEnabled) {
        if (watcher) {
            await watcher.close();
            watcher = undefined;
        }
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('没有打开的工作区');
        return;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const gitLogPath = getGitLogPath(workspacePath);

    // 如果已经在监听，先停止
    if (watcher) {
        await watcher.close();
    }

    // 开始新的监听
    watcher = chokidar.watch(gitLogPath, {
        persistent: true,
        ignoreInitial: true,
    });

    // 使用 withProgress 显示临时消息
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在监听git仓库变化……',
        cancellable: false
    }, async (progress) => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒后自动消失
    });

    watcher.on('change', async (path) => {
        // 再次检查是否启用，以防在监听过程中被禁用
        if (!vscode.workspace.getConfiguration('code-coevoer').get<boolean>('enable')) {
            return;
        }
        
        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: '检测到新的 commit 信息，正在处理……',
                cancellable: false
            }, async (progress) => {
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒后自动消失
            }); 
            await vscode.commands.executeCommand('code-coevoer.start', workspacePath);
        } catch (error) {
            vscode.window.showErrorMessage('处理 commit 信息失败');
        }
    });

    watcher.on('error', (error) => {
        console.error(`Watcher error: ${error}`);
        vscode.window.showErrorMessage('监听 git 文件夹变化失败');
    });
}