import OpenAI from 'openai';
import * as vscode from 'vscode';
import axios from 'axios';

// 获取配置的函数
function getConfig() {
    const config = vscode.workspace.getConfiguration('code-coevoer');
    return {
        llmType: config.get<string>('llmType'),
        apikey: config.get<string>('apikey'),
        baseURL: config.get<string>('baseURL'),
        ollamaBaseURL: config.get<string>('ollamaBaseURL'),
        ollamaModel: config.get<string>('ollamaModel')
    };
}

// OpenAI 客户端创建函数
function createOpenAIClient() {
    const { apikey, baseURL } = getConfig();
    return new OpenAI({
        apiKey: apikey ?? '',
        baseURL: baseURL ?? 'https://api.openai.com/v1'
    });
}

// Ollama API 调用
async function callOllamaApi(prompt: string): Promise<string> {
    const { ollamaBaseURL, ollamaModel } = getConfig();
    try {
        const response = await axios.post(`${ollamaBaseURL}/api/generate`, {
            model: ollamaModel,
            prompt: prompt,
            stream: false
        });
        return JSON.stringify({
            choices: [{
                message: {
                    content: response.data.response
                }
            }]
        });
    } catch (error) {
        console.error('Error calling Ollama API:', error);
        throw error;
    }
}

// OpenAI API 调用
async function callOpenAIApi(prompt: string): Promise<string> {
    const openai = createOpenAIClient();
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'user', content: prompt.toString() }
            ],
        });
        return JSON.stringify(completion);
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}

// 统一的 API 调用入口
export async function callLLMApi(prompt: string): Promise<string> {
    const { llmType } = getConfig();
    if (llmType === 'ollama') {
        console.log('Calling Ollama API');
        return callOllamaApi(prompt);
    } else {
        console.log('Calling OpenAI API');
        return callOpenAIApi(prompt);
    }
}