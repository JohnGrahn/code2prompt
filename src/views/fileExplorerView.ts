import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as ignore from 'ignore';

export class FileExplorerProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | null | void> = new vscode.EventEmitter<FileItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private selectedItems: Map<string, boolean> = new Map();
    
    constructor(private workspaceRoot: string) {
        console.log('FileExplorerProvider initialized with root:', workspaceRoot);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FileItem): Promise<FileItem[]> {
        if (!this.workspaceRoot) {
            console.log('No workspace root found');
            return Promise.resolve([]);
        }

        const dirPath = element ? element.resourceUri.fsPath : this.workspaceRoot;
        console.log('Getting children for path:', dirPath);
        return this.getFileItems(dirPath);
    }

    private async getFileItems(dirPath: string): Promise<FileItem[]> {
        try {
            const items: FileItem[] = [];
            const files = await fs.promises.readdir(dirPath);
            console.log(`Found ${files.length} files in ${dirPath}`);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = await fs.promises.stat(filePath);
                const isDirectory = stat.isDirectory();

                const item = new FileItem(
                    vscode.Uri.file(filePath),
                    isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    this.selectedItems.get(filePath) || false
                );

                item.command = {
                    command: 'code2prompt.toggleSelection',
                    title: 'Toggle Selection',
                    arguments: [item]
                };

                items.push(item);
            }

            return items;
        } catch (error) {
            console.error('Error getting file items:', error);
            return [];
        }
    }

    toggleSelection(item: FileItem): void {
        if (!item || !item.resourceUri) {
            console.error('Invalid item passed to toggleSelection');
            return;
        }

        const filePath = item.resourceUri.fsPath;
        console.log('Toggling selection for path:', filePath);
        
        const isSelected = this.selectedItems.get(filePath);
        if (isSelected) {
            console.log('Removing path from selection');
            this.selectedItems.delete(filePath);
        } else {
            console.log('Adding path to selection');
            this.selectedItems.set(filePath, true);
        }
        
        const selectedPaths = Array.from(this.selectedItems.keys());
        console.log('Current selected items:', selectedPaths);
        this.refresh();
    }

    getSelectedItems(): string[] {
        const selectedPaths = Array.from(this.selectedItems.entries())
            .filter(([_, isSelected]) => isSelected)
            .map(([path]) => path);
        
        console.log('Getting selected items:', selectedPaths);
        return selectedPaths;
    }

    private getGitignore(): ignore.Ignore {
        const ig = ignore.default();
        const gitignorePath = path.join(this.workspaceRoot, '.gitignore');
        
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
        
        ig.add(['.git', 'node_modules']);
        
        return ig;
    }

    async selectAll(): Promise<void> {
        const ig = this.getGitignore();
        
        const getAllPaths = (dir: string): string[] => {
            let results: string[] = [];
            const list = fs.readdirSync(dir);
            
            for (const file of list) {
                const filePath = path.join(dir, file);
                const relativePath = path.relative(this.workspaceRoot, filePath);
                
                if (ig.ignores(relativePath)) {
                    continue;
                }
                
                const stat = fs.statSync(filePath);
                results.push(filePath);
                
                if (stat.isDirectory()) {
                    results = results.concat(getAllPaths(filePath));
                }
            }
            
            return results;
        };

        const allPaths = getAllPaths(this.workspaceRoot);
        this.selectedItems = new Map(allPaths.map(path => [path, true]));
        this._onDidChangeTreeData.fire();
    }
}

export class FileItem extends vscode.TreeItem {
    constructor(
        public readonly resourceUri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public selected: boolean
    ) {
        super(resourceUri, collapsibleState);
        this.tooltip = resourceUri.fsPath;
        this.description = selected ? '✓' : '';
        
        if (collapsibleState === vscode.TreeItemCollapsibleState.None) {
            this.iconPath = new vscode.ThemeIcon('file');
        } else {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }

    contextValue = 'fileItem';
} 