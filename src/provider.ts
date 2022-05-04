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
            return [...globals.knownWords.keys()];
        }
        return [index];
    };
    getTreeItem(index: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let ret = new vscode.TreeItem(globals.knownWords[index]);
        ret.command = {
            command: 'vocabulary-builder.getSampleSentences',
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
type NewEntry= string;
export class NewWordsProvider implements vscode.TreeDataProvider<NewEntry> {
    private _onDidChangeTreeData: vscode.EventEmitter<NewEntry | null> = new vscode.EventEmitter<NewEntry | null>();
    readonly onDidChangeTreeData: vscode.Event<NewEntry | null> = this._onDidChangeTreeData.event;

    refresh(offset?: NewEntry): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire(null);
        }
    }
    getChildren(index: NewEntry): vscode.ProviderResult<NewEntry[]> {
        if (index === undefined) {
            return [...globals.newWords.keys()];
        }
        return [index];
    };
    getTreeItem(index: NewEntry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        const count = globals.newWords.get(index) ?? 0;
        const keys = [...globals.newWords.keys()];
        let i: number = keys.indexOf(index);
        let ret = new vscode.TreeItem(index + "   " + globals.chinese[i]);
        ret.command = {
            command: 'vocabulary-builder.getSampleSentences',
            title: 'test title',
            arguments: [index]
        };
        return ret;
    };
};