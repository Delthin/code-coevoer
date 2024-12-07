# Code-Coevoer

[![GitHub](https://img.shields.io/badge/GitHub-Repository-brightgreen.svg?logo=github)](https://github.com/Delthin/code-coevoer)
[![GitHub stars](https://img.shields.io/github/stars/Delthin/code-coevoer.svg?style=social)](https://github.com/Delthin/code-coevoer)
[![GitHub license](https://img.shields.io/github/license/Delthin/code-coevoer.svg)](https://github.com/Delthin/code-coevoer/blob/main/LICENSE)

简体中文 | [English](./README.en.md)

Code-Coevoer is a VS Code extension that automatically detects git commit changes and helps update related test code. When source code changes are detected, the extension automatically analyzes and suggests test code that may need updating.

## Features

- Real-time monitoring of git commit changes
- Automatic detection of test files related to source code
- Smart analysis of test code that needs updating
- Provides test code update suggestions
- Supports multiple programming languages
- Provides diff comparison and code preview
- Supports multiple LLM APIs (OpenAI/Ollama and other compatible providers)
- Supports custom model name configuration

## Requirements

- VS Code 1.95.0 or higher
- Git repository
- Node.js
- Internet connection (for accessing LLM API)

## Installation

1. Open VS Code
2. Press `Ctrl+P` to open Quick Command
3. Type `ext install code-coevoer`
4. Click Install

## Configuration

The following options can be configured in VS Code settings:

* `code-coevoer.enable`: Enable/disable the extension
* `code-coevoer.autoOpenFile`: Enable/disable auto-creation of recommended update files
* `code-coevoer.language`: Select the main programming language for the project
* `code-coevoer.llmType`: Choose the LLM API type to use (openai/ollama)
* `code-coevoer.apikey`: Set OpenAI API key
* `code-coevoer.baseURL`: Set OpenAI API base URL
* `code-coevoer.ollamaBaseURL`: Set Ollama API address
* `code-coevoer.ollamaModel`: Set Ollama model name
* `code-coevoer.openaiModel`: Set model name (supports OpenAI and other compatible service providers' models)

## Usage

1. After installation and activation, the extension automatically starts monitoring git commit changes
2. When code changes are detected, the extension displays potentially outdated test code in the left sidebar
3. Click on the file name to open the corresponding file
4. Use the "Show Diff" button to view code change comparisons
5. Use the "Copy Code" button to copy update suggestions
6. Use the "Clear Messages" button to clear all current notifications

## Common Issues

1. Extension not working properly
   - Ensure API Key is correctly configured
   - Check network connection
   - Ensure project contains .git directory

2. Unable to detect test files
   - Ensure test file names follow common test naming conventions
   - Check if project structure is correct

3. API Call Failure
   - Ensure model name is configured correctly
   - Check if the selected service provider supports the model
   - Verify API key permissions are sufficient

## Supported Languages

- Java
- Python
- JavaScript
- C
- C++
- C#
- Go
- Ruby
- Swift

## Feedback and Support

If you encounter any issues or have suggestions, please feel free to submit an issue.

## License

[MIT](LICENSE)