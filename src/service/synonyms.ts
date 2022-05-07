import fetch from "node-fetch";
import { globals } from "../globals";

export async function Synonyms(word: string) {

    const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
    const base = 'https://www.powerthesaurus.org';
    const response = await fetch(base + '/' + word + '/' + "synonyms", {
        headers: { 'user-agent': agent }
    });
    const html = await response.text();
    var domParser = require('dom-parser');
    const htmlstr = new domParser().parseFromString(html);
    //TODO: P9 must be updated manually cuz the site keeps changing this selector
    const ret = htmlstr.getElementsByClassName(globals.config.get<string>("synSelctor", "tz_su ")) as { textContent: string }[];
    return ret.map(e => e.textContent);

}