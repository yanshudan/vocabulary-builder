import * as vscode from 'vscode';
import * as json from 'jsonc-parser';
import * as path from 'path';
import { globals } from './globals';

export class NewWordsProvider implements vscode.TreeDataProvider<number> {

	private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
	readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

	private tree!: json.Node;
	public text!: string;
	constructor(private context: vscode.ExtensionContext) {
		this.onActiveEditorChanged();
	}

	refresh(offset?: number): void {
		this.parseTree();
		if (offset) {
			this._onDidChangeTreeData.fire(offset);
		} else {
			this._onDidChangeTreeData.fire(null);
		}
	}


	private onActiveEditorChanged(): void {
		vscode.commands.executeCommand('setContext', 'jsonOutlineEnabled', true);
		this.refresh();
	}

	private parseTree(): void {
		this.text = `{${[...globals.groupedNewWords.entries()].map(m => '"' + m[0] + '":{' + [...m[1].entries()].map(e => `"${e[0]}":${e[1]}`).join(",") + "}").join(",")}}`;
		this.tree = json.parseTree(this.text)!;
	}

	getChildren(offset?: number): Thenable<number[]> {
		if (offset) {
			const path = json.getLocation(this.text, offset).path;
			const node = json.findNodeAtLocation(this.tree, path);
			return Promise.resolve(this.getChildrenOffsets(node!));
		} else {
			return Promise.resolve(this.tree ? this.getChildrenOffsets(this.tree) : []);
		}
	}

	private getChildrenOffsets(node: json.Node): number[] {
		const offsets: number[] = [];
		for (const child of node.children!) {
			const childPath = json.getLocation(this.text, child.offset).path;
			const childNode = json.findNodeAtLocation(this.tree, childPath);
			if (childNode) {
				offsets.push(childNode.offset);
			}
		}
		return offsets;
	}

	getTreeItem(offset: number): vscode.TreeItem {
		const path = json.getLocation(this.text, offset).path;
		const valueNode = json.findNodeAtLocation(this.tree, path);
		if (valueNode) {
			const hasChildren = valueNode.type === 'object' || valueNode.type === 'array';
			const label = this.getLabel(valueNode).split(":");
			const treeItem: vscode.TreeItem = new vscode.TreeItem(label[0], hasChildren ? valueNode.type === 'object' ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
			treeItem.command = {
				command: 'vocabulary-builder.innerWrapper',
				title: valueNode.value,
				arguments: [label[0]]
			};
			treeItem.iconPath = this.getIcon(valueNode);
			if (!hasChildren) {
				treeItem.description = label[1] + " times";
				treeItem.label = label[0];
				treeItem.contextValue = "newWord";
				treeItem.tooltip = globals.translated.get(label[0]);
			}
			return treeItem;
		}
		return null!;
	}

	private getIcon(node: json.Node): any {
		const nodeType = node.type;
		if (nodeType === 'boolean') {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'boolean.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'boolean.svg'))
			};
		}
		if (nodeType === 'string') {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'string.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'string.svg'))
			};
		}
		if (nodeType === 'number') {
			return {
				light: this.context.asAbsolutePath(path.join('resources', 'light', 'number.svg')),
				dark: this.context.asAbsolutePath(path.join('resources', 'dark', 'number.svg'))
			};
		}
		return null;
	}

	private getLabel(node: json.Node): string {
		if (node.parent!.type === 'array') {
			const prefix = node.parent!.children!.indexOf(node).toString();
			if (node.type === 'object') {
				return prefix + ':{ }';
			}
			if (node.type === 'array') {
				return prefix + ':[ ]';
			}
			return prefix + ':' + node.value.toString();
		}
		else {
			const property = node.parent!.children![0].value.toString();
			if (node.type === 'array' || node.type === 'object') {
				if (node.type === 'object') {
					return '{ } ' + property;
				}
				if (node.type === 'array') {
					return '[ ] ' + property;
				}
			}
			return `${property}: ${node.parent!.children![1].value}`;
		}
	}
}
