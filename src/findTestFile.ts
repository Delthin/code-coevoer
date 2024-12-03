import { callLLMApi } from './utils/llmApi';
import { FileMapping } from './fileMapping';

export async function findTestFile(
    fileChangesMap: Map<string, string>,
    projectTree: string
): Promise<FileMapping> {
    const fileMapping: FileMapping = [];

    // 遍历文件变更
    for (const [file, content] of fileChangesMap) {
        // 构建 Prompt
        const prompt = `
            I have a project with the following structure:

            ${projectTree}

            The file "${file}" has been modified with the following changes:
            "${content}"

            Your task:
            1. Identify the test file that corresponds to the source file "${file}" based on the provided project structure and changes.
            2. If a corresponding test file exists, return its relative path.
            3. For example: The test file name for "Conekta.java" might be "ConektaTest.java" or "ConektaListTest.java".
            4. If no test file exists, return an empty JSON object: {}.

            Important:
            - Return only the JSON object as the output.
            - Do not include any explanation, comments, or extra text in your response.

            Format your response strictly as JSON:
            {
                "testFilePath": "<relative path to the test file>"
            }
        `;

        // 调用 GPT API
        const rawResponse = await callLLMApi(prompt);
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawResponse);
        } catch (error) {
            console.error('Failed to parse GPT response:', error);
            throw error;
        }

        const gptOutput = parsedResponse.choices[0].message.content;

        console.log('gptOutput:', gptOutput);

        // 解析 GPT 响应
        let testFileName: string | null = null;
        try {
            const parsedResponse = JSON.parse(gptOutput); // 解析JSON
            testFileName = parsedResponse?.testFilePath || null;
        } catch (error) {
            console.error('Failed to parse GPT response:', error);
            console.error('Gpt response:', gptOutput);
        }

        if (testFileName) {
            console.log(`Test file found for: ${file}, test file: ${testFileName}, diff content: ${content}`);
            fileMapping.push({
                productionFilePath: file,
                testFilePath: testFileName,
                diff: content,
            });
        } else {
            console.log(`No test file found for: ${file}`);
        }
    }

    return fileMapping;
}