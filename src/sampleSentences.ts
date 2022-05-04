import fetch from "node-fetch";
import { window } from "vscode";
import { globals } from "./globals";
import { writeTextFile } from "./utils";


const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
const base = 'https://sentence.yourdictionary.com';
export async function sampleSentences(word?: string) {
    if (word === undefined) {
        const sel = window.activeTextEditor?.selection;
        word = window.activeTextEditor?.document.getText(sel) ?? "";
        if (word === "") {
            window.showInformationMessage("You didn't select any word");
            return;
        }
    }
    const response = await fetch(base + '/' + word, {
        headers: { 'user-agent': agent }
    });
    const html = await response.text();
    let view = window.createWebviewPanel("type", "Sample Sentences", { viewColumn: 1 });
    let begin = html.indexOf(`<ul class="sentences-list"`);
    let end = html.indexOf("</ul", begin) + 4;
    const htmlwihtouthead = "<!doctype html> <html><body>" + html.slice(begin, end) + "</body></html>";
    view.webview.html = htmlwihtouthead;
    view.reveal();
    // // await writeTextFile(globals.outpath, [htmlwihtouthead]);
    // var domParser = require('dom-parser');
    // const htmlstr = new domParser().parseFromString(htmlwihtouthead);
    // let words = htmlstr.getElementsByClassName("sentence-item") as {textContent:string}[]; 
    // globals.samples = words.map(e => e.textContent);
    // globals.samprov.refresh();
}