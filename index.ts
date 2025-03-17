import fs from "fs";
import Editor from "./editor";
import { AgentConfiguration } from "./agent/providers";
import eruda from "eruda";
eruda.init();


if (!(await fs.exists("data"))) {
    await fs.mkdir("data");
}

const agentConfigsFile = "data/agents-config.json";
let agentConfigurations: AgentConfiguration[] = undefined;
if (await fs.exists(agentConfigsFile)) {
    agentConfigurations = JSON.parse(
        await fs.readFile(agentConfigsFile, { encoding: "utf8" }),
    );
}

const codeEditor = new Editor({
    agentConfigurations
});

codeEditor.addEventListener("updated-config", (e) => {
    fs.writeFile(agentConfigsFile, JSON.stringify(e.agentConfigurations))
});

const main = document.createElement("main");
const left = document.createElement("div");
const right = document.createElement("div");

left.append(codeEditor.agentElement, codeEditor.promptElement);
right.append(codeEditor.workspaceElement);

main.append(left, right);
document.body.append(main);
