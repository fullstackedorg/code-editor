import { Button } from "@fullstacked/ui";
import Editor, { Chat } from "../editor";
import { Contents, WorkspaceItem, WorkspaceItemType } from "./views";
import { Code } from "./views/code";
import { Image } from "./views/image";
import { Binary } from "./views/binary";

export function createWorkspace(editorInstance: Editor) {
    const items: {
        workspaceItem: WorkspaceItem;
        tab: HTMLLIElement;
    }[] = [];
    let currentItem: (typeof items)[0] = null;

    WorkspaceItem.editorInstance = editorInstance;

    const container = document.createElement("div");
    container.classList.add("workspace");
    const tabs = document.createElement("ul");
    const viewContainer = document.createElement("div");

    container.append(tabs, viewContainer);

    const add = (workspaceItem: WorkspaceItem) => {
        let item = items.find(
            (i) => i.workspaceItem.name === workspaceItem.name,
        );

        if (!item) {
            item = {
                workspaceItem,
                tab: createTab(
                    workspaceItem,
                    () => {
                        if (currentItem?.workspaceItem === workspaceItem) {
                            (workspaceItem as Code)?.format?.();
                        }
                        setView(workspaceItem);
                    },
                    () => remove(workspaceItem),
                ),
            };
            tabs.append(item.tab);
            items.push(item);
        }

        setView(workspaceItem);
    };

    const setView = (workspaceItem: WorkspaceItem) => {
        const item = items.find(
            (i) => i.workspaceItem.name === workspaceItem.name,
        );
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
        const indexOf = items.findIndex(
            (i) => i.workspaceItem.name === workspaceItem?.name,
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

    function open(
        name: string,
        contents?: undefined | string | Uint8Array,
    ): void;
    function open(
        name: string,
        contents?: Promise<string | Uint8Array>,
    ): Promise<void>;
    function open(name: string, contents?: Contents) {
        const fileExtension = name.split(".").pop();
        let itemType: WorkspaceItemType = WorkspaceItemType.binary;

        if (codeExtensions.includes(fileExtension)) {
            itemType = WorkspaceItemType.code;
        } else if (imageExtensions.includes(fileExtension)) {
            itemType = WorkspaceItemType.image;
        } else if (fileExtension === "chat") {
            itemType = WorkspaceItemType.chat;
        }

        const sameFileOpened = items.find(
            (i) =>
                i.workspaceItem.type === itemType &&
                i.workspaceItem.name === name,
        );

        if (sameFileOpened) {
            setView(sameFileOpened.workspaceItem);
            if (contents !== undefined) {
                return sameFileOpened.workspaceItem.replace(contents);
            }
            return;
        }

        let view: WorkspaceItem;
        switch (itemType) {
            case WorkspaceItemType.code:
                view = new Code(name);
                break;
            case WorkspaceItemType.chat:
                view = new Chat(name);
                break;
            case WorkspaceItemType.image:
                view = new Image(name);
                break;
            case WorkspaceItemType.binary:
                view = new Binary(name);
                break;
        }

        add(view);
        return view.init(contents);
    }

    return {
        container,
        api: {
            lint() {
                items.forEach((i) => {
                    if (i.workspaceItem instanceof Code) {
                        i.workspaceItem.lint();
                    }
                });
            },
            clear() {
                items.forEach((i) => remove(i.workspaceItem));
            },
            item: {
                get current() {
                    return currentItem;
                },
                add,
                remove,
            },
            file: {
                open,
                isOpen(name: string) {
                    return !!items.find((i) => i.workspaceItem.name === name);
                },
                goTo(
                    name: string,
                    pos: number | { line: number; col: number },
                ) {
                    const item = items.find(
                        (i) => i.workspaceItem.name === name,
                    );
                    if (item?.workspaceItem.type !== WorkspaceItemType.code) {
                        return;
                    }

                    setView(item.workspaceItem);
                    (item.workspaceItem as Code).goTo(pos);
                },
                rename(oldName: string, newName: string) {
                    const item = items.find(
                        (i) => i.workspaceItem.name === oldName,
                    );

                    item?.workspaceItem.rename(newName);
                },
                update(name: string, content: Contents) {
                    const item = items.find(
                        (i) => i.workspaceItem.name === name,
                    );

                    item?.workspaceItem.replace(content);
                },
                close(name: string) {
                    const item = items.find(
                        (i) => i.workspaceItem.name === name,
                    );
                    remove(item?.workspaceItem);
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
    tab.append(item.icon(), item.title(), close);
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
    "txt",
];

const imageExtensions = ["jpg", "jpeg", "png", "webp", "bmp", "gif"];
