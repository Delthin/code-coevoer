setTimeout(() => {
    console.log('Webview loaded');
    console.log('Diff library available:', typeof Diff !== 'undefined');
}, 1000);

const vscode = acquireVsCodeApi();
let messagesContainer;

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    messagesContainer = document.getElementById('messages-container');
});

function createDiffHtml(oldContent, newContent) {
    console.log('Creating diff with:', {
        oldContent: oldContent?.substring(0, 100),
        newContent: newContent?.substring(0, 100),
        oldLength: oldContent?.length,
        newLength: newContent?.length
    });
    
    if (!oldContent || !newContent) {
        console.error('Missing content for diff comparison');
        return '';
    }
    try {
        // 统一换行符为 \n
        const normalizedOldContent = oldContent.replace(/\r\n/g, '\n');
        const normalizedNewContent = newContent.replace(/\r\n/g, '\n');
        
        const diffResult = Diff.diffLines(normalizedOldContent, normalizedNewContent);
        const diffHtml = diffResult.map(part => {
            let prefix = part.added ? '+' : part.removed ? '-' : ' ';
            let className = part.added ? 'diff-line-add' : part.removed ? 'diff-line-delete' : '';
            
            return part.value.split('\n')
                .filter(line => line.length > 0)
                .map(line => 
                    `<span class="${className}"><span class="diff-prefix diff-prefix-${part.added ? 'add' : part.removed ? 'delete' : 'unchanged'}">${prefix}</span>${escapeHtml(line)}</span>`
                ).join('\n');
        }).join('\n');
        
        return diffHtml || '文件内容相同';
    } catch (error) {
        console.error('Error creating diff:', error);
        return '无法生成差异对比';
    }
}

function escapeHtml(unsafe) {
    if (!unsafe) {return '';}
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;") 
        .replace(/'/g, "&#039;");
}

function toggleDiff(id) {
    const messageBlock = document.querySelector(`.message-block:nth-child(${id})`);
    if (!messageBlock) {
        console.error('Message block not found:', id);
        return;
    }

    const codeElement = messageBlock.querySelector('code');
    const button = messageBlock.querySelector('.diff-button');
    const filePath = messageBlock.querySelector('.file-name').textContent;
    
    if (button.textContent === '展示差异') {
        // 保存原始内容
        const originalContent = messageBlock.getAttribute('data-original-content');
        if (!originalContent) {
            console.error('Original content not found');
            return;
        }
        
        // 获取文件内容并显示差异
        vscode.postMessage({ 
            type: 'getFileContent',
            filePath: filePath,
            messageId: id
        });
    } else {
        // 恢复原始显示
        const originalContent = messageBlock.getAttribute('data-original-content');
        button.textContent = '展示差异';
        codeElement.innerHTML = originalContent;
        Prism.highlightElement(codeElement);
    }
}

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
        case 'addMessage': {
            const messageElement = document.createElement('div');
            messageElement.className = 'message-block';
            
            const normalizedPath = message.fileName.replace(/\\/g, '/');
            
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="file-name" onclick="openFile('${normalizedPath}')">${normalizedPath}</div>
                    <div>
                        <button class="diff-button" onclick="toggleDiff(${message.id})">展示差异</button>
                        <button class="copy-button" onclick="copyCode(${message.id})">复制代码</button>
                    </div>
                </div>
                <div class="message-content">
                    <pre><code class="language-${message.language.toLowerCase()}">${message.content}</code></pre>
                </div>
            `;
            messageElement.setAttribute('data-original-content', message.content);
            messagesContainer.appendChild(messageElement);
            Prism.highlightElement(messageElement.querySelector('code'));
                scrollToBottom();
                break;
            }

        case 'fileContent': {
            const targetBlock = document.querySelector(`.message-block:nth-child(${message.messageId})`);
            if (!targetBlock) {
                console.error('Target block not found:', message.messageId);
                return;
            }

            const codeElement = targetBlock.querySelector('code');
            const button = targetBlock.querySelector('.diff-button');
            
            try {
                const diffHtml = createDiffHtml(message.content, codeElement.textContent);
                button.textContent = '显示原始';
                codeElement.innerHTML = diffHtml;
            } catch (error) {
                console.error('Error handling file content:', error);
                vscode.postMessage({ type: 'error', message: '生成差异对比失败' });
            }
            break;
        }
        case 'clearMessages':
            messagesContainer.innerHTML = '';
            break;
    }
});