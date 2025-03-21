import fs from "fs";
import Editor from "./editor";
import eruda from "eruda";
import { AgentConfigWithUses } from "./agent/providers/agentProvider";
eruda.init();

if (!(await fs.exists("data"))) {
    await fs.mkdir("data");
}

const agentConfigsFile = "data/agents-config.json";
let agentConfigurations: AgentConfigWithUses[] = undefined;
if (await fs.exists(agentConfigsFile)) {
    agentConfigurations = JSON.parse(
        await fs.readFile(agentConfigsFile, { encoding: "utf8" }),
    );
}

const codeEditor = new Editor({
    agentUses: ["chat", "completion"],
    agentConfigurations,
});

window.addEventListener("keydown", (e) => {
    if(e.key !== "s" || !(e.metaKey || e.ctrlKey)) return;
    
    e.preventDefault();
    e.stopPropagation();
    const files = codeEditor.getWorkspaceFiles()
    const currentFile = files.current();
    files.format(currentFile);
})

codeEditor.addEventListener("agent-configuration-update", (e) => {
    console.log(e.agentConfigurations);
    fs.writeFile(agentConfigsFile, JSON.stringify(e.agentConfigurations));
});

const main = document.createElement("main");
const left = document.createElement("div");
const right = document.createElement("div");

left.append(
    codeEditor.getAgentElement("configure"),
    codeEditor.getAgentElement("conversation"),
    codeEditor.getAgentElement("prompt"),
);
right.append(codeEditor.workspaceElement);

main.append(left, right);
document.body.append(main);
