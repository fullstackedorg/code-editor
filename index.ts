import fs from "fs";
import Editor from "./editor";
import eruda from "eruda";
import { AgentConfiguration } from "./agent/providers/agentProvider";
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
    agentUses: ["chat", "completion"],
    agentConfigurations,
});

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
