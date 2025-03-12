import { basicSetup } from "codemirror";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { configureForm } from "./agent/configure";
import fs from "fs";
import { initOllama } from "./agent/ollama";
import Chat from "./agent/chat";

const agentContainer = document.createElement("div");
const codeEditorContainer = document.createElement("div");

const main = document.createElement("main");
main.append(agentContainer, codeEditorContainer);
document.body.append(main);

new EditorView({
    doc: "",
    parent: codeEditorContainer,
    extensions: [oneDark, basicSetup],
});

const endpointFile = "data/ollama-endpoint.txt";
let currentEndpoint: string = undefined;
if (await fs.exists(endpointFile)) {
    currentEndpoint = await fs.readFile(endpointFile, { encoding: "utf8" });
}

if (!currentEndpoint || !(await initOllama(currentEndpoint))) {
    const configure = configureForm((endpoint) => {
        fs.writeFile(endpointFile, endpoint);
        configure.replaceWith(Chat());
    }, currentEndpoint);
    agentContainer.append(configure);
} else {
    agentContainer.append(Chat())
}

if (!(await fs.exists("data"))) {
    fs.mkdir("data");
}
