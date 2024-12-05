import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';

export async function findTestFile(
    fileChangesMap: Map<string, string>,
    projectTree: string
): Promise<FileMapping> {
    const fileMapping: FileMapping = [];

    // 判断文件是否为测试文件的函数
    const isTestFile = (filename: string): boolean => {
        const lowerFilename = filename.toLowerCase();
        return lowerFilename.includes('test') ||
            lowerFilename.includes('spec') ||
            lowerFilename.includes('__tests__');
    };

    // 递归查找测试文件的函数（可能返回多个文件）
    const findTestFilesInTree = (
        tree: any,
        targetFileName: string,
        currentPath: string = ''
    ): string[] => {
        const testFiles: string[] = [];
        for (const [name, value] of Object.entries(tree)) {
            const fullPath = currentPath ? `${currentPath}/${name}` : name;
            if (value === null) {
                // 如果是文件，检查文件名是否包含目标文件名并且符合测试文件规则
                if (isTestFile(name) && name.toLowerCase().includes(targetFileName.toLowerCase())
                && name.toLowerCase() !== `${targetFileName.toLowerCase()}.java`) {
                    testFiles.push(fullPath); // 添加符合条件的测试文件路径
                }
            } else if (typeof value === 'object') {
                // 如果是目录，递归调用
                testFiles.push(...findTestFilesInTree(value, targetFileName, fullPath));
            }
        }
        return testFiles; // 返回所有找到的测试文件路径
    };

    // 检查路径是否存在于项目树
    const doesPathExistInTree = (tree: any, path: string): boolean => {
        const segments = path.split('/');
        let current = tree;
        for (const segment of segments) {
            if (!current || !Object.prototype.hasOwnProperty.call(current, segment)) {
                return false; // 路径不存在
            }
            current = current[segment];
        }
        return true; // 全部路径段存在
    };

    // 遍历文件变更
    for (const [file, content] of fileChangesMap) {
        // 如果是测试文件，跳过处理
        if (isTestFile(file)) {
            console.log(`Skipping test file: ${file}`);
            continue;
        }

        // 先手动查找
        const projectStructure = JSON.parse(projectTree);
        const fileNameWithoutPath = file.split('/').pop()?.replace(/\.[^/.]+$/, ''); // 获取生产文件名（不含路径）
        console.log(`fileNameWithoutPath: ${fileNameWithoutPath}`);
        if (!fileNameWithoutPath) {
            console.error(`Failed to extract file name from: ${file}`);
            continue;
        }
        // 在项目结构中查找测试文件
        const foundTestFiles = findTestFilesInTree(projectStructure, fileNameWithoutPath);
        //console.log(`foundTestFiles.length: ${foundTestFiles.length}`);
        if (foundTestFiles.length > 0) {
            console.log(`Test files found for: ${file}, test files: ${foundTestFiles}`);
            for (const testFile of foundTestFiles) {
                fileMapping.push({
                    productionFilePath: file,
                    testFilePath: testFile,
                    diff: content,
                });
            }
        }

        // console.log("here");
        // 其余代码保持不变
        const prompt = `
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

        console.log('Prompt:', prompt);
        // 调用 GPT API
        const rawResponse = await callLLMApi(prompt);
        const cleanedResponse = rawResponse.replace(/```[a-z]*\n|\n```/g, '');
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(cleanedResponse);
        } catch (error) {
            console.error('Failed to parse GPT response:', error);
            throw error;
        }

        const gptOutput = parsedResponse.choices[0].message.content;

        console.log('gptOutput:', gptOutput);

        // 解析 GPT 响应
        let additionalTestFiles: string[] = [];
        try {
            const parsedResponse = JSON.parse(gptOutput); // 解析JSON
            additionalTestFiles = parsedResponse?.testFilePaths || [];
        } catch (error) {
            console.error('Failed to parse GPT response:', error);
            console.error('Gpt response:', gptOutput);
        }

        for (const testFile of additionalTestFiles) {
            if (doesPathExistInTree(projectStructure, testFile)){
                console.log(`Additional test file found for: ${file}, test file: ${testFile}, diff content: ${content}`);
                fileMapping.push({
                    productionFilePath: file,
                    testFilePath: testFile,
                    diff: content,
                });
            }
        }
        
        if (additionalTestFiles.length === 0) {
            console.log(`No additional test files found for: ${file}`);
        }
    }

    return fileMapping;
}