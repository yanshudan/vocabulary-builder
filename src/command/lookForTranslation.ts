import { window } from "vscode";
import { globals } from "../globals";
import { translate } from "../service/translate";

export async function lookUpDictionary(words?: string[], kind?: string): Promise<string[]> {
    let ret:string[] = [];
    if (words === undefined) {
        const sel = window.activeTextEditor?.selections ?? [];
        let tmp = new Set<string>();
        for (let s of sel) {
            let ss = window.activeTextEditor?.document.getText(s);
            if (ss !== undefined) { tmp.add(ss); }
        }
        words = [...tmp.keys()];
        if (words === []) {
            window.showInformationMessage("You didn't select any word");
            return [];
        }
    }
    const translated = await translate(words);
    for (let i = 0; i < words.length; ++i){
        globals.translated.set(words[i], translated[i]);
    }
    globals.newprov.refresh();
    return ret;
};