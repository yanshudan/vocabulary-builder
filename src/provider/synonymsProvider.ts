import * as vscode from "vscode";
import { globals } from "../globals";

export class SynonymsProvider implements vscode.TreeDataProvider<number> {
    private _onDidChangeTreeData: vscode.EventEmitter<number | null> = new vscode.EventEmitter<number | null>();
    readonly onDidChangeTreeData: vscode.Event<number | null> = this._onDidChangeTreeData.event;

    refresh(offset?: number): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire(null);
        }
    }
    getChildren(index: number): vscode.ProviderResult<number[]> {
        if (index === undefined) {
            return [...globals.synonyms.keys()];
        }
        return [index];
    };
    getTreeItem(index: number): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let ret = new vscode.TreeItem(globals.synonyms[index]);
        ret.command = {
            command: 'vocabulary-builder.getSampleSentences',
            title: 'test title',
            arguments: [globals.synonyms[index]]
        };
        return ret;
    };
};