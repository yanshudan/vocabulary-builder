import * as vscode from "vscode";
import { globals } from "./globals";

export class GoodWordsProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | null> = new vscode.EventEmitter<string | null>();
    readonly onDidChangeTreeData: vscode.Event<string | null> = this._onDidChangeTreeData.event;

    refresh(offset?: string): void {
        if (offset) {
            this._onDidChangeTreeData.fire(offset);
        } else {
            this._onDidChangeTreeData.fire(null);
        }
    }
    getChildren(index: string): vscode.ProviderResult<string[]> {
        if (index === undefined) {
            return [...globals.goodWords.keys()];
        }
        return [index];
    };
    getTreeItem(index: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        let ret = new vscode.TreeItem(index);
        ret.command = {
            command: 'vocabulary-builder.innerWrapper',
            title: 'test title',
            arguments: [index]
        };
        ret.tooltip = globals.goodWords.get(index);
        return ret;
    };
};