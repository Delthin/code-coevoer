import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import { getGitLogPath } from './utils/file';

export async function listenForCommitChanges(): Promise<void> {
    // 获取当前工作目录
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('没有打开的工作区');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // 获取 .git/logs/HEAD 文件的路径
    const gitLogPath = getGitLogPath(workspacePath);
    console.log('当前gitlog文件路径：' + gitLogPath);
    // 监听 .git/logs/HEAD 文件的变化
    const watcher = chokidar.watch(gitLogPath, {
        persistent: true,
        ignoreInitial: true,
    });
    vscode.window.showInformationMessage('正在监听 .git 文件夹变化...');

    watcher.on('change', async (path) => {
        console.log(`File ${path} has been changed`);
        try {
            // 触发阶段 2：传递工作目录路径给下游
            vscode.window.showInformationMessage('检测到 commit 信息变化，开始处理...');
            await vscode.commands.executeCommand('code-coevoer.start', workspacePath);
        } catch (error) {
            vscode.window.showErrorMessage('处理 commit 信息失败');
        }
    });

    watcher.on('error', (error) => {
        console.error(`Watcher error: ${error}`);
        vscode.window.showErrorMessage('监听 .git 文件夹变化失败');
    });
}