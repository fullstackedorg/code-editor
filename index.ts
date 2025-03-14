import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { configureForm } from "./agent/configure";
import fs from "fs";
import {
    addStatsListener,
    complete,
    initOllama,
    updateStats,
} from "./agent/ollama";
import Chat from "./agent/chat";
import eruda from "eruda";
import { loadLanguageExtension } from "./cm-lang";
import { inlineSuggestion } from "codemirror-extension-inline-suggestion";
eruda.init();

const agentContainer = document.createElement("div");
agentContainer.classList.add("agent-container");
const codeEditorContainer = document.createElement("div");

const main = document.createElement("main");
main.append(agentContainer, codeEditorContainer);
document.body.append(main);

let editor: EditorView = null;

async function getAutocomplete(state: EditorState) {
    const text = state.doc.toString();
    const cursor = state.selection.main.head;
    const prefix = text.slice(0, cursor);
    const suffix = text.slice(cursor);
    const response = await complete(prefix, suffix);
    // updateStats(response.eval_count, response.eval_duration)
    return response.choices.at(0).text;
}

const update = (text: string, lang: string) => {
    if (editor) {
        editor.destroy();
    }
    editor = new EditorView({
        doc: text,
        parent: codeEditorContainer,
        extensions: [
            oneDark,
            basicSetup,
            inlineSuggestion({ fetchFn: getAutocomplete, delay: 500 }),
        ],
    });
    loadLanguageExtension(editor, lang);
};

const endpointFile = "data/ollama-endpoint.txt";
let currentEndpoint: string = undefined;
if (await fs.exists(endpointFile)) {
    currentEndpoint = await fs.readFile(endpointFile, { encoding: "utf8" });
}

if (!currentEndpoint || !(await initOllama(currentEndpoint))) {
    const configure = configureForm((endpoint) => {
        fs.writeFile(endpointFile, endpoint);
        configure.replaceWith(Chat(update));
    }, currentEndpoint);
    agentContainer.append(configure);
} else {
    agentContainer.append(Chat(update));
}

const stats = document.createElement("div");
stats.classList.add("agent-stats");

addStatsListener(
    ({ tokensPerSec }) => (stats.innerText = tokensPerSec.toFixed(2) + " t/s"),
);

agentContainer.append(stats);

if (!(await fs.exists("data"))) {
    fs.mkdir("data");
}
