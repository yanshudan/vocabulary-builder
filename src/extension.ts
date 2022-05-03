// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { worker } from 'cluster';
import fetch from 'node-fetch';
import path = require('path');
import { stringify } from 'querystring';
import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { addKnownWords, loadBasicWords, loadKnownWords } from "./basicWords";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('vocabulary-builder is activated');
	//TODO: create knownwords automatically

	//configs
	const folders = vscode.workspace.workspaceFolders ?? [];
	const rootpath = folders[0].uri.fsPath;
	const config = vscode.workspace.getConfiguration("vocabBuilderConfig");
	const fpath = rootpath + "/" + config.get<string>("knownWordsPath", "knownwords.txt");
	const outpath = rootpath + "/" + config.get<string>("outPath", "out.txt");
	let selector: string[];

	//load vocab
	const basicWords = loadBasicWords();
	let knownWords = await loadKnownWords(fpath);

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
			const selectors = config.get<Map<string, string[]>>("classSelectors");
			if (selectors === undefined) { return ""; }
			const sel = Object.entries(selectors);
			for (let k of [...sel.values()]) {
				if (url.includes(k[0])) {
					selector = k[1] ?? [];
					break;
				}
			}
			const result = await response.text();
			return result;
		});
	};
	const wordCount = async (rawtext: string): Promise<Map<string, number>> => {
		let words = rawtext.toLowerCase();
		const nullchars: string = config.get<string>("nullChars", "");
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
	const getRenderStr = (freq: any[], chinese: string[]): string[] => {
		//TODO: better formatting
		let ret: string[] = [];
		let count = 0, curr = 0, total = 120;
		let nc = total / (curr + 3 + 5);
		let i = 0;
		let tmp: string = "";
		try {
			for (let i = 0; i < freq.length; ++i) {
				const item = freq[i];
				const chi = chinese[i];
				if (item[0].length > curr) {
					ret = ret.concat([tmp]);
					tmp = "";
					ret = ret.concat(["-------" + i.toString()]);
					count = 0;
					curr += 2;
					nc = total / (curr + 3 + 5);
				}
				tmp += item[0] + "," + " ".repeat(curr + 3 - item[0].length - item[1].toString().length) + item[1] + "," + chi + "　".repeat(Math.max(5 - chi.length,0)) + ",";
				count++;
				if (count >= nc) {
					ret = ret.concat([tmp]);
					tmp = "";
					count = 0;
				}
				++i;
			}
		} catch (e) {
			console.log(e);
		}
		ret = ret.concat(["-------" + i.toString()]);
		return ret;
	};
	const translateWords = async (words: any[]): Promise<string[]> => {
		const req = words.map(e => {
			return { "text": e[0] };
		});
		class responseType {
			translations: { text: string; }[] = [];
		};
		const axios = require('axios').default;
		const { v4: uuidv4 } = require('uuid');
		const translatorConfig = config.get<Map<string, string>>("translatorConfig");
		if (translatorConfig === undefined) { return []; };
		return await axios({
			baseURL: translatorConfig.endpoint,
			url: '/translate',
			method: 'post',
			headers: {
				'Ocp-Apim-Subscription-Key': translatorConfig.key,
				'Ocp-Apim-Subscription-Region': translatorConfig.location,
				'Content-type': 'application/json',
				'X-ClientTraceId': uuidv4().toString()
			},
			params: {
				'api-version': '3.0',
				'from': 'en',
				'to': ['zh-Hans']
			},
			data: req,
			responseType: 'json'
		}).then(function (response) {
			return response.data.map((e: responseType) => e.translations[0].text.replaceAll(" ", ""));
		});
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
		const htmlstr = new domParser().parseFromString(html);

		let rawtext: string = "";
		for (let sel of selector) {
			rawtext += (htmlstr.getElementsByClassName(sel)[0] ?? {textContext:""}).textContent;
		}

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
		await addKnownWords(picked, fpath);
		for (let pick of picked) {
			finalmap.delete(pick);
		}
		let newlist = [...finalmap.entries()];

		//translate
		const chinese = await translateWords(newlist);

		//render web view
		let wvp = vscode.window.createWebviewPanel("web", "New words", { preserveFocus: true, viewColumn: 1 }, { enableForms: true });
		const rawstrs = getRenderStr(newlist, chinese);
		const htmlstrs = rawstrs.map(s => {
			if (s.includes("-")) {
				return `</tr> </tbody> </table><table> <thead> <tr> <th>${s} </th> </tr> </thead> <tbody> <tr>`;
			}
			return "<tr><td><h3>" + s.replaceAll(",", "</h3></td><td><h3>") + "</h3></td></tr>";
		});
		let strs = "<table><tbody><tr>" + htmlstrs.join("") + "</tr></tbody></table>";
		wvp.webview.postMessage(strs);
		wvp.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<head></head>
			<body>
				${strs}
			</body>
			</html>`;

		//write out file
		const fileUri = vscode.Uri.file(path.resolve(outpath));
		let final: string;
		vscode.workspace.fs.readFile(fileUri).then(c => {
			final = rawstrs.map(e => e.replaceAll(",", " ")).join("\n");
			const out: Uint8Array = new TextEncoder().encode(final);
			vscode.workspace.fs.writeFile(fileUri, out);
		});
		//TODO: open text editor
		const td = await vscode.workspace.openTextDocument(fileUri);
	});
	let cmd2 = vscode.commands.registerCommand("vocabulary-builder.addToKnown", () => {
		const sel = vscode.window.activeTextEditor?.selections??[];
		const text = sel.map(s => vscode.window.activeTextEditor?.document.getText(s) ?? "");
		let unique: string[]=[];
		for (let t of text) {
			if (!knownWords.includes(t)) {
				unique = unique.concat([t]);
			}
		}
		vscode.window.showInformationMessage("you learned word: " + text.join(","));
		knownWords.concat(unique);
		addKnownWords(unique, fpath);
	});

	context.subscriptions.push(cmd1);
	context.subscriptions.push(cmd2);
}
// this method is called when your extension is deactivated
export function deactivate() { }
