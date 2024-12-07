# Code-Coevoer

[![GitHub](https://img.shields.io/badge/GitHub-Repository-brightgreen.svg?logo=github)](https://github.com/Delthin/code-coevoer)
[![GitHub stars](https://img.shields.io/github/stars/Delthin/code-coevoer.svg?style=social)](https://github.com/Delthin/code-coevoer)
[![GitHub license](https://img.shields.io/github/license/Delthin/code-coevoer.svg)](https://github.com/Delthin/code-coevoer/blob/main/LICENSE)

[English](./README.en.md) | 简体中文

Code-Coevoer 是一个 VS Code 扩展，用于自动检测 git commit 变更并帮助更新相关的测试代码。当检测到源代码发生变更时，插件会自动分析并提示可能需要更新的测试代码。

## 功能特性

- 实时监控 git commit 变更
- 自动检测与源代码相关的测试文件
- 智能分析测试代码是否需要更新
- 提供测试代码更新建议
- 支持多种编程语言
- 提供差异对比和代码预览功能
- 支持多种 LLM API (OpenAI/Ollama)

## 系统要求

- VS Code 1.95.0 或更高版本
- Git 仓库
- Node.js 
- 网络连接（用于访问 LLM API）

## 安装

1. 打开 VS Code
2. 按 `Ctrl+P` 打开快速命令
3. 输入 `ext install code-coevoer`
4. 点击安装

## 配置说明

在 VS Code 设置中可以配置以下选项：

* `code-coevoer.enable`: 启用/禁用插件
* `code-coevoer.autoOpenFile`: 启用/禁用自动创建推荐更新文件
* `code-coevoer.language`: 选择项目的主要编程语言
* `code-coevoer.llmType`: 选择要使用的 LLM API 类型 (openai/ollama)
* `code-coevoer.apikey`: 设置 OpenAI API 密钥
* `code-coevoer.baseURL`: 设置 OpenAI API 基础 URL
* `code-coevoer.ollamaBaseURL`: 设置 Ollama API 地址
* `code-coevoer.ollamaModel`: 设置 Ollama 模型名称

## 使用说明

1. 安装并启用插件后，插件会自动开始监听 git commit 变更
2. 当检测到代码变更时，插件会在左侧栏显示可能需要更新的测试代码
3. 点击文件名可以打开对应文件
4. 使用"展示差异"按钮可以查看代码变更对比
5. 使用"复制代码"按钮可以复制更新建议
6. 使用"清除消息"按钮可以清空当前的所有提示

## 常见问题

1. 插件无法正常工作
   - 确保已正确配置 API Key
   - 检查网络连接
   - 确保项目中包含 .git 目录

2. 无法检测到测试文件
   - 确保测试文件名符合常见测试文件命名规范
   - 检查项目结构是否正确

## 支持的编程语言

- Java
- Python
- JavaScript
- C
- C++
- C#
- Go
- Ruby
- Swift

## 反馈与支持

如果您在使用过程中遇到问题或有任何建议，欢迎提交 issue。

## 开源协议

[MIT](LICENSE)
