import { Button } from "@fullstacked/ui";
import Editor from "../editor";
import { WorkspaceItem, WorkspaceItemType } from "./views";
import { Code } from "./views/code";
import { Image } from "./views/image";

export function createWorkspace(editorInstance: Editor) {
    const items: {
        workspaceItem: WorkspaceItem;
        tab: HTMLLIElement;
    }[] = [];
    let currentItem: (typeof items)[0] = null;
    const te = new TextEncoder();
    const td = new TextDecoder();

    WorkspaceItem.editorInstance = editorInstance;

    const container = document.createElement("div");
    container.classList.add("workspace");
    const tabs = document.createElement("ul");
    const viewContainer = document.createElement("div");

    container.append(tabs, viewContainer);

    const add = (workspaceItem: WorkspaceItem) => {
        let item = items.find((i) => i.workspaceItem.equals(workspaceItem));

        if (!item) {
            item = {
                workspaceItem,
                tab: createTab(
                    workspaceItem,
                    () => setView(workspaceItem),
                    () => remove(workspaceItem),
                ),
            };
            tabs.append(item.tab);
            items.push(item);
        }

        setView(workspaceItem);
    };

    const setView = (workspaceItem: WorkspaceItem) => {
        const item = items.find((i) => i.workspaceItem.equals(workspaceItem));
        if (!item) return;
        currentItem?.workspaceItem.stash();
        currentItem?.tab.classList.remove("active");
        currentItem?.workspaceItem.view.remove();
        item.tab.classList.add("active");
        viewContainer.append(item.workspaceItem.view);
        currentItem = item;
        currentItem.tab.scrollIntoView();
        item.workspaceItem.restore();
    };

    const remove = (workspaceItem: WorkspaceItem) => {
        const indexOf = items.findIndex((i) =>
            i.workspaceItem.equals(workspaceItem),
        );
        if (indexOf === -1) return;
        const item = items.at(indexOf);
        item.tab.remove();
        item.workspaceItem.view.remove();
        item.workspaceItem.destroy();
        items.splice(indexOf, 1);
        if (currentItem === item) {
            currentItem = null;
            setView(
                items.at(indexOf)?.workspaceItem || items.at(-1)?.workspaceItem,
            );
        }
    };

    return {
        container,
        api: {
            item: {
                get current() {
                    return currentItem;
                },
                add,
                remove,
            },
            file: {
                open(name: string, contents: Uint8Array | string) {
                    const fileExtension = name.split(".").pop();

                    if (
                        !fileExtension ||
                        codeExtensions.includes(fileExtension)
                    ) {
                        contents =
                            contents instanceof Uint8Array
                                ? td.decode(contents)
                                : contents;

                        add(new Code(name, contents));
                    } else if (imageExtensions.includes(fileExtension)) {
                        contents =
                            contents instanceof Uint8Array
                                ? contents
                                : te.encode(contents);

                        add(new Image(name, contents));
                    } else {
                    }
                },
                goTo(name: string, pos: number) {
                    
                },
                close(name: string) {
                    const item = items.find((i) => {
                        const type = i.workspaceItem.type;
                        if (
                            type !== WorkspaceItemType.code &&
                            type !== WorkspaceItemType.image
                        ) {
                            return false;
                        }
                        return (
                            (i.workspaceItem as Code | Image).filename === name
                        );
                    });
                    if (!item) return;
                    remove(item.workspaceItem);
                },
            },
        },
    };
}

function createTab(
    item: WorkspaceItem,
    onclick: () => void,
    onclose: () => void,
) {
    const tab = document.createElement("li");
    const close = Button({
        iconRight: "Close",
        style: "icon-small",
    });
    close.onclick = (e) => {
        e.stopPropagation();
        onclose();
    };
    tab.append(item.icon(), item.name(), close);
    tab.onclick = onclick;
    return tab;
}

const codeExtensions = [
    "js",
    "mjs",
    "cjs",
    "jsx",
    "ts",
    "tsx",
    "html",
    "xml",
    "svg",
    "css",
    "scss",
    "sass",
    "json",
    "liquid",
    "md",
];

const imageExtensions = ["jpg", "jpeg", "png", "webp", "bmp", "gif"];
