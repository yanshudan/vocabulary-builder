// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addToKnown } from './command/addToKnown';
import { previewMaterial } from './command/previewMaterial';
import { globals } from './globals';
import { lookForSyn } from './command/lookForSyn';
import { sampleSentences } from './command/lookForSamples';
import { NewWordsProvider } from './provider/newWordsProvider';
import { addToGood } from './command/addToGood';
import { wordDetail } from './command/wordDetail';
import { dumpFiles } from './utils';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	let rootpath: string = vscode.workspace.getConfiguration("vocabulary-builder").get("rootPath", "");
	if (rootpath === "") {
		vscode.window.showInformationMessage("Please pick a path to store your vocabulary");
		const folders = vscode.workspace.workspaceFolders ?? [{ uri: undefined }];
		const picked = await vscode.window.showOpenDialog({
			"canSelectFolders": true,
			"canSelectFiles": false,
			"canSelectMany": false,
			"defaultUri": folders[0].uri
		});
		if (picked === undefined) {
			vscode.window.showInformationMessage("No folders picked, please reload and pick one");
			return;
		}
		globals.rootpath = picked[0].fsPath;
		await vscode.workspace.getConfiguration("vocabulary-builder").update("rootPath", picked[0].fsPath);
	} else {
		globals.rootpath = rootpath;
	}

	await globals.init();
	console.log('vocabulary-builder is activated');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// vscode.window.registerTreeDataProvider("vocabulary-builder-view", globals.myprod);
	globals.newprov = new NewWordsProvider(context);
	let knownWordsView = vscode.window.createTreeView("knownWords", { "treeDataProvider": globals.knownprov });
	let newWordsView = vscode.window.createTreeView("newWords", { "treeDataProvider": globals.newprov, canSelectMany: true });
	let goodWordsView = vscode.window.createTreeView("goodWords", { "treeDataProvider": globals.goodprov, canSelectMany: true });
	let synonymsView = vscode.window.createTreeView("Synonyms", { "treeDataProvider": globals.synprov });
	// let samplesView = vscode.window.createTreeView("Samples", { "treeDataProvider": globals.samprov });
	vscode.commands.registerCommand('vocabulary-builder.previewMaterial', previewMaterial);
	vscode.commands.registerCommand("vocabulary-builder.addToKnown", addToKnown);
	vscode.commands.registerCommand("vocabulary-builder.addToGood", addToGood);
	vscode.commands.registerCommand("vocabulary-builder.dumpFiles", dumpFiles);
	vscode.commands.registerCommand("vocabulary-builder.lookForSyn", async () => await lookForSyn());
	vscode.commands.registerCommand("vocabulary-builder.getSampleSentences", async (word) => await sampleSentences(word));
	vscode.commands.registerCommand("vocabulary-builder.innerWrapper", wordDetail);


};

// this method is called when your extension is deactivated
export function deactivate() {

}