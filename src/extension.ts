// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import fetch from 'node-fetch';
import path = require('path');
import { stringify } from 'querystring';
import * as vscode from 'vscode';
import { addKnownWords, loadBasicWords, loadKnownWords } from "./basicWords";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vocabulary-builder" is now active!');
	//TODO: create knownwords automatically
	const basicWords = loadBasicWords();
	let knownWords = await loadKnownWords();
	const grabHtml = async (): Promise<string> => {
		return vscode.window.showInputBox({ title: "URL of the material", ignoreFocusOut: true }).then(async url => {
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
	const wordCount = async (rawtext: string): Promise<Map<string, number>> => {
		let words = rawtext.toLowerCase();
		const nullchars: string = vscode.workspace.getConfiguration("vocabBuilder").get("nullChars", ",.:!+-—*?()[]%“”\"/1234567890\n");
		//TODO: use regex
		for (let c of nullchars) {
			words = words.replaceAll(c, " ");
		}
		const wordlist = words.split(" ");
		let freq = new Map<string, number>();
		for (let word of wordlist) {
			if (word.length < 3 || word.includes("'") || basicWords.includes(word) || knownWords.includes(word)) {
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

		//grab raw html
		const html = await grabHtml();

		//extract text
		var domParser = require('dom-parser');
		const parser = new domParser();
		const rawtext: string = parser.parseFromString(html).getElementsByClassName('transcript')[0].textContent;

		//wordcount, sort by length and freq
		const freq = await wordCount(rawtext);
		const mapSort1 = new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
		let finalmap = new Map([...mapSort1.entries()].sort((a, b) => a[0].length - b[0].length));

		//pick known words
		const picked = await vscode.window.showQuickPick([...finalmap.keys()], { canPickMany: true, ignoreFocusOut: true, "title": "Choose words that you already know" }) ?? [];
		console.log("user picked:");
		console.log(picked);

		//add to lists
		knownWords = knownWords.concat(picked);
		await addKnownWords(picked);
		for (let pick of picked) {
			finalmap.delete(pick);
		}

		//render web view
		let wvp = vscode.window.createWebviewPanel("web", "New words", { preserveFocus: true, viewColumn: 1 }, { enableForms: true });
		const strs = "<h3>" + getRenderStr(finalmap).join("</h3><h3>") + "</h3>";
		wvp.webview.postMessage(strs);
		console.log(strs);
		wvp.webview.html = `
		<!DOCTYPE html>
		<html lang="en">
		<head></head>
		<body>
			${strs}
		</body>
		</html>`;
	});
	let cmd2 = vscode.commands.registerCommand("vocabulary-builder.addToKnown", () => {
		const sel = vscode.window.activeTextEditor?.selection;
		const text = vscode.window.activeTextEditor?.document.getText(sel);
		if (text === undefined) {
			return;
		}
		vscode.window.showInformationMessage("you selected " + text);
		if (!knownWords.includes(text)) {
			knownWords.concat([text]);
			addKnownWords([text]);
		}
	});

	context.subscriptions.push(cmd1);
	context.subscriptions.push(cmd2);
}
function getRenderStr(freq: Map<string, number>): string[] {
	//TODO: better formatting
	let ret: string[] = [];
	let count = 0, curr = 2, total = 120;
	let nc = total / (curr + 2 + 8);
	let i = 0;
	let tmp: string = "";
	for (let item of freq) {
		if (item[0].length > curr) {
			ret = ret.concat([tmp]);
			tmp = "";
			ret = ret.concat(["-------" + i.toString()]);
			count = 0;
			curr += 2;
			nc = total / (curr + 2 + 10);
		}
		tmp += item[0] + " ".repeat(curr - item[0].length+3-item[1].toString().length) + item[1]+",";
		count++;
		if (count >= nc) {
			ret = ret.concat([tmp]);
			tmp = "";
			count = 0;
		}
		++i;
	}
	ret = ret.concat(["-------" + i.toString()]);
	return ret;
}
// this method is called when your extension is deactivated
export function deactivate() { }
