// src/utils/languageDetector.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function detectProjectLanguage(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return 'Java'; // 默认返回Go
    }
    
    const rootPath = workspaceFolders[0].uri.fsPath;
    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
    
    // 统计不同类型文件的数量
    const langCount = {
        'Java': 0,
        'Python': 0,
        'JavaScript': 0,
        'C++': 0,
        'C#': 0,
        'Go': 0,
        'Ruby': 0,
        'Swift': 0
    };
    
    // 文件扩展名映射
    const extensionMap: { [key: string]: string } = {
        '.java': 'Java',
        '.py': 'Python',
        '.js': 'JavaScript',
        '.ts': 'JavaScript',
        '.cpp': 'C++',
        '.cc': 'C++',
        '.cs': 'C#',
        '.c': 'C',
        '.go': 'Go',
        '.rb': 'Ruby',
        '.swift': 'Swift'
    };
    
    // 检查项目文件
    for (const file of files) {
        const ext = path.extname(file.fsPath);
        const lang = extensionMap[ext];
        if (lang) {
            langCount[lang as keyof typeof langCount]++;
        }
    }
    
    // 查找package.json、pom.xml等特定项目文件
    if (fs.existsSync(path.join(rootPath, 'pom.xml'))) {
        return 'Java';
    }
    if (fs.existsSync(path.join(rootPath, 'requirements.txt'))) {
        return 'Python';
    }
    if (fs.existsSync(path.join(rootPath, 'package.json'))) {
        return 'JavaScript';
    }
    if (fs.existsSync(path.join(rootPath, 'go.mod'))) {
        return 'Go';
    }
    
    // 返回出现最多的语言
    let maxLang = 'Java';
    let maxCount = 0;
    
    for (const [lang, count] of Object.entries(langCount)) {
        if (count > maxCount) {
            maxCount = count;
            maxLang = lang;
        }
    }
    
    return maxCount > 0 ? maxLang : 'Java';
}