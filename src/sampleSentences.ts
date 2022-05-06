import fetch from "node-fetch";
import { WebviewPanel, window } from "vscode";
import render from "dom-serializer";

const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
const base = 'https://sentence.yourdictionary.com';
let view: WebviewPanel;
export async function sampleSentences(word?: string) {
    //TODO: P2 call NLP services to get sample sentences
    //TODO: P3 render prettier webview
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
    if (response.status === 403) {
        window.showInformationMessage("Check your VPN");
        return;
    }
    const html = await response.text();
    try {
        view.active;
    } catch {
        view = window.createWebviewPanel("type", "Sample Sentences", { viewColumn: 1 });
    };
    const htmlparser2 = require("htmlparser2");
    const CSSselect = require("css-select");
    const dom = htmlparser2.parseDocument(html);
    const sentences = CSSselect.selectAll("div.sentence-item", dom);
    const htmlwihtouthead = "<!doctype html> <html><body>" + render(sentences).replaceAll("span","h3") + "</body></html>";
    view.webview.html = htmlwihtouthead;
    view.reveal();
    // // await writeTextFile(globals.outpath, [htmlwihtouthead]);
    // var domParser = require('dom-parser');
    // const htmlstr = new domParser().parseFromString(htmlwihtouthead);
    // let words = htmlstr.getElementsByClassName("sentence-item") as {textContent:string}[]; 
    // globals.samples = words.map(e => e.textContent);
    // globals.samprov.refresh();
}