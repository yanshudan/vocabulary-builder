import { globals } from "./globals";
import { getRenderStr, grabHtml, groupByLevel, loadTextFile, wordCount, writeTextFile } from "./utils";
import * as vscode from 'vscode';
import { lookUpDictionary } from "./lookUpDictionary";
async function getHtmlText(url: string): Promise<string> {
    //grab raw html
    const html = await grabHtml(url);
    if (html.length === 0) { return ""; }

    //extract text
    var domParser = require('dom-parser');
    const htmlstr = new domParser().parseFromString(html);
    let rawtext: string = "";
    //TODO: better html selectors to support all websites
    if (globals.selector.length === 0) {
        rawtext += (htmlstr.getElementsByAttribute("*", "*")[0] ?? { textContent: "" }).textContent;
    } else {
        for (let sel of globals.selector) {
            const content = htmlstr.getElementsByClassName(sel) as { textContent: string }[];
            rawtext += content.map(e => e.textContent);
        }
    }
    return rawtext;
}
export async function previewMaterial() {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    const url: string = await vscode.window.showInputBox({ title: "URL of the material", ignoreFocusOut: true }).then(async url => {
        if (url === undefined) {
            return "";
        }
        return url;
    });
    let rawtext: string = "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
        rawtext = await getHtmlText(url);
    } else {
        try {
            rawtext = await loadTextFile(url);
        } catch {
            vscode.window.showInformationMessage("Read file failed, please try with the full path of the file.");
        }
    }


    //wordcount, sort by length and freq
    const freq = await wordCount(rawtext);
    const mapSort1 = new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
    let finalmap = mapSort1;

    //pick known words
    const rawpick = await vscode.window.showQuickPick([...finalmap.entries()].map(e => `${e[0]} ${e[1]} times`), { canPickMany: true, ignoreFocusOut: true, "title": "Choose words that you already know" }) ?? [];
    const picked = rawpick.map(e => e.split(" ")[0]);
    console.log("user picked:");
    console.log(picked);

    //add to lists
    globals.knownWords = globals.knownWords.concat(picked);
    globals.knownprov.refresh();
    writeTextFile(globals.fpath, globals.knownWords);

    for (let pick of picked) {
        finalmap.delete(pick);
    }
    globals.newWords = finalmap;
    globals.translated = await lookUpDictionary([...globals.newWords.keys()]);
    globals.groupedNewWords = await groupByLevel(globals.newWords);
    // console.log(globals.groupedNewWords);
    //translate
    globals.newprov.refresh();
    const rawstrs = getRenderStr(globals.newWords, globals.translated);
    //render web view
    // let wvp = vscode.window.createWebviewPanel("web", "New words", { preserveFocus: true, viewColumn: 1 }, { enableForms: true });

    // const htmlstrs = rawstrs.map(s => {
    //     if (s.includes("-")) {
    //         return `</tr> </tbody> </table><table> <thead> <tr> <th>${s} </th> </tr> </thead> <tbody> <tr>`;
    //     }
    //     return "<tr><td><h3>" + s.replaceAll(",", "</h3></td><td><h3>") + "</h3></td></tr>";
    // });
    // let strs = "<table><tbody><tr>" + htmlstrs.join("") + "</tr></tbody></table>";
    // wvp.webview.postMessage(strs);
    // wvp.webview.html = `
    // 		<!DOCTYPE html>
    // 		<html lang="en">
    // 		<head></head>
    // 		<body>
    // 			${strs}
    // 		</body>
    // 		</html>`;

    writeTextFile(globals.outpath, rawstrs.map(e => e.replaceAll(",", " ")));
}