import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';

// 定义提交信息的接口
interface CommitInfo {
    commitHash: string;
    commitMessage: string;
    modifiedFiles: string[];
    diffContent: string[];
}

// 获取提交文件信息的函数
export async function getCommitFiles(workspacePath: string, compareWithPrevious: boolean = true): Promise<CommitInfo> {
    const git: SimpleGit = simpleGit(workspacePath);
    try {
        // 获取最新一次提交的哈希值和提交信息
        const log = await git.log(['-n', '1']);
        const currentCommitHash = log.latest ? log.latest.hash : '';
        const commitMessage = log.latest ? log.latest.message : '';

        // 确定要比较的提交哈希值
        const compareCommitHash = compareWithPrevious
            ? (await git.raw(['rev-parse', `${currentCommitHash}^`])).trim() // 父提交
            : '';

        // 获取当前提交和前一个提交之间的差异（或当前提交的差异）
        const diffArgs = compareWithPrevious
            ? [compareCommitHash, currentCommitHash] // 调整顺序
            : [currentCommitHash];

        // 获取完整的差异内容
        const fullDiff = await git.raw(['diff', ...diffArgs]);

        // 从差异中提取修改的文件列表
        const modifiedFiles = await extractModifiedFiles(git, diffArgs);

        // 提取每个文件的具体修改内容
        const fileDiffs = extractFileDiffs(fullDiff, modifiedFiles);

        return {
            commitHash: currentCommitHash,
            commitMessage,
            modifiedFiles,
            diffContent: fileDiffs
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`获取提交信息失败: ${errorMessage}`);
        throw error;
    }
}

// 提取修改文件列表的辅助函数
async function extractModifiedFiles(git: SimpleGit, diffArgs: string[]): Promise<string[]> {
    try {
        // 使用 git diff-tree 获取修改的文件列表
        const modifiedFilesOutput = await git.raw(['diff-tree', '-r', '--no-commit-id', '--name-only', ...diffArgs]);

        // 将输出拆分为文件路径数组，去除任何空字符串
        return modifiedFilesOutput.trim().split('\n').filter(file => file.trim() !== '');
    } catch (error) {
        console.error('提取修改文件列表时出错:', error);
        return [];
    }
}

// 提取每个文件的具体修改内容的辅助函数
function extractFileDiffs(fullDiff: string, modifiedFiles: string[]): string[] {
    const fileDiffs: string[] = [];
    const diffSections = fullDiff.split('diff --git');

    modifiedFiles.forEach(file => {
        const fileDiff = diffSections.find(section => section.includes(`a/${file}`) || section.includes(`b/${file}`));
        if (fileDiff) {
            fileDiffs.push(`diff --git${fileDiff}`);
        } else {
            fileDiffs.push('');
        }
    });

    return fileDiffs;
}