import { globals } from "../globals";
import { getHtmlText, getRenderStr, groupByLevel, loadTextFile, writeTextFile } from "../utils";
import * as vscode from 'vscode';
import { wordCount } from "../service/wordcount";

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
    globals.groupedNewWords = await groupByLevel(globals.newWords);
    // console.log(globals.groupedNewWords);
    globals.newprov.refresh();
    const rawstrs = getRenderStr(globals.newWords, globals.translated);

    writeTextFile(globals.outpath, rawstrs.map(e => e.replaceAll(",", " ")));
}