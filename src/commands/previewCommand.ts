import * as vscode from "vscode";
import { formatOutput } from "../utils/format";
import { getFiles, getGitignoreRules, getWorkspaceRoot } from "../utils/fileSystem";
import * as path from "path";

export async function previewExport(selectedPaths: string[]): Promise<void> {
	const workspaceRoot = getWorkspaceRoot();
	const config = vscode.workspace.getConfiguration("code2prompt");

	// Get .gitignore rules
	const ignoreRules = await getGitignoreRules(workspaceRoot);

	// Get all files from selected paths
	let allFiles: string[] = [];
	
	for (const selectedPath of selectedPaths) {
		console.log('Processing selected path:', selectedPath);
		try {
			const stat = await vscode.workspace.fs.stat(vscode.Uri.file(selectedPath));
			if (stat.type === vscode.FileType.Directory) {
				// If it's a directory, get all files within it
				const files = await getFiles(selectedPath, ignoreRules, true);
				console.log('Found files in directory:', files);
				allFiles = [...allFiles, ...files];
			} else {
				// If it's a file, add it directly
				console.log('Adding single file:', selectedPath);
				allFiles.push(selectedPath);
			}
		} catch (error) {
			console.error('Error processing path:', selectedPath, error);
			throw new Error(`Error processing path ${selectedPath}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	if (allFiles.length === 0) {
		throw new Error("No files found to preview");
	}

	console.log('All files to preview:', allFiles);

	// Format the output
	const useMarkdown = config.get<boolean>("useMarkdownBlocks", true);
	const output = await formatOutput(allFiles, workspaceRoot, useMarkdown);

	// Create and show the preview
	const doc = await vscode.workspace.openTextDocument({
		content: output,
		language: 'markdown'
	});
	await vscode.window.showTextDocument(doc, { preview: true, viewColumn: vscode.ViewColumn.Beside });
}
