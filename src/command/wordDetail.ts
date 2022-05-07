import * as vscode from "vscode";
import { lookForSyn } from "./lookForSyn";
import { lookUpDictionary } from "./lookForTranslation";
import { sampleSentences } from "./lookForSamples";
export async function wordDetail(word:string) {
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching data...",
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.log("Request Canceled by user");
        });
        if (word === "") {
            return;
        }
        progress.report({ increment: 0 });
        let p1 = sampleSentences(word);
        let p2 = lookForSyn(word);
        lookUpDictionary([word]);

        setTimeout(() => {
            progress.report({ increment: 10, message: "Sending Requests" });
        }, 1000);
        await p2;
        setTimeout(() => {
            progress.report({ increment: 40, message: "Fetched Synonyms!" });
        }, 1000);
        await p1;
        setTimeout(() => {
            progress.report({ increment: 50, message: "Fetched Sample Sentences!" });
        }, 1000);
        const p = new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, 2000);
        });
        return p;
    });
}