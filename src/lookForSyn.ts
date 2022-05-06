import fetch from "node-fetch";
import { window } from "vscode";
import { globals } from "./globals";


const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
const base = 'https://www.powerthesaurus.org';
export async function lookForSyn(word?: string) {
    if (word === undefined) {
        const sel = window.activeTextEditor?.selection;
        word = window.activeTextEditor?.document.getText(sel) ?? "";
        if (word === "") {
            window.showInformationMessage("You didn't select any word");
            return;
        }
    }
    const response = await fetch(base + '/' + word + '/' + "synonyms", {
        headers: { 'user-agent': agent }
    });
    const html = await response.text();
    var domParser = require('dom-parser');
    const htmlstr = new domParser().parseFromString(html);
    //TODO: P9 must be updated manually cuz the site keeps changing this selector
    let words = htmlstr.getElementsByClassName(globals.config.get<string>("synSelctor", "tz_su ")) as { textContent: string }[];
    globals.synonyms = words.map(e => e.textContent);
    globals.synprov.refresh();
}