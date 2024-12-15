import * as vscode from "vscode";
import {
	getFiles,
	getGitignoreRules,
	getWorkspaceRoot,
} from "../utils/fileSystem";
import { formatOutput } from "../utils/format";

export async function previewExport(resource?: vscode.Uri): Promise<void> {
	const workspaceRoot = getWorkspaceRoot();
	const config = vscode.workspace.getConfiguration("code2prompt");

	// Get starting directory (workspace root or selected folder)
	const startPath = resource?.fsPath || workspaceRoot;

	// Get .gitignore rules
	const ignoreRules = await getGitignoreRules(workspaceRoot);

	// Allow user to override .gitignore
	const includeIgnored =
		(await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: "Include files ignored by .gitignore?",
		})) === "Yes";

	// Get all files
	const files = await getFiles(startPath, ignoreRules, includeIgnored);

	if (files.length === 0) {
		throw new Error("No files found to preview");
	}

	// Format the output
	const useMarkdown = config.get<boolean>("useMarkdownBlocks", true);
	const output = await formatOutput(files, workspaceRoot, useMarkdown);

	// Create and show preview document
	const document = await vscode.workspace.openTextDocument({
		content: output,
		language: useMarkdown ? "markdown" : "plaintext",
	});

	await vscode.window.showTextDocument(document, {
		preview: true,
		viewColumn: vscode.ViewColumn.Beside,
	});
}
