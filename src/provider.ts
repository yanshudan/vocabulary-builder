import * as vscode from "vscode";
import { globals } from "./globals";

type Entry = number;

export class KnownWordsProvider implements vscode.TreeDataProvider<Entry> {
    private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
    readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

    refresh(offset?: number): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire(null);
        }
    }
    getChildren(index: Entry): vscode.ProviderResult<Entry[]> {
        if (index === undefined) {
            return [-1,...globals.knownWords.keys()];
        }
        return [index];
    };
    getTreeItem(index: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if (index === -1) { index = 0; }
        let ret = new vscode.TreeItem(globals.knownWords[index]);
        ret.command = {
            command: 'vocabulary-builder.innerWrapper',
            title: 'test title',
            arguments: [globals.knownWords[index]]
        };
        return ret;
    };
};
export class SynonymsProvider implements vscode.TreeDataProvider<Entry> {
    private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
    readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

    refresh(offset?: number): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire(null);
        }
    }
    getChildren(index: Entry): vscode.ProviderResult<Entry[]> {
        if (index === undefined) {
            return [...globals.synonyms.keys()];
        }
        return [index];
    };
    getTreeItem(index: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let ret = new vscode.TreeItem(globals.synonyms[index]);
        ret.command = {
            command: 'vocabulary-builder.getSampleSentences',
            title: 'test title',
            arguments: [globals.synonyms[index]]
        };
        return ret;
    };
};
// export class SamplesProvider implements vscode.TreeDataProvider<Entry> {
//     private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
//     readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

//     refresh(offset?: number): void {
//         if (offset) {
//             this._onDidChangeTreeData.fire(offset);
//         } else {
//             this._onDidChangeTreeData.fire(null);
//         }
//     }
//     getChildren(index: Entry): vscode.ProviderResult<Entry[]> {
//         if (index === undefined) {
//             return [...globals.samples.keys()];
//         }
//         return [index];
//     };
//     getTreeItem(index: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
//         return new vscode.TreeItem(globals.samples[index]);
//     };
// };
