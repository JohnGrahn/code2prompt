import * as path from "path";
import * as vscode from "vscode";
import { splitAndCopyToClipboard } from "../utils/clipboard";
import {
	getFiles,
	getGitignoreRules,
	getWorkspaceRoot,
} from "../utils/fileSystem";
import { formatOutput } from "../utils/format";

export async function exportToClipboard(selectedPaths: string[]): Promise<void> {
	const workspaceRoot = getWorkspaceRoot();
	const config = vscode.workspace.getConfiguration("code2prompt");

	// Get .gitignore rules
	const ignoreRules = await getGitignoreRules(workspaceRoot);

	// Allow user to override .gitignore
	const includeIgnored =
		(await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: "Include files ignored by .gitignore?",
		})) === "Yes";

	// Get all files from selected paths
	let allFiles: string[] = [];
	for (const selectedPath of selectedPaths) {
		const files = await getFiles(selectedPath, ignoreRules, includeIgnored);
		allFiles = [...allFiles, ...files];
	}

	if (allFiles.length === 0) {
		throw new Error("No files found to export");
	}

	// Format the output
	const useMarkdown = config.get<boolean>("useMarkdownBlocks", true);
	const output = await formatOutput(allFiles, workspaceRoot, useMarkdown);

	// Handle large output
	const maxSize = config.get<number>("maxOutputSize", 1000000);
	const parts = await splitAndCopyToClipboard(output, maxSize);

	if (parts > 1) {
		vscode.window.showInformationMessage(
			`Output split into ${parts} parts. Part 1 copied to clipboard. Use the preview command to see full output.`,
		);
	}
}
