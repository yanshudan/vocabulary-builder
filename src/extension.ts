// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addToKnown } from './addToKnown';
import { previewMaterial } from './previewMaterial';
import { globals } from './globals';
import { lookForSyn } from './lookForSyn';
import { sampleSentences } from './sampleSentences';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	await globals.init();
	console.log('vocabulary-builder is activated');
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	// vscode.window.registerTreeDataProvider("vocabulary-builder-view", globals.myprod);
	let knownWordsView = vscode.window.createTreeView("knownWords", { "treeDataProvider": globals.knownprov });
	//TODO: add custom sort rules
	let newWordsView = vscode.window.createTreeView("newWords", { "treeDataProvider": globals.newprov, canSelectMany: true });
	let synonymsView = vscode.window.createTreeView("Synonyms", { "treeDataProvider": globals.synprov });
	// let samplesView = vscode.window.createTreeView("Samples", { "treeDataProvider": globals.samprov });
	vscode.commands.registerCommand('vocabulary-builder.previewMaterial', previewMaterial);
	vscode.commands.registerCommand("vocabulary-builder.addToKnown", addToKnown);
	vscode.commands.registerCommand("vocabulary-builder.lookForSyn", async () => await lookForSyn());
	vscode.commands.registerCommand("vocabulary-builder.getSampleSentences", async (word) => await sampleSentences(word));
	vscode.commands.registerCommand("vocabulary-builder.innerWrapper", async (word) => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Fetching data...",
			cancellable: true
		}, async (progress, token) => {
			token.onCancellationRequested(() => {
				console.log("Request Canceled by user");
			});
			progress.report({ increment: 0 });
			let p1 = sampleSentences(word);
			let p2 = lookForSyn(word);


			setTimeout(() => {
				progress.report({ increment: 10, message: "Sending Requests" });
			}, 1000);
			await p2;
			setTimeout(() => {
				progress.report({ increment: 40, message: "Fetched Synonyms!" });
			}, 1000);
			await p1;
			setTimeout(() => {
				progress.report({ increment: 50, message: "Fetched Sample Sentences!" });
			}, 1000);
			const p = new Promise<void>(resolve => {
				setTimeout(() => {
					resolve();
				}, 2000);
			});
			return p;
		});
	});


};
// this method is called when your extension is deactivated
export function deactivate() { }