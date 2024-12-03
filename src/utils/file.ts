import * as vscode from 'vscode';
import * as path from 'path';

const EXCLUDED_FOLDERS = ['.git', 'node_modules', 'dist', 'out'];
const EXCLUDED_FILES = ['.gitignore', 'package.json', 'tsconfig.json', 'README.md', 'CHANGELOG.md', '.vscodeignore'];

export async function getProjectTree(workspacePath: string): Promise<any> {
    const projectTree: any = {};

    async function readDirectory(dirPath: string, tree: any) {
        const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
        for (const [name, type] of entries) {
            if (EXCLUDED_FOLDERS.includes(name) || EXCLUDED_FILES.includes(name)) {
                continue;
            }
            if (type === vscode.FileType.Directory) {
                tree[name] = {};
                await readDirectory(path.join(dirPath, name), tree[name]);
            } else {
                tree[name] = null;
            }
        }
    }

    await readDirectory(workspacePath, projectTree);
    return projectTree;
}

export function getGitLogPath(workspacePath: string): string {
    const gitLogPath = path.join(workspacePath, '.git', 'logs', 'HEAD');
    return gitLogPath;
}