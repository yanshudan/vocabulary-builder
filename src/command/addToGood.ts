import * as vscode from 'vscode';
import { globals } from '../globals';
import { writeTextFile } from '../utils';


export function addToGood(word?: string) {
    //get input
    let text: string[];
    if (word === undefined) {
        const sel = vscode.window.activeTextEditor?.selections ?? [];
        text = sel.map(s => vscode.window.activeTextEditor?.document.getText(s) ?? "");
    } else if (typeof (word) === 'number') {
        text = [globals.newprov.getTreeItem(word)!.label as string];
    } else {
        text = [word];
    }

    //unique input words
    let unique: Map<string,string> = new Map<string,string>();
    for (let t of text) {
        if (globals.goodWords.has(t)) {
            continue;
        }
        unique.set(t, globals.translated.get(t)!);
    }
    //remove from new words
    for (let w of text) {
        for (let k of globals.groupedNewWords.keys()) {
            if (globals.groupedNewWords.get(k)!.has(w)) {
                globals.groupedNewWords.get(k)!.delete(w);
            }
        }
    }
    globals.newprov.refresh();

    vscode.window.showInformationMessage("You added word: " + text.join(","));
    unique.forEach((val, key) => { globals.goodWords.set(key, val); });
    globals.goodprov.refresh();
}