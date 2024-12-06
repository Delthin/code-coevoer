const vscode = acquireVsCodeApi();
const messagesContainer = document.getElementById('messages-container');

function createDiffHtml(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diff = [];

    // 使用最长公共子序列算法找出相同部分
    const lcs = findLCS(oldLines, newLines);
    let oldIndex = 0;
    let newIndex = 0;
    let lcsIndex = 0;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
        // 处理删除的行
        while (oldIndex < oldLines.length && 
               (lcsIndex >= lcs.length || oldLines[oldIndex] !== lcs[lcsIndex])) {
            diff.push(`<span class="diff-line-delete"><span class="diff-prefix diff-prefix-delete">-</span>${escapeHtml(oldLines[oldIndex])}</span>`);
            oldIndex++;
        }

        // 处理添加的行
        while (newIndex < newLines.length && 
               (lcsIndex >= lcs.length || newLines[newIndex] !== lcs[lcsIndex])) {
            diff.push(`<span class="diff-line-add"><span class="diff-prefix diff-prefix-add">+</span>${escapeHtml(newLines[newIndex])}</span>`);
            newIndex++;
        }

        // 处理相同的行
        if (lcsIndex < lcs.length) {
            diff.push(`<span><span class="diff-prefix"> </span>${escapeHtml(lcs[lcsIndex])}</span>`);
            oldIndex++;
            newIndex++;
            lcsIndex++;
        }
    }

    return diff.join('\n');
}

// 最长公共子序列算法
function findLCS(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // 构建 DP 表
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // 重建最长公共子序列
    const lcs = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (arr1[i - 1] === arr2[j - 1]) {
            lcs.unshift(arr1[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }
    
    return lcs;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function toggleDiff(id) {
    const messageBlock = document.querySelector(`.message-block:nth-child(${id})`);
    const codeElement = messageBlock.querySelector('code');
    const button = messageBlock.querySelector('.diff-button');
    const filePath = messageBlock.querySelector('.file-name').textContent;
    
    if (button.textContent === '展示差异') {
        // 获取文件内容并显示差异
        vscode.postMessage({ 
            type: 'getFileContent',
            filePath: filePath,
            messageId: id
        });
    } else {
        // 恢复原始显示
        button.textContent = '展示差异';
        codeElement.innerHTML = messageBlock.getAttribute('data-original-content');
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
        case 'addMessage':
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

        case 'fileContent':
            const targetBlock = document.querySelector(`.message-block:nth-child(${message.messageId})`);
            const codeElement = targetBlock.querySelector('code');
            const button = targetBlock.querySelector('.diff-button');
            const diffHtml = createDiffHtml(message.content, codeElement.textContent);
            button.textContent = '显示原始';
            codeElement.innerHTML = diffHtml;
            break;
        case 'clearMessages':
            messagesContainer.innerHTML = '';
            break;
    }
});