import { Button } from "@fullstacked/ui";
import { createFileTree } from "@fullstacked/file-tree";
import { Icon } from "@fullstacked/ui";
import fs from "fs";
import { createConversation, createOllama } from "ai";
import { createCodeMirrorView } from "@fullstacked/codemirror-view";
import { SupportedLanguage } from "@fullstacked/codemirror-view/languages";

const directoryIconOpen = Icon("Caret");
directoryIconOpen.classList.add("open");
const directoryIconClose = Icon("Caret");

const provider = createOllama();
const model = (await provider.models()).at(0);

export function createFilesControls(opts: {
    setActiveElement(el: HTMLElement): void;
}) {
    const element = document.createElement("div");
    element.classList.add("files-controls");

    const newChatButton = Button({
        iconLeft: "Glitter",
        style: "icon-small",
    });
    const newFileButton = Button({
        iconLeft: "File Add",
        style: "icon-small",
    });
    const newDirectoryButton = Button({
        iconLeft: "Directory Add",
        style: "icon-small",
    });
    const uploadFileButton = Button({
        iconLeft: "Upload",
        style: "icon-small",
    });

    const newItemButtons = document.createElement("div");
    newItemButtons.append(
        newChatButton,
        newFileButton,
        newDirectoryButton,
        uploadFileButton,
    );

    newChatButton.onclick = () => {
        opts.setActiveElement(
            createConversation({
                provider,
                model,
            }).element,
        );
    };

    const fileTree = createFileTree({
        directoryIcons: {
            open: directoryIconOpen,
            close: directoryIconClose,
        },
        onSelect: async (path) => {
            if ((await fs.exists(path)).isFile) {
                opts.setActiveElement(
                    createCodeMirrorView({
                        contents: await fs.readFile(path, { encoding: "utf8" }),
                        language: path.split(".").pop() as SupportedLanguage,
                    }).element,
                );
            }
        },
        readDirectory: (path) => fs.readdir(path, { withFileTypes: true }),
        isDirectory: async (path) => !(await fs.exists(path)).isFile,
    });

    element.append(newItemButtons, fileTree.container);

    return {
        element,
    };
}
