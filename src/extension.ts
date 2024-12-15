import * as vscode from "vscode";
import { exportToClipboard } from "./commands/exportCommand";
import { previewExport } from "./commands/previewCommand";

export function activate(context: vscode.ExtensionContext) {
	console.log("Code2Prompt is now active");

	const exportDisposable = vscode.commands.registerCommand(
		"code2prompt.exportToClipboard",
		async (resource: vscode.Uri) => {
			try {
				await exportToClipboard(resource);
				vscode.window.showInformationMessage(
					"Project code copied to clipboard for LLM!",
				);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error exporting code: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}
		},
	);

	const previewDisposable = vscode.commands.registerCommand(
		"code2prompt.previewExport",
		async (resource: vscode.Uri) => {
			try {
				await previewExport(resource);
			} catch (error) {
				vscode.window.showErrorMessage(
					`Error previewing export: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}
		},
	);

	context.subscriptions.push(exportDisposable, previewDisposable);
}

export function deactivate() {}
