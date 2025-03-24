import fs from "fs";
import Editor from "./editor";
import eruda from "eruda";
import { AgentConfiguration } from "./agent/providers/agentProvider";
import { Button } from "@fullstacked/ui";
import { Chat } from "./workspace/views/chat";
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

const codeEditor = new Editor({ agentConfigurations });

window.addEventListener("keydown", (e) => {
    if (e.key !== "s" || !(e.metaKey || e.ctrlKey)) return;

    e.preventDefault();
    e.stopPropagation();
    (codeEditor.getWorkspace()?.currentItem?.workspaceItem as any)?.format?.();
});

codeEditor.addEventListener("agent-configuration-update", (e) => {
    console.log(e.agentConfigurations);
    fs.writeFile(agentConfigsFile, JSON.stringify(e.agentConfigurations));
});

const main = document.createElement("main");
const left = document.createElement("div");
const right = document.createElement("div");

const newChatButton = Button({
    text: "New Chat",
    iconLeft: "Plus",
});

newChatButton.onclick = () => {
    codeEditor.getWorkspace().add(new Chat());
};

left.append(codeEditor.agentConfigurator, newChatButton);
right.append(codeEditor.workspaceElement);

main.append(left, right);
document.body.append(main);
