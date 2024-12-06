const vscode = acquireVsCodeApi();
const container = document.getElementById('chat-container');

function scrollToBottom() {
    container.scrollIntoView({ behavior: 'smooth', block: 'end' });
    // 额外添加一个延时滚动，确保在内容渲染完成后滚动
    setTimeout(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

function clearAllMessages() {
    vscode.postMessage({ type: 'clearAll' });
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
        case 'clearMessages':
            container.innerHTML = '';
            break;
        case 'addMessage':
            const messageElement = document.createElement('div');
            messageElement.className = 'message-block';
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="file-name" onclick="openFile('${message.fileName}')">${message.fileName}</div>
                    <button class="copy-button" onclick="copyCode(${message.id})">复制代码</button>
                </div>
                <div class="message-content">
                    <pre><code class="language-${message.language.toLowerCase()}">${message.content}</code></pre>
                </div>
            `;
            container.appendChild(messageElement);
            Prism.highlightElement(messageElement.querySelector('code'));
            scrollToBottom(); // 添加新消息后滚动到底部
            break;
    }
});