import * as vscode from 'vscode';

export async function copyToClipboard(text: string): Promise<void> {
    await vscode.env.clipboard.writeText(text);
}

export async function splitAndCopyToClipboard(text: string, maxSize: number): Promise<number> {
    const parts = [];
    let currentPart = '';
    const lines = text.split('\n');

    for (const line of lines) {
        if ((currentPart + line + '\n').length > maxSize) {
            if (currentPart) {
                parts.push(currentPart);
                currentPart = '';
            }
            // If a single line is too long, split it
            if (line.length > maxSize) {
                const chunks = line.match(new RegExp(`.{1,${maxSize}}`, 'g')) || [];
                parts.push(...chunks.slice(0, -1));
                currentPart = chunks[chunks.length - 1] + '\n';
            } else {
                currentPart = line + '\n';
            }
        } else {
            currentPart += line + '\n';
        }
    }

    if (currentPart) {
        parts.push(currentPart);
    }

    // Copy first part to clipboard
    if (parts.length > 0) {
        await copyToClipboard(parts[0]);
    }

    return parts.length;
} 