// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { get } from 'https';
import path = require('path');
import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vocabulary-builder" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let cmd1 = vscode.commands.registerCommand('vocabulary-builder.previewMaterial', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInputBox({ "title": "URL of the material" }).then(ret => {
			if (ret === undefined) {
				return;
			}
			vscode.window.showInformationMessage(ret);
			get(ret, res => {
				vscode.window.showInformationMessage(JSON.stringify(res.headers));
			});
		});
	});
	let cmd2 = vscode.commands.registerCommand("vocabulary-builder.addToKnown", () => {
		const sel = vscode.window.activeTextEditor?.selection;
		const text = vscode.window.activeTextEditor?.document.getText(sel);
		if (text === undefined) {
			return;
		}
		vscode.window.showInformationMessage("you selected " + text);
		let final: string;
		let out: Uint8Array;
		const fileUri =vscode.Uri.file(path.resolve("C:/workspace/vocabulary-builder/known.txt"));
		let content = vscode.workspace.fs.readFile(fileUri).then(c => {
			final = new TextDecoder("utf-8").decode(c) + text +"\n";
			out = new TextEncoder().encode(final);
			vscode.workspace.fs.writeFile(fileUri, out);
		});
	});

	context.subscriptions.push(cmd1);
	context.subscriptions.push(cmd2);
}

// this method is called when your extension is deactivated
export function deactivate() {}
