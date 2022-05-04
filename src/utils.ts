import path = require('path');
import { TextDecoder, TextEncoder } from 'util';
import * as vscode from 'vscode';
import { globals } from './globals';
import fetch from 'node-fetch';


export async function loadTextFile(fpath: string): Promise<string[]> {
    const fileUri = vscode.Uri.file(path.resolve(fpath));
    return await vscode.workspace.fs.readFile(fileUri).then(c => {
        const res = new TextDecoder("utf-8").decode(c).split("\n");
        return res;
    });
}
export async function writeTextFile(fpath: string, content: string[]): Promise<void> {
    const fileUri = vscode.Uri.file(path.resolve(fpath));
    const out = new TextEncoder().encode(content.join("\n"));
    await vscode.workspace.fs.writeFile(fileUri, out);
}

export function getRenderStr(freq: Map<string, number>, chinese: string[]): string[] {
    //TODO: better formatting
    let ret: string[] = [];
    let count = 0, curr = 2, total = 90;
    let nc = total / (curr + 3 + 5);
    let i = 0;
    let tmp: string = "";
    try {
        for (let item of freq) {
            const chi = chinese[i];
            if (item[0].length > curr) {
                ret = ret.concat([tmp]);
                tmp = "";
                ret = ret.concat(["-------" + i.toString()]);
                count = 0;
                curr += 1;
                nc = total / (curr + 3 + 5);
            }
            tmp += item[0] + "," + " ".repeat(curr + 3 - item[0].length - item[1].toString().length) + item[1] + "," + chi + "　".repeat(Math.max(5 - chi.length, 0)) + ",";
            count++;
            if (count >= nc) {
                ret = ret.concat([tmp]);
                tmp = "";
                count = 0;
            }
            ++i;
        }
    } catch (e) {
        vscode.window.showInformationMessage(JSON.stringify(e));
    }
    ret = ret.concat(["-------" + i.toString()]);
    return ret;
};

export async function wordCount(rawtext: string): Promise<Map<string, number>> {
    let words = rawtext.toLowerCase();
    //TODO: use regex
    for (let c of globals.nullchars) {
        words = words.replaceAll(c, " ");
    }
    const wordlist = words.split(" ");
    let freq = new Map<string, number>();
    for (let word of wordlist) {
        if (word.length < 3 || word.includes("'") || globals.basicWords.includes(word) || globals.knownWords.includes(word)) {
            continue;
        }
        let val = freq.get(word) ?? 0;
        freq.set(word, val + 1);
    }
    return freq;
};

export async function translateWords(words: string[]): Promise<string[]> {
    const req = words.map(e => {
        return { "text": e };
    });
    console.log(req);
    class responseType {
        translations: { text: string; }[] = [];
    };
    class responseListType {
        data: responseType[] = [];
    }
    const axios = require('axios').default;
    const { v4: uuidv4 } = require('uuid');
    return await axios({
        baseURL: globals.translatorConfig.get("endpoint"),
        url: '/translate',
        method: 'post',
        headers: {
            'Ocp-Apim-Subscription-Key': globals.translatorConfig.get("key"),
            'Ocp-Apim-Subscription-Region': globals.translatorConfig.get("location"),
            'Content-type': 'application/json',
            'X-ClientTraceId': uuidv4().toString()
        },
        params: {
            'api-version': '3.0',
            'from': 'en',
            'to': ['zh-Hans']
        },
        data: req,
        responseType: 'json'
    }).then(function (response: responseListType) {
        return response.data.map((e: responseType) => e.translations[0].text.replaceAll(" ", ""));
    });
};

export async function grabHtml(): Promise<string> {
    const url: string = await vscode.window.showInputBox({ title: "URL of the material", ignoreFocusOut: true }).then(async url => {
        if (url === undefined) {
            return "";
        }
        return url;
    });
    let response;
    try {

        response = await fetch(url, {
            method: 'GET',
            headers: {
                accept: '*/*',
            }
        });
    } catch (e) {
        vscode.window.showInformationMessage(JSON.stringify(e));
        return "";
    }

    for (let k of [...globals.selectors.entries()]) {
        if (url.includes(k[0])) {
            globals.selector = k[1] ?? [];
            break;
        }
    }
    const result = await response.text();
    return result;
};