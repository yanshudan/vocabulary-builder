import { globals } from "./globals";
import { getRenderStr, grabHtml, translateWords, wordCount, writeTextFile } from "./utils";
import * as vscode from 'vscode';

export async function previewMaterial () {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user

    //grab raw html
    const html = await grabHtml();
    if (html.length === 0) { return; }

    //extract text
    var domParser = require('dom-parser');
    const htmlstr = new domParser().parseFromString(html);

    let rawtext: string = "";
    for (let sel of globals.selector) {
        rawtext += (htmlstr.getElementsByClassName(sel)[0] ?? { textContext: "" }).textContent;
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
    globals.knownWords = globals.knownWords.concat(picked);
    writeTextFile(globals.fpath, globals.knownWords);

    for (let pick of picked) {
        finalmap.delete(pick);
    }
    globals.newWords = finalmap;
    globals.newprov.refresh();
    //translate
    const chinese = await translateWords([...globals.newWords.keys()]);

    //render web view
    let wvp = vscode.window.createWebviewPanel("web", "New words", { preserveFocus: true, viewColumn: 1 }, { enableForms: true });
    const rawstrs = getRenderStr(globals.newWords, chinese);
    //TODO: add checkbox and send the known words back

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

    writeTextFile(globals.outpath, rawstrs.map(e => e.replaceAll(",", " ")));
    //TODO: open text editor
    const td = await vscode.workspace.openTextDocument(globals.outpath);
}