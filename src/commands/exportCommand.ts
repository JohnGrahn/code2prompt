import * as vscode from 'vscode';
import * as path from 'path';
import { getGitignoreRules, getFiles, getWorkspaceRoot } from '../utils/fileSystem';
import { formatOutput } from '../utils/format';
import { splitAndCopyToClipboard } from '../utils/clipboard';

export async function exportToClipboard(resource?: vscode.Uri): Promise<void> {
    const workspaceRoot = getWorkspaceRoot();
    const config = vscode.workspace.getConfiguration('code2prompt');
    
    // Get starting directory (workspace root or selected folder)
    const startPath = resource?.fsPath || workspaceRoot;
    
    // Get .gitignore rules
    const ignoreRules = await getGitignoreRules(workspaceRoot);
    
    // Allow user to override .gitignore
    const includeIgnored = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Include files ignored by .gitignore?' }
    ) === 'Yes';
    
    // Get all files
    const files = await getFiles(startPath, ignoreRules, includeIgnored);
    
    if (files.length === 0) {
        throw new Error('No files found to export');
    }
    
    // Format the output
    const useMarkdown = config.get<boolean>('useMarkdownBlocks', true);
    const output = await formatOutput(files, workspaceRoot, useMarkdown);
    
    // Handle large output
    const maxSize = config.get<number>('maxOutputSize', 1000000);
    const parts = await splitAndCopyToClipboard(output, maxSize);
    
    if (parts > 1) {
        vscode.window.showInformationMessage(
            `Output split into ${parts} parts. Part 1 copied to clipboard. Use the preview command to see full output.`
        );
    }
} 