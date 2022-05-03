// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import fetch from 'node-fetch';
import { resolve } from 'path';
import path = require('path');
import { memoryUsage } from 'process';
import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { loadBasicWords, loadKnownWords } from "./basicWords";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vocabulary-builder" is now active!');
	const basicWords = loadBasicWords();
	const knownWords = await loadKnownWords();
	const grabHtml = async (): Promise<String> => {
		return vscode.window.showInputBox({ "title": "URL of the material" }).then(async url => {
			if (url === undefined) {
				return "";
			}
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					accept: '*/*',
				}
			});
			if (!response.ok) {
				vscode.window.showInformationMessage(String(response.status ?? 500));
				return "";
			}
			const result = await response.text();
			return result;
		});
	};
	const wordCount = async (rawtext: string): Promise<Map<String, number>> => {
		let words = rawtext.toLowerCase();
		const nullchars: string = vscode.workspace.getConfiguration("vocabBuilder").get("nullChars", ",.:!+-—*?()[]%“”\"/1234567890\n");
		vscode.window.showInformationMessage(words);
		for (let c of nullchars) {
			words = words.replaceAll(c, " ");
		}
		const wordlist = words.split(" ");
		vscode.window.showInformationMessage(JSON.stringify(wordlist));
		let freq = new Map<String, number>();
		for (let word of wordlist) {
			if (word.length < 3 || basicWords.includes(word) || knownWords.includes(word)) {
				continue;
			}
			let val = freq.get(word) ?? 0;
			freq.set(word, val + 1);
		}
		return freq;
	};
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let cmd1 = vscode.commands.registerCommand('vocabulary-builder.previewMaterial', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const html = await grabHtml();
		var domParser = require('dom-parser');
		const parser = new domParser();
		const rawtext: string = parser.parseFromString(html).getElementsByClassName('transcript')[0].textContent;
		const freq = await wordCount(rawtext);
		const mapSort1 = new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
		const finalmap = new Map([...mapSort1.entries()].sort((a, b) => b[0].length - a[0].length));
		console.log([...finalmap]);   
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
		const fileUri = vscode.Uri.file(path.resolve(vscode.workspace.getConfiguration("vocabBuilderConfig").get("knownWordsPath", "C:/workspace/known.txt")));
		vscode.workspace.fs.readFile(fileUri).then(c => {
			final = new TextDecoder("utf-8").decode(c) + text + "\n";
			out = new TextEncoder().encode(final);
			vscode.workspace.fs.writeFile(fileUri, out);
		});
	});

	context.subscriptions.push(cmd1);
	context.subscriptions.push(cmd2);
}

// this method is called when your extension is deactivated
export function deactivate() { }
