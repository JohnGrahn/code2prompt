import * as vscode from "vscode";
import { exportToClipboard } from "./commands/exportCommand";
import { previewExport } from "./commands/previewCommand";
import { FileExplorerProvider, FileItem } from "./views/fileExplorerView";

export function activate(context: vscode.ExtensionContext) {
	console.log("Code2Prompt is now active");

	// Initialize the file explorer provider
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
	if (!workspaceRoot) {
		vscode.window.showErrorMessage("No workspace folder found");
		return;
	}

	const fileExplorerProvider = new FileExplorerProvider(workspaceRoot);
	
	// Register the tree data provider
	vscode.window.registerTreeDataProvider('code2promptExplorer', fileExplorerProvider);
	
	// Create the tree view
	const treeView = vscode.window.createTreeView('code2promptExplorer', {
		treeDataProvider: fileExplorerProvider,
		showCollapseAll: true
	});

	const toggleSelectionDisposable = vscode.commands.registerCommand(
		'code2prompt.toggleSelection',
		(item: FileItem) => {
			console.log('Toggling selection for:', item.resourceUri.fsPath);
			fileExplorerProvider.toggleSelection(item);
		}
	);

	const exportDisposable = vscode.commands.registerCommand(
		"code2prompt.exportToClipboard",
		async (resource?: vscode.Uri) => {
			try {
				let selectedPaths: string[] = [];
				
				if (resource) {
					console.log('Export - Using resource:', resource.fsPath);
					selectedPaths = [resource.fsPath];
				} else {
					selectedPaths = fileExplorerProvider.getSelectedItems();
					console.log('Export - Selected items:', selectedPaths);
				}

				if (!selectedPaths || selectedPaths.length === 0) {
					vscode.window.showWarningMessage("No files selected for export");
					return;
				}

				await exportToClipboard(selectedPaths);
				vscode.window.showInformationMessage(
					"Project code copied to clipboard for LLM!",
				);
			} catch (error) {
				console.error('Export error:', error);
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
		async (_resource?: vscode.Uri) => {
			try {
				const selectedPaths = fileExplorerProvider.getSelectedItems();
				console.log('Preview - Selected items from provider:', selectedPaths);

				if (!selectedPaths || selectedPaths.length === 0) {
					vscode.window.showWarningMessage("No files selected for preview");
					return;
				}

				await previewExport(selectedPaths);
			} catch (error) {
				console.error('Preview error:', error);
				vscode.window.showErrorMessage(
					`Error previewing export: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}
		},
	);

	context.subscriptions.push(
		exportDisposable,
		previewDisposable,
		toggleSelectionDisposable,
		treeView
	);
}

export function deactivate() {}
