import * as vscode from 'vscode';
import { globals } from './globals';
import { writeTextFile } from './utils';


export function addToKnown(word?: string) {
    let text: string[];
    if (word === undefined) {
        const sel = vscode.window.activeTextEditor?.selections ?? [];
        text = sel.map(s => vscode.window.activeTextEditor?.document.getText(s) ?? "");
    } else if(typeof(word)==='number') {
        text = [globals.newprov.getTreeItem(word)!.label as string];
    } else {
        text = [word];
    }
    let unique: string[] = [];
    for (let t of text) {
        if (!globals.knownWords.includes(t)) {
            unique = unique.concat([t]);
        }
    }
    for (let w of unique) {
        for (let k of globals.groupedNewWords.keys()) { 
            if (globals.groupedNewWords.get(k)!.has(w)) {
                globals.groupedNewWords.get(k)!.delete(w);
            }
        }
    }
    globals.newprov.refresh();

    vscode.window.showInformationMessage("you learned word: " + text.join(","));
    globals.knownWords = globals.knownWords.concat(unique);
    globals.knownprov.refresh();
    writeTextFile(globals.fpath, globals.knownWords);
}