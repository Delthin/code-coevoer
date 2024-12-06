import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messageCount: number = 0;
    private messages: Array<{content: string, language: string, fileName?: string}> = [];
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _storage: vscode.Memento
    ) {
        // 从存储中恢复消息
        this.loadMessages();
    }

    // 添加新方法用于加载消息
    private loadMessages() {
        const savedMessages = this._storage.get<Array<{content: string, language: string}>>('chatMessages', []);
        if (savedMessages) {
            this.messages = savedMessages;
            this.messageCount = this.messages.length;
        }
    }

    private _getHtmlForWebview() {
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'view', 'webview', 'webview.html');
        const jsPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'view', 'webview', 'webview.js');
        
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
        const jsContent = fs.readFileSync(jsPath.fsPath, 'utf8');
        
        // 将js内容嵌入到html中
        htmlContent = htmlContent.replace(
            '<script src="webview.js"></script>',
            `<script>${jsContent}</script>`
        );
        
        return htmlContent;
    }
    public clearMessages() {
        this.messages = [];
        this.messageCount = 0;
        this._storage.update('chatMessages', []);
        
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearMessages' });
        }
    }

    public addMessage(code: string, fileName?: string) {
        if (this._view) {
            const languageMatch = code.match(/^```(\w+)\n/);
            const language = languageMatch ? languageMatch[1] : 'text';
            const cleanCode = code
                .replace(/^```\w*\n/, '')
                .replace(/\n*```$/, ''); // 修改正则以处理换行
    
            // 添加新消息，使用文件名
            this.messages.push({
                content: cleanCode,
                language: language,
                fileName: fileName || language // 如果没有文件名就使用语言作为后备
            });
            this.messageCount++;
    
            this._storage.update('chatMessages', this.messages);
    
            this._view.webview.postMessage({
                type: 'addMessage',
                content: this._escapeHtml(cleanCode),
                language: language,
                fileName: fileName || language, // 发送文件名到前端
                id: this.messageCount
            });
        }
    }

    private _escapeHtml(unsafe: string) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview();

        this.loadMessages();

        // 在视图变为可见时重新加载所有消息
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                // 清空容器
                webviewView.webview.postMessage({ type: 'clearMessages' });
                
                // 重新加载所有消息
                this.messages.forEach((msg, index) => {
                    webviewView.webview.postMessage({
                        type: 'addMessage',
                        content: this._escapeHtml(msg.content),
                        language: msg.language,
                        id: index + 1
                    });
                });
            }
        });

        // 添加消息处理
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.type === 'ready') {
                this.messages.forEach((msg, index) => {
                    webviewView.webview.postMessage({
                        type: 'addMessage',
                        content: this._escapeHtml(msg.content),
                        language: msg.language,
                        fileName: msg.fileName,
                        id: index + 1
                    });
                });
            }
                switch (message.type) {
                    case 'clearAll':
                        this.clearMessages();
                        break;
                    case 'copy':
                        vscode.window.showInformationMessage('代码已复制到剪贴板');
                        break;
                    case 'openFile':
                        // 处理文件打开请求
                        const workspaceFolders = vscode.workspace.workspaceFolders;
                        if (workspaceFolders) {
                            const filePath = vscode.Uri.file(
                                path.join(workspaceFolders[0].uri.fsPath, message.filePath)
                            );
                            vscode.workspace.openTextDocument(filePath).then(doc => {
                                vscode.window.showTextDocument(doc);
                            });
                        }
                        break;
                }
            },
            undefined,
            []
        );

        // 确保在视图加载完成后再恢复消息
        setTimeout(() => {
            this.messages.forEach((msg, index) => {
                webviewView.webview.postMessage({
                    type: 'addMessage',
                    content: this._escapeHtml(msg.content),
                    language: msg.language,
                    id: index + 1
                });
            });
        }, 100);
    }
}