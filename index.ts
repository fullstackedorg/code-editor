import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { configureForm } from "./agent/configure";
import fs from "fs";
import { addStatsListener, initOllama } from "./agent/ollama";
import Chat from "./agent/chat";
import eruda from "eruda";
import { loadLanguageExtension } from "./cm-lang";
eruda.init();

const agentContainer = document.createElement("div");
agentContainer.classList.add("agent-container");
const codeEditorContainer = document.createElement("div");

const main = document.createElement("main");
main.append(agentContainer, codeEditorContainer);
document.body.append(main);

let editor: EditorView = null;

const update = (text: string, lang: string) => {
    if (editor) {
        editor.destroy();
    }
    editor = new EditorView({
        doc: text,
        parent: codeEditorContainer,
        extensions: [oneDark, basicSetup],
    });
    loadLanguageExtension(editor, lang)
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
