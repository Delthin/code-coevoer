import * as vscode from 'vscode';
import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';
import * as path from 'path';

function joinPaths(...paths: string[]): string {
    return path.join(...paths);
}

export async function checkAndUpdateTests(fileMapping: FileMapping): Promise<void> {
    if (!fileMapping || fileMapping.length === 0) {
        vscode.window.showErrorMessage('No file mapping provided.');
        return;
    }

    for (let i = 0; i < fileMapping.length; i++) {
        const currentMapping = fileMapping[i];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const rootPath = workspaceFolders[0].uri.fsPath;
            console.log("Workspace Root Path:", rootPath);
            const sourceFilePathUri = vscode.Uri.file(currentMapping.productionFilePath);
            const testFilePathUri = vscode.Uri.file(currentMapping.testFilePath);
            const sourceFilePathAbsolute = path.join(rootPath, sourceFilePathUri.path);
            const testFilePathAbsolute = path.join(rootPath, testFilePathUri.path);
            console.log("Absolute Source File Path:", sourceFilePathAbsolute);
            console.log("Absolute Test File Path:", testFilePathAbsolute);

            try {
                const sourceCode = (await vscode.workspace.fs.readFile(vscode.Uri.file(sourceFilePathAbsolute))).toString();
                const testCode = (await vscode.workspace.fs.readFile(vscode.Uri.file(testFilePathAbsolute))).toString();
                const prompt = `
            ### Problem:
            We have the following data:
            1. **Diff between old and new production code**:
            \`\`\`
            ${currentMapping.diff}
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
            \`"test_code"\`, where \`test_code\` is the **new test code** that should be used to test the new production code. Ensure the test code is complete and will adequately test the new production code.

            **Important:** Please return the result in **exactly** the specified format. Do not include any additional explanations or information. Only the result as described above.
            `;

                const gptResponse = await callLLMApi(prompt);
                console.log(gptResponse);
                console.log(new Date().toLocaleString());

                try {
                    const parsedResponse = (JSON.parse(gptResponse)).choices[0].message.content;
                    console.log(parsedResponse);
                    if (parsedResponse.trim() === "0") {
                        vscode.window.showInformationMessage('Test code is up-to-date.');
                    } else {
                        const cleanResponse = parsedResponse
                            .replace(/^```java[\r\n]*/, '')
                            .replace(/[\r\n]*```$/, '');
                        const doc = await vscode.workspace.openTextDocument({
                            language: 'java',
                            content: cleanResponse
                        });
                        await vscode.window.showTextDocument(doc);
                    }
                } catch (error) {
                    console.error('Failed to parse GPT response:', error);
                    console.error('Raw response:', gptResponse);
                }
            } catch (error) {
                console.error('Error reading files:', error);
            }

        } else {
            console.log('No workspace folder opened');
        }
    }
}


