import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messageCount: number = 0;
    private messages: Array<{content: string, language: string}> = [];


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
        return `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css">
            <style>
                body { 
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .message-block {
                    margin-bottom: 20px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 6px;
                    width: 100%;
                    box-sizing: border-box;
                }
                .message-header {
                    padding: 8px 12px;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .message-content {
                    padding: 12px;
                    width: 100%;
                    box-sizing: border-box;
                    overflow-x: auto;
                }
                pre[class*="language-"] {
                    margin: 0;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                    white-space: pre;
                    word-wrap: normal;
                    overflow-x: auto;
                    min-width: 100%;
                    box-sizing: border-box;
                }
                code[class*="language-"] {
                    word-break: normal;
                    word-wrap: normal;
                    tab-size: 4;
                }
                .copy-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 12px;
                    white-space: nowrap;
                }
                .copy-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .clear-button {
                    position: sticky;
                    top: 10px;
                    margin-bottom: 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 2px;
                    cursor: pointer;
                    width: 100%;
                }
                .clear-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                #chat-container {
                    width: 100%;
                    box-sizing: border-box;
                }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-c.min.js"></script>
        </head>
        <body>
            <button class="clear-button" onclick="clearAllMessages()">清除消息</button>
            <div id="chat-container"></div>
            <script>
                const vscode = acquireVsCodeApi();
                const container = document.getElementById('chat-container');
                
                function clearAllMessages() {
                    vscode.postMessage({ type: 'clearAll' });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'clearMessages':
                            container.innerHTML = '';
                            break;
                        case 'addMessage':
                            const messageElement = document.createElement('div');
                            messageElement.className = 'message-block';
                            messageElement.innerHTML = \`
                                <div class="message-header">
                                    <div class="language-label">\${message.language}</div>
                                    <button class="copy-button" onclick="copyCode(\${message.id})">复制代码</button>
                                </div>
                                <div class="message-content">
                                    <pre><code class="language-\${message.language}">\${message.content}</code></pre>
                                </div>
                            \`;
                            container.appendChild(messageElement);
                            Prism.highlightElement(messageElement.querySelector('code'));
                            break;
                    }
                });

                function copyCode(id) {
                    const content = document.querySelector(\`.message-block:nth-child(\${id}) pre code\`).textContent;
                    navigator.clipboard.writeText(content);
                    vscode.postMessage({ type: 'copy' });
                }
            </script>
        </body>
        </html>`;
    }

    public clearMessages() {
        this.messages = [];
        this.messageCount = 0;
        this._storage.update('chatMessages', []);
        
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearMessages' });
        }
    }

    public addMessage(code: string) {
        if (this._view) {
            const languageMatch = code.match(/^```(\w+)\n/);
            const language = languageMatch ? languageMatch[1] : 'text';
            const cleanCode = code
                .replace(/^```\w*\n/, '')
                .replace(/```$/, '');

            // 添加新消息
            this.messages.push({
                content: cleanCode,
                language: language
            });
            this.messageCount++;

            // 确保异步保存消息
            this._storage.update('chatMessages', this.messages).then(() => {
                console.log('Messages saved successfully');
                console.log(this.messages);
            });

            this._view.webview.postMessage({
                type: 'addMessage',
                content: this._escapeHtml(cleanCode),
                language: language,
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
        webviewView.webview.onDidReceiveMessage(
            message => {
                switch (message.type) {
                    case 'clearAll':
                        this.clearMessages();
                        break;
                    case 'copy':
                        // 原有的复制处理逻辑
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