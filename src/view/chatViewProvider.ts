import * as vscode from 'vscode';
import * as path from 'path';

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messageCount: number = 0;

    constructor(private readonly _extensionUri: vscode.Uri) { }

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
                }
                .message-header {
                    padding: 8px 12px;
                    background-color: var(--vscode-editor-lineHighlightBackground);
                    border-bottom: 1px solid var(--vscode-panel-border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .language-label {
                    color: var(--vscode-textLink-foreground);
                    font-size: 12px;
                }
                .message-content {
                    padding: 12px;
                }
                pre[class*="language-"] {
                    margin: 0;
                    padding: 12px;
                    background: var(--vscode-editor-background);
                    border-radius: 4px;
                }
                .copy-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    border-radius: 2px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .copy-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-c.min.js"></script>
        </head>
        <body>
            <div id="chat-container"></div>
            <script>
                const vscode = acquireVsCodeApi();
                const container = document.getElementById('chat-container');
                
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
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

    public addMessage(code: string) {
        if (this._view) {
            this.messageCount++;
            // 解析代码块的语言
            const languageMatch = code.match(/^```(\w+)\n/);
            const language = languageMatch ? languageMatch[1] : 'text';
            const cleanCode = code
                .replace(/^```\w*\n/, '')
                .replace(/```$/, '');

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

        // 添加调试日志
        console.log('WebView initialized');

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // 设置初始 HTML
        webviewView.webview.html = this._getHtmlForWebview();

        // 添加消息监听器
        webviewView.webview.onDidReceiveMessage(
            message => {
                console.log('Received message:', message);
            },
            undefined,
            []
        );
    }
}