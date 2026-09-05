# Code-Coevoer

[![GitHub](https://img.shields.io/badge/GitHub-Repository-brightgreen.svg?logo=github)](https://github.com/Delthin/code-coevoer)
[![GitHub stars](https://img.shields.io/github/stars/Delthin/code-coevoer.svg?style=social)](https://github.com/Delthin/code-coevoer)
[![GitHub license](https://img.shields.io/github/license/Delthin/code-coevoer.svg)](https://github.com/Delthin/code-coevoer/blob/main/LICENSE)

[English](./README.en.md) | 简体中文

Code-Coevoer 是一个 VS Code 扩展，用于自动检测 git commit 变更并帮助更新相关的测试代码。当检测到源代码发生变更时，插件会自动分析并提示可能需要更新的测试代码。

> **项目状态：历史原型 / 维护模式。** 当前仓库记录了 2024 年完成的“提交变更关联测试”探索，不再按现代 Coding Agent 产品继续扩展。源码可供理解早期工作流；重新分发前应自行验证当前 VS Code 与模型接口兼容性。

本轮验证（2026-09-05）：按 `package-lock.json` 安装依赖后，`npm run compile` 通过；安装审计仍报告旧依赖漏洞，因此这里只作为源码归档，不发布新的扩展安装包。

## AI 工作流

```text
Git commit 变更 → 收集 diff 与项目结构 → 定位候选测试 → 模型判断与生成建议 → 人工查看/复制
```

这是一个“生成测试更新建议”的早期 AI 插件，不会自动运行测试、验证补丁或持续修复失败。若未来重新做测试维护 Agent，建议作为新项目重新定义范围，而不是在本仓库继续叠加兼容层。

## 功能特性

- 实时监控 git commit 变更
- 自动检测与源代码相关的测试文件
- 智能分析测试代码是否需要更新
- 提供测试代码更新建议
- 支持多种编程语言
- 提供差异对比和代码预览功能
- 支持多种 LLM API (OpenAI/Ollama及其他兼容服务商)
- 支持自定义模型名称配置

## 系统要求

- VS Code 1.95.0 或更高版本
- Git 仓库
- Node.js 
- 网络连接（用于访问 LLM API）

## 安装

当前 README 不保证扩展仍可从 Marketplace 安装。建议从源码验证：

```bash
npm ci
npm run compile
npm test
```

历史安装方式如下：

1. 打开 VS Code
2. 按 `Ctrl+P` 打开快速命令
3. 输入 `ext install code-coevoer`
4. 点击安装

## 配置说明

配置的 API Key 仅用于用户选择的模型服务。请勿在 Issue、日志或截图中提交真实密钥；源代码不会再打印该值。

在 VS Code 设置中可以配置以下选项：

* `code-coevoer.enable`: 启用/禁用插件
* `code-coevoer.autoOpenFile`: 启用/禁用自动创建推荐更新文件
* `code-coevoer.language`: 选择项目的主要编程语言
* `code-coevoer.llmType`: 选择要使用的 LLM API 类型 (openai/ollama)
* `code-coevoer.apikey`: 设置 OpenAI API 密钥
* `code-coevoer.baseURL`: 设置 OpenAI API 基础 URL
* `code-coevoer.ollamaBaseURL`: 设置 Ollama API 地址
* `code-coevoer.ollamaModel`: 设置 Ollama 模型名称
* `code-coevoer.openaiModel`: 设置要使用的模型名称(支持 OpenAI 及其他兼容服务商的模型)

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

3. API 调用失败
   - 确保模型名称配置正确
   - 检查所选服务商是否支持该模型
   - 验证 API 密钥权限是否足够

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
