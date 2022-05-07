import { globals } from "../globals";

class responseType {
    translations: { text: string; }[] = [];
};
class responseListType {
    data: responseType[] = [];
}
export async function translate(words: string[]):Promise<string[]> {
    const req = words.map(e => {
        return { "text": e };
    });
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
}