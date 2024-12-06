import OpenAI from 'openai';
import * as vscode from 'vscode';

const apikey = vscode.workspace.getConfiguration().get<string>('code-coevoer.apikey');
const baseURL = vscode.workspace.getConfiguration().get<string>('code-coevoer.baseURL');

const openai = new OpenAI({
    apiKey: apikey ?? '',
    baseURL: baseURL ?? 'https://api.openai.com/v1'
});

export async function callLLMApi(prompt : string): Promise<string>{
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'user', content: prompt.toString() }
            ],
        });
        console.log(JSON.stringify(completion));
        return JSON.stringify(completion);
        // return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error calling the LLM API:', error);
        throw error;
    }
}

// 这是通义千问,也可以正常使用
// import OpenAI from 'openai';
// import * as vscode from 'vscode';

// const openai = new OpenAI(
//     {
//         apiKey: "sk-4e6c2afd8fa84b6ab913a243985df37a",
//         baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
//     }
// );

// async function getCompletion() {
//     const completion = await openai.chat.completions.create({
//         model: "qwen-plus",
//         messages: [
//             { role: "system", content: "You are a helpful assistant." },
//             { role: "user", content: "1+1等于几" }
//         ],
//     });
//     console.log(JSON.stringify(completion));
// }
