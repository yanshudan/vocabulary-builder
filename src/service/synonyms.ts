import fetch from "node-fetch";
import { globals } from "../globals";
import render from "dom-serializer";

export async function Synonyms(word: string) {

    const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
    const base = 'https://www.powerthesaurus.org';
    const response = await fetch(base + '/' + word + '/' + "synonyms", {
        headers: { 'user-agent': agent }
    });
    const html = await response.text();
    const htmlparser2 = require("htmlparser2");
    const CSSselect = require("css-select");
    const dom = htmlparser2.parseDocument(html);
    const syns = CSSselect.selectAll("div#primary-area", dom);
    
    return syns.map((e:any) => e.children[1].children[1].children[0].data);

}