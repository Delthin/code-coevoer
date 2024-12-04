import * as vscode from 'vscode';
import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';
import * as path from 'path';

function joinPaths(...paths: string[]): string {
    return path.join(...paths);
}

async function processMapping(mapping: any, rootPath: string): Promise<void> {
    const sourceFilePathUri = vscode.Uri.file(mapping.productionFilePath);
    const testFilePathUri = vscode.Uri.file(mapping.testFilePath);
    const sourceFilePathAbsolute = path.join(rootPath, sourceFilePathUri.path);
    const testFilePathAbsolute = path.join(rootPath, testFilePathUri.path);
    console.log("Absolute Source File Path:", sourceFilePathAbsolute);
    console.log("Absolute Test File Path:", testFilePathAbsolute);

    try {
        const sourceCode = (await vscode.workspace.fs.readFile(vscode.Uri.file(sourceFilePathAbsolute))).toString();
        const testCode = (await vscode.workspace.fs.readFile(vscode.Uri.file(testFilePathAbsolute))).toString();
        await processTestUpdate(mapping, sourceCode, testCode);
    } catch (error) {
        console.error('Error reading files:', error);
    }
}

async function processTestUpdate(mapping: any, sourceCode: string, testCode: string): Promise<void> {
    const prompt = `
    ### Problem:
    We have the following data:
    1. **Diff between old and new production code**:
    \`\`\`
    ${mapping.diff}
    \`\`\`
    2. **New production code**:
    \`\`\`
    ${sourceCode}
    \`\`\`
    3. **Existing test code**:
    \`\`\`
    ${testCode}
    \`\`\`
    
    ### Task:
    Please determine whether the existing test code is outdated based on the given diff.
    
    - If the test code is **not outdated**, **only** return:
    \`"0"\`.
    
    - If the test code is **outdated**, **only** return:
        - The **updated test code** with only the necessary changes to adapt to the new production code. **Do not write new test functions**; only modify the existing ones that are incorrect or broken due to changes in the production code. Ensure the updated test code is complete and will adequately test the new production code.
    
    **Important:** Please return the result in **exactly** the specified format. Do not include any additional explanations or information. Only the result as described above.
    `;

    const gptResponse = await callLLMApi(prompt);
    await handleGptResponse(gptResponse);
}

async function handleGptResponse(gptResponse: string): Promise<void> {
    try {
        const parsedResponse = (JSON.parse(gptResponse)).choices[0].message.content;
        if (parsedResponse.trim() === "0") {
            vscode.window.showInformationMessage('检测到测试代码无需更新。');
        } else {
            const cleanResponse = parsedResponse
                .replace(/^```c[\r\n]*/, '')
                .replace(/^```java[\r\n]*/, '')
                .replace(/[\r\n]*```$/, '');

            await vscode.commands.executeCommand('workbench.view.extension.code-coevoer-sidebar');
            await new Promise(resolve => setTimeout(resolve, 100));
            if (global.chatViewProvider) {
                const formattedCode = '```c\n' + cleanResponse + '\n```';
                global.chatViewProvider.addMessage(formattedCode);
                // await vscode.commands.executeCommand('workbench.view.code-coevoer.chatView.focus');
            }
            const doc = await vscode.workspace.openTextDocument({
                language: 'java',
                content: cleanResponse
            });
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage('检测到测试代码需要更新，请查看侧边栏聊天视图。');
        }
    } catch (error) {
        console.error('Failed to parse GPT response:', error);
        console.error('Raw response:', gptResponse);
    }
}

export async function checkAndUpdateTests(fileMapping: FileMapping): Promise<void> {
    if (!fileMapping || fileMapping.length === 0) {
        console.log('No file mapping provided');
        return;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('No workspace folder opened');
        return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    console.log("Workspace Root Path:", rootPath);

    for (const element of fileMapping) {
        await processMapping(element, rootPath);
    }
}


