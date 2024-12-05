import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';

function isTestFile(filename: string): boolean {
    const lowerFilename = filename.toLowerCase();
    return lowerFilename.includes('test') ||
        lowerFilename.includes('spec') ||
        lowerFilename.includes('__tests__');
}

function findTestFilesInTree(
    tree: any,
    targetFileName: string,
    currentPath: string = ''
): string[] {
    const testFiles: string[] = [];
    for (const [name, value] of Object.entries(tree)) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        if (value === null) {
            if (isTestFile(name) && 
                name.toLowerCase().includes(targetFileName.toLowerCase()) &&
                name.toLowerCase() !== `${targetFileName.toLowerCase()}.java`) {
                testFiles.push(fullPath);
            }
        } else if (typeof value === 'object') {
            testFiles.push(...findTestFilesInTree(value, targetFileName, fullPath));
        }
    }
    return testFiles;
}

function doesPathExistInTree(tree: any, path: string): boolean {
    const segments = path.split('/');
    let current = tree;
    for (const segment of segments) {
        if (!current || !Object.hasOwn(current, segment)) {
            return false;
        }
        current = current[segment];
    }
    return true;
}

function buildGPTPrompt(file: string, content: string, projectTree: string, foundTestFiles: string[]): string {
    return `
        I have a project with the following structure:

        ${projectTree}

        The file "${file}" has been modified with the following changes:
        "${content}"

        I have already found the following corresponding test file(s) for this source file:
        ${JSON.stringify(foundTestFiles)}

        Your task:
        1. Identify **additional** test file(s) that corresponds to the source file "${file}" based on the provided project structure and changes.
        2. If a corresponding test file exists, return its relative path.
        3. For example: The test file name for "Conekta.java" might be "ConektaBase.java" or "ConektaListTest.java".
        4. If no test file exists, return an empty JSON object: {}.

        Important:
        - If no additional test files can be identified, return an empty JSON object: {}.
        - Return only the JSON object as the output.
        - Do not include any explanation, comments, or extra text in your response.

        Format your response strictly as JSON:
        {
            "testFilePaths": ["<relative path to the additional test file>", "..."]
        }
    `;
}

async function getAdditionalTestFiles(prompt: string): Promise<string[]> {
    try {
        const rawResponse = await callLLMApi(prompt);
        const cleanedResponse = rawResponse.replace(/```[a-z]*\n|\n```/g, '');
        const parsedResponse = JSON.parse(cleanedResponse);
        const gptOutput = parsedResponse.choices[0].message.content;
        const result = JSON.parse(gptOutput);
        return result?.testFilePaths || [];
    } catch (error) {
        console.error('Failed to get additional test files:', error);
        return [];
    }
}

function addToFileMapping(
    fileMapping: FileMapping,
    file: string,
    testFile: string,
    content: string
): void {
    fileMapping.push({
        productionFilePath: file,
        testFilePath: testFile,
        diff: content,
    });
}

function extractFileName(file: string): string | undefined {
    return file.split('/').pop()?.replace(/\.[^/.]+$/, '');
}

export async function findTestFile(
    fileChangesMap: Map<string, string>,
    projectTree: string
): Promise<FileMapping> {
    const fileMapping: FileMapping = [];
    const projectStructure = JSON.parse(projectTree);

    for (const [file, content] of fileChangesMap) {
        if (isTestFile(file)) {
            console.log(`Skipping test file: ${file}`);
            continue;
        }

        const fileNameWithoutPath = extractFileName(file);
        if (!fileNameWithoutPath) {
            console.error(`Failed to extract file name from: ${file}`);
            continue;
        }

        // 查找常规测试文件
        const foundTestFiles = findTestFilesInTree(projectStructure, fileNameWithoutPath);
        if (foundTestFiles.length > 0) {
            console.log(`Test files found for: ${file}, test files: ${foundTestFiles}`);
            foundTestFiles.forEach(testFile => 
                addToFileMapping(fileMapping, file, testFile, content)
            );
        }

        // 查找额外的测试文件
        const prompt = buildGPTPrompt(file, content, projectTree, foundTestFiles);
        const additionalTestFiles = await getAdditionalTestFiles(prompt);

        for (const testFile of additionalTestFiles) {
            if (doesPathExistInTree(projectStructure, testFile)) {
                console.log(`Additional test file found for: ${file}, test file: ${testFile}`);
                addToFileMapping(fileMapping, file, testFile, content);
            }
        }

        if (additionalTestFiles.length === 0) {
            console.log(`No additional test files found for: ${file}`);
        }
    }

    return fileMapping;
}