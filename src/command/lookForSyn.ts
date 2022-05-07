import fetch from "node-fetch";
import { window } from "vscode";
import { globals } from "../globals";
import { Synonyms } from "../service/synonyms";


export async function lookForSyn(word?: string) {
    if (word === undefined) {
        const sel = window.activeTextEditor?.selection;
        word = window.activeTextEditor?.document.getText(sel) ?? "";
        if (word === "") {
            window.showInformationMessage("You didn't select any word");
            return;
        }
    }
    globals.synonyms = await Synonyms(word);
    globals.synprov.refresh();
}