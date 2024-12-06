import * as vscode from 'vscode';
import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';
import * as path from 'path';


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
        await processTestUpdate(mapping, sourceCode, testCode, testFilePathUri.path);
    } catch (error) {
        console.error('Error reading files:', error);
    }
}

async function processTestUpdate(mapping: any, sourceCode: string, testCode: string, testFilePath: string): Promise<void> {
    const prompt1 = `
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
    Based on the provided diff between the old and new production code, determine if the existing test code needs to be updated to reflect the changes in the production code. 
    - Return "yes" if the test code needs to be updated.
    - Return "no" if the test code does not need to be updated.
    - Do not provide any explanation, only return "yes" or "no".
    `;
    const gptResponse1 = await callLLMApi(prompt1);
    if ((JSON.parse(gptResponse1)).choices[0].message.content.trim() === 'no') {
        console.log('Test code does not need to be updated');
        vscode.window.showInformationMessage(`检测到${testFilePath}无需更新。`);
        return;
    }else{
        const prompt2 = `
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
        Based on the provided diff between the old and new production code, modify the existing test code accordingly. 
        - Do not create new test functions, but update the existing ones based on the changes in the diff.
        - Ensure that the test code reflects the additions and deletions in the production code:
            - If code has been removed, make sure to remove or modify the corresponding test cases.
            - If new code has been added, make sure to add new test cases or modify existing ones to cover these changes.
        - Return the updated test code only, without any additional explanation or irrelevant content.
        - Make sure the test code can fully test the new production code.
    `;
    
        const gptResponse2 = await callLLMApi(prompt2);
        await handleGptResponse(gptResponse2, testFilePath);
    }
}

async function handleGptResponse(gptResponse: string, testFilePath: string): Promise<void> {
    try {
        const parsedResponse = (JSON.parse(gptResponse)).choices[0].message.content;
        const cleanResponse = parsedResponse
            .replace(/^```c[\r\n]*/, '')
            .replace(/^```java[\r\n]*/, '')
            .replace(/[\r\n]*```$/, '');
        await vscode.commands.executeCommand('workbench.view.extension.code-coevoer-sidebar');
        await new Promise(resolve => setTimeout(resolve, 100));
        const language = vscode.workspace.getConfiguration().get<string>('code-coevoer.language');
        if (global.chatViewProvider) {
            const formattedCode = `\`\`\`${language}\n${cleanResponse}\n\`\`\``;
            global.chatViewProvider.addMessage(formattedCode);
        }
        const doc = await vscode.workspace.openTextDocument({
            language: 'java',
            content: cleanResponse
        });
        await vscode.window.showTextDocument(doc);
        vscode.window.showInformationMessage(`检测到${testFilePath}需要更新，请查看侧边栏聊天视图。`);
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


