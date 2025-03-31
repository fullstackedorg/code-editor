import fs from "fs";
import Editor, { Chat, AgentConfigWithUses } from "./editor";
import eruda from "eruda";
import { Button } from "@fullstacked/ui";
import { core_fetch2 } from "fetch";
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

const codeEditor = new Editor({ agentConfigurations });

window.addEventListener("keydown", (e) => {
    if (e.key !== "s" || !(e.metaKey || e.ctrlKey)) return;

    e.preventDefault();
    e.stopPropagation();
    (
        codeEditor.getWorkspace()?.item?.current?.workspaceItem as any
    )?.format?.();
});

codeEditor.addEventListener("agent-configuration-update", (e) => {
    console.log(e.agentConfigurations);
    fs.writeFile(agentConfigsFile, JSON.stringify(e.agentConfigurations));
});

codeEditor.addEventListener("file-update", console.log);

const main = document.createElement("main");
const left = document.createElement("div");
const right = document.createElement("div");

const newChatButton = Button({
    text: "New Chat",
    iconLeft: "Plus",
});

newChatButton.onclick = () => {
    codeEditor.getWorkspace().item.add(new Chat());
};

const imageButton = Button({
    text: "Image",
    iconLeft: "Plus",
});

const getImage = async () => {
    const imageRequest = await core_fetch2("https://fakeimg.pl/600x400");
    return new Uint8Array(await imageRequest.arrayBuffer());
};

imageButton.onclick = async () => {
    codeEditor.getWorkspace().file.open("image.jpg", getImage());
};

left.append(codeEditor.agentConfigurator, newChatButton, imageButton);
right.append(codeEditor.workspaceElement);

main.append(left, right);
document.body.append(main);
