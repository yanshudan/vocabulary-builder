import path = require('path');
import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { globals } from './globals';
import { writeTextFile } from './utils';


export function addToKnown(){
    const sel = vscode.window.activeTextEditor?.selections ?? [];
    const text = sel.map(s => vscode.window.activeTextEditor?.document.getText(s) ?? "");
    let unique: string[] = [];
    for (let t of text) {
        if (!globals.knownWords.includes(t)) {
            unique = unique.concat([t]);
        }
    }
    vscode.window.showInformationMessage("you learned word: " + text.join(","));
    globals.knownWords=globals.knownWords.concat(unique);
    writeTextFile(globals.fpath, globals.knownWords);
}