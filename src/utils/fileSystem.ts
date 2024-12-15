import * as path from "path";
import * as fs from "fs/promises";
import ignore from "ignore";
import * as vscode from "vscode";

export async function getGitignoreRules(
	workspaceRoot: string,
): Promise<ReturnType<typeof ignore>> {
	const ig = ignore();
	try {
		const gitignorePath = path.join(workspaceRoot, ".gitignore");
		const content = await fs.readFile(gitignorePath, "utf8");
		ig.add(content);
	} catch (error) {
		// If .gitignore doesn't exist, return empty ignore rules
		console.log("No .gitignore found or error reading it");
	}
	return ig;
}

export async function getFiles(
	folderPath: string,
	ignoreRules: ReturnType<typeof ignore>,
	includeIgnored = false,
): Promise<string[]> {
	const files: string[] = [];

	async function traverse(currentPath: string) {
		const entries = await fs.readdir(currentPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(currentPath, entry.name);
			const relativePath = path.relative(folderPath, fullPath);

			if (entry.isDirectory()) {
				if (entry.name === "node_modules" || entry.name === ".git") {
					continue;
				}
				await traverse(fullPath);
			} else {
				if (includeIgnored || !ignoreRules.ignores(relativePath)) {
					files.push(fullPath);
				}
			}
		}
	}

	await traverse(folderPath);
	return files;
}

export async function readFileContent(filePath: string): Promise<string> {
	try {
		return await fs.readFile(filePath, "utf8");
	} catch (error) {
		throw new Error(
			`Error reading file ${filePath}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

export function getWorkspaceRoot(): string {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		throw new Error("No workspace folder is open");
	}
	return workspaceFolders[0].uri.fsPath;
}
