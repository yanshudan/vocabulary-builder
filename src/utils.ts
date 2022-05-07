import path = require('path');
import { TextDecoder, TextEncoder } from 'util';
import { globals } from './globals';
import fetch from 'node-fetch';
import render from 'dom-serializer';
import { Uri, window, workspace } from 'vscode';


export async function loadTextFile(fpath: string): Promise<string> {
    const fileUri = Uri.file(path.resolve(fpath));
    try {
        await workspace.fs.readFile(fileUri);
    } catch {
        await workspace.fs.writeFile(fileUri, new TextEncoder().encode(""));
    }
    return await workspace.fs.readFile(fileUri).then(c => {
        const res = new TextDecoder("utf-8").decode(c);
        return res;
    });
}
export async function writeTextFile(fpath: string, content: string[]): Promise<void> {
    const fileUri = Uri.file(path.resolve(fpath));
    const out = new TextEncoder().encode(content.join("\n"));
    await workspace.fs.writeFile(fileUri, out);
}
export async function dumpFiles() {

    writeTextFile(globals.fpath, globals.knownWords);
    writeTextFile(globals.rootpath + "/goodWords.txt", [...globals.goodWords.keys()]);
    const rawstrs = await getRenderStr(globals.groupedNewWords, globals.translated);
    writeTextFile(globals.outpath, rawstrs.map(e => e.replaceAll(",", " ")));
    window.showInformationMessage(`Files dumped at ${globals.rootpath}`);
}
export async function getRenderStr(freqs: Map<string, Map<string, number>>, translated: Map<string, string>): Promise<string[]> {
    let converted: [string, number][] = [];
    for (let m of freqs.values()) {
        converted = converted.concat([...m.entries()]);
    }
    converted.sort((a, b) => b[1] - a[1]);
    converted.sort((a, b) => a[0].length - b[0].length);
    let ret: string[] = [];
    let count = 0, curr = 2, total = 90;
    let nc = total / (curr + 3 + 5);
    let i = 0;
    let tmp: string = "";
    try {
        for (let item of converted) {
            const trans = translated.get(item[0]) ?? "无";
            if (item[0].length > curr) {
                ret = ret.concat([tmp]);
                tmp = "";
                ret = ret.concat(["-------" + i.toString()]);
                count = 0;
                curr += 1;
                nc = total / (curr + 3 + 5);
            }
            tmp += item[0] + "," + " ".repeat(curr + 3 - item[0].length - item[1].toString().length) + item[1] + "," + trans + "　".repeat(Math.max(5 - trans.length, 0)) + ",";
            count++;
            if (count >= nc) {
                ret = ret.concat([tmp]);
                tmp = "";
                count = 0;
            }
            ++i;
        }
    } catch (e) {
        console.log(e);
    }
    ret = ret.concat(["-------" + i.toString()]);
    return ret;
};

export async function getHtmlText(url: string): Promise<string> {
    //grab raw html
    let html = await grabHtml(url);
    if (html.length === 0) { return ""; }

    //extract text
    const htmlparser2 = require("htmlparser2");
    const CSSselect = require("css-select");
    const dom = htmlparser2.parseDocument(html);
    if (globals.selector.length !== 0) {
        html = "";
        for (let sel of globals.selector) {
            let doms = CSSselect.selectAll(sel, dom);
            html += render(doms);
        }
        html = "<body>" + html + "</body>";
    }

    var domParser = require('dom-parser');
    let htmlstr = new domParser().parseFromString(html);
    //dangerous, must config selectors for websites
    return (htmlstr.getElementsByTagName("body")[0] ?? { textContent: "" }).textContent;
}


export async function grabHtml(url: string): Promise<string> {
    globals.selector = [];
    for (let k of [...globals.selectors.entries()]) {
        if (url.includes(k[0])) {
            globals.selector = k[1] ?? [];
            break;
        }
    }

    const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.163 Safari/537.36';
    let response;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'user-agent': agent,
                accept: '*/*'
            }
        });
    } catch (e) {
        window.showInformationMessage(JSON.stringify(e));
        return "";
    }
    return await response.text();
};

export async function groupByLevel(words: Map<string, number>): Promise<Map<string, Map<string, number>>> {
    let lib;
    let ret: Map<string, Map<string, number>> = new Map<string, Map<string, number>>();
    ret.set("Others", new Map<string, number>());
    for (let word of words) {
        let hit = false;
        for (let level of globals.wordlib.keys()) {
            lib = globals.wordlib.get(level);
            if (lib!.includes(word[0])) {
                if (!ret.has(level)) {
                    ret.set(level, new Map<string, number>());
                }
                ret.get(level)!.set(word[0], word[1]);
                hit = true;
                break;
            }
        }
        if (!hit) {
            ret.get("Others")!.set(word[0], word[1]);
        }
    }
    return ret;
}