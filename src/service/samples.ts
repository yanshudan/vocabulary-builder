import fetch from "node-fetch";
import { window } from "vscode";
const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
const base = 'https://sentence.yourdictionary.com';

export async function samples(word: string) {
    //TODO: P2 call NLP services to get sample sentences
    const response = await fetch(base + '/' + word, {
        headers: { 'user-agent': agent }
    });
    if (response.status === 403) {
        window.showInformationMessage("Check your VPN");
        return[];
    }
    const html = await response.text();

    const htmlparser2 = require("htmlparser2");
    const CSSselect = require("css-select");
    const dom = htmlparser2.parseDocument(html);
    return CSSselect.selectAll("div.sentence-item", dom);
}