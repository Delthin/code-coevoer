const vscode = acquireVsCodeApi();
const messagesContainer = document.getElementById('messages-container');

function scrollToBottom() {
    messagesContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

function clearAllMessages() {
    // 发送清除消息到扩展
    vscode.postMessage({ type: 'clearAll' });

    // 清除 messages-container 中的消息
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';  // 直接清空内容

    // 强制重新渲染
    requestAnimationFrame(() => {
        messagesContainer.style.display = 'none';
        requestAnimationFrame(() => {
            messagesContainer.style.display = '';
        });
    });
}

function openFile(filePath) {
    vscode.postMessage({ 
        type: 'openFile',
        filePath: filePath 
    });
}

function copyCode(id) {
    const content = document.querySelector(`.message-block:nth-child(${id}) pre code`).textContent;
    navigator.clipboard.writeText(content);
    vscode.postMessage({ type: 'copy' });
}

window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
        case 'addMessage':
            const messageElement = document.createElement('div');
            messageElement.className = 'message-block';
            
            const normalizedPath = message.fileName.replace(/\\/g, '/');
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="file-name" onclick="openFile('${normalizedPath}')">${normalizedPath}</div>
                    <button class="copy-button" onclick="copyCode(${message.id})">复制代码</button>
                </div>
                <div class="message-content">
                    <pre><code class="language-${message.language.toLowerCase()}">${message.content}</code></pre>
                </div>
            `;
            messagesContainer.appendChild(messageElement);
            Prism.highlightElement(messageElement.querySelector('code'));
            scrollToBottom();
            break;

        case 'clearMessages':
            messagesContainer.innerHTML = '';
            break;
    }
});