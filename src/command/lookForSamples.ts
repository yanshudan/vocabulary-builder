import { WebviewPanel, window } from "vscode";
import render from "dom-serializer";
import { samples } from "../service/samples";

let view: WebviewPanel;
export async function sampleSentences(word?: string) {
    //TODO: P2 call NLP services to get sample sentences
    if (word === undefined) {
        const sel = window.activeTextEditor?.selection;
        word = window.activeTextEditor?.document.getText(sel) ?? "";
        if (word === "") {
            window.showInformationMessage("You didn't select any word");
            return;
        }
    }

    const sentences = await samples(word);
    const htmlwihtouthead = "<!doctype html> <html><body>" + render(sentences).replaceAll("span", "h3") + "</body></html>";
    try {
        view.active;
    } catch {
        view = window.createWebviewPanel("type", "Sample Sentences", { viewColumn: 1 });
    };
    view.webview.html = htmlwihtouthead;
    view.reveal();
}