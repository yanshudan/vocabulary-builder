import { globals } from "./globals";
import { getRenderStr, grabHtml, groupByLevel, wordCount, writeTextFile } from "./utils";
import * as vscode from 'vscode';
import { lookUpDictionary } from "./lookUpDictionary";

export async function previewMaterial() {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user

    //grab raw html
    const html = await grabHtml();
    if (html.length === 0) { return; }

    //extract text
    var domParser = require('dom-parser');
    const htmlstr = new domParser().parseFromString(html);
    let rawtext: string = "";
    if (globals.selector.length === 0) {
        rawtext += (htmlstr.getElementsByAttribute("*", "*")[0] ?? { textContent: "" }).textContent;
    } else {
        for (let sel of globals.selector) {
            const content = htmlstr.getElementsByClassName(sel) as { textContent: string }[];
            rawtext += content.map(e => e.textContent);
        }
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
    globals.groupedNewWords = await groupByLevel(globals.newWords);
    // console.log(globals.groupedNewWords);
    //translate
    globals.chinese = await lookUpDictionary([...globals.newWords.keys()]);
    globals.newprov.refresh();
    const rawstrs = getRenderStr(globals.newWords, globals.chinese);
    //TODO: add group by level, eg. CET4, IELTS/TOEFL, GRE...
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