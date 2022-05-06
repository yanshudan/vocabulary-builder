import { window } from "vscode";
import { globals } from "./globals";

class responseType {
    translations: { text: string; }[] = [];
};
class responseListType {
    data: responseType[] = [];
}
export async function lookUpDictionary(words?: string[], kind?: string): Promise<Map<string, string>> {
    let ret = new Map<string, string>();
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
            return ret;
        }
    }
    const req = words.map(e => {
        return { "text": e };
    });
    const axios = require('axios').default;
    const { v4: uuidv4 } = require('uuid');
    const translated= await axios({
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
    for (let i = 0; i < words.length; ++i){
        ret.set(words[i], translated[i]);
    }
    return ret;
};