// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { addToKnown } from './addToKnown';
import { previewMaterial } from './previewMaterial';
import { globals } from './globals';
import { lookForSyn } from './lookForSyn';
import { sampleSentences } from './sampleSentences';
import { NewWordsProvider } from './newWordsProvider';
import { addToGood, dumpGoodWords } from './addToGood';
import { lookUpDictionary } from './lookUpDictionary';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	let rootpath: string = vscode.workspace.getConfiguration("vocabBuilderConfig").get("rootPath", "");
	if (rootpath === "") {
		
		vscode.window.showInformationMessage("Please pick a path to store your vocabulary");
		const folders = vscode.workspace.workspaceFolders ?? [{uri:undefined}];
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
		await vscode.workspace.getConfiguration("vocabBuilderConfig").update("rootPath", picked[0].fsPath);
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
	//TODO: P3 add custom sort rules
	let newWordsView = vscode.window.createTreeView("newWords", { "treeDataProvider": globals.newprov, canSelectMany: true });
	let goodWordsView = vscode.window.createTreeView("goodWords", { "treeDataProvider": globals.goodprov, canSelectMany: true });
	let synonymsView = vscode.window.createTreeView("Synonyms", { "treeDataProvider": globals.synprov });
	// let samplesView = vscode.window.createTreeView("Samples", { "treeDataProvider": globals.samprov });
	vscode.commands.registerCommand('vocabulary-builder.previewMaterial', previewMaterial);
	vscode.commands.registerCommand("vocabulary-builder.addToKnown", addToKnown);
	vscode.commands.registerCommand("vocabulary-builder.addToGood", addToGood);
	vscode.commands.registerCommand("vocabulary-builder.dumpGoodWords", dumpGoodWords);
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
			lookUpDictionary([word]);

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