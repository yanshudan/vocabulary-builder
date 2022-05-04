// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addToKnown } from './addToKnown';
import { previewMaterial } from './previewMaterial';
import { globals } from './globals';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
interface Entry {
	word: string;
};
export class MyProvider implements vscode.TreeDataProvider<Entry> {
	getChildren(element?: Entry): vscode.ProviderResult<Entry[]> {
		const ret: Entry[] = [element ?? { word: "ds" }];
		return ret;
	};
	getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
		return new vscode.TreeItem("jdslkf");
	};
};
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	await globals.init();
	console.log('vocabulary-builder is activated');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let myprod = new MyProvider();
	vscode.window.registerTreeDataProvider("vocabulary-builder-view", myprod);
	vscode.commands.registerCommand('vocabulary-builder.previewMaterial', previewMaterial);
	vscode.commands.registerCommand("vocabulary-builder.addToKnown", addToKnown);

};
// this method is called when your extension is deactivated
export function deactivate() { }