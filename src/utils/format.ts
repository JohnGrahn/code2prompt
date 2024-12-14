import * as path from 'path';
import * as vscode from 'vscode';

export function generateSourceTree(files: string[], workspaceRoot: string): string {
    const tree: { [key: string]: any } = {};

    // Sort files for consistent output
    files.sort().forEach(file => {
        const relativePath = path.relative(workspaceRoot, file);
        const parts = relativePath.split(path.sep);
        
        let currentLevel = tree;
        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                currentLevel[part] = null; // Mark as file
            } else {
                if (!currentLevel[part]) {
                    currentLevel[part] = {};
                }
                currentLevel = currentLevel[part];
            }
        });
    });

    function buildTreeString(node: any, prefix: string = ''): string {
        let result = '';
        const entries = Object.entries(node);
        
        entries.forEach(([name, value], index) => {
            const isLast = index === entries.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            
            result += prefix + connector + name + '\n';
            
            if (value !== null) { // If it's a directory
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += buildTreeString(value, newPrefix);
            }
        });
        
        return result;
    }

    return 'Project Source Tree:\n' + buildTreeString(tree);
}

export function formatFileHeader(filePath: string, workspaceRoot: string): string {
    const relativePath = path.relative(workspaceRoot, filePath);
    return `\n// ----- file: ${relativePath} -----\n`;
}

export function wrapInMarkdownBlock(content: string, filePath: string): string {
    const extension = path.extname(filePath).slice(1);
    const language = extension || 'text';
    return '```' + language + '\n' + content + '\n```\n';
}

export async function formatOutput(
    files: string[],
    workspaceRoot: string,
    useMarkdown: boolean = true
): Promise<string> {
    let output = generateSourceTree(files, workspaceRoot) + '\n';

    for (const file of files) {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(file));
        let fileContent = Buffer.from(content).toString('utf8');
        
        if (useMarkdown) {
            fileContent = wrapInMarkdownBlock(fileContent, file);
        }
        
        output += formatFileHeader(file, workspaceRoot) + fileContent + '\n';
    }

    return output;
} 