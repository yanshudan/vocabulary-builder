import { globals } from "../globals";

export async function wordCount(rawtext: string): Promise<Map<string, number>> {
    let words = rawtext.toLowerCase();
    //TODO: P2 use libs to split words, support more languages
    for (let c of globals.nullchars) {
        words = words.replaceAll(c, " ");
    }
    const wordlist = words.split(" ");
    let freq = new Map<string, number>();
    for (let word of wordlist) {
        if (word.length < 3 || word.includes("'") || globals.knownWords.includes(word)) {
            continue;
        }
        let val = freq.get(word) ?? 0;
        freq.set(word, val + 1);
    }
    return freq;
};