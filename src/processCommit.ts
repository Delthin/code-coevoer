import * as vscode from 'vscode';
import { getCommitFiles } from './utils/gitUtils';
import { findTestFile } from './findTestFile';
import { checkAndUpdateTests } from './checkTest';
import { getProjectTree } from './utils/file';

export async function processCommit(workspacePath: string): Promise<void> {
    try {
        const commitInfo = await getCommitFiles(workspacePath);
        if (commitInfo) {
            // 获取项目结构
            const projectStructure = await getProjectTree(workspacePath);

            // 组织成树结构
            const projectTree = JSON.stringify(projectStructure, null, 2);

            // 将 modifiedFiles 和 diffContent 组织成 map
            const fileChangesMap = new Map<string, string>();
            commitInfo.modifiedFiles.forEach((file: string, index: number) => {
                fileChangesMap.set(file, commitInfo.diffContent[index]);
                console.log(`Added to fileChangesMap: ${file} -> ${commitInfo.diffContent[index]}`);
            });


            console.log('commit信息为: ' + JSON.stringify(commitInfo, null, 2));
            console.log('项目结构为: ' + projectTree);

            // 传递给第三阶段
            const fileMapping = await findTestFile(fileChangesMap, projectTree);

            // 传递给第四阶段
            await checkAndUpdateTests(fileMapping);
        }
    } catch (error) {
        vscode.window.showErrorMessage('获取 commit 信息失败');
    }
}