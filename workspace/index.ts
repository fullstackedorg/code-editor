import { Button } from "@fullstacked/ui";
import Editor from "../editor";
import { WorkspaceItem, WorkspaceItemType } from "./views";
import { Code } from "./views/code";
import { Image } from "./views/image";
import { Binary } from "./views/binary";

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
        let item = items.find(
            (i) => i.workspaceItem.name === workspaceItem.name,
        );

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
            (i) => i.workspaceItem.name === workspaceItem.name,
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
                    let itemType: WorkspaceItemType = WorkspaceItemType.binary;

                    if (codeExtensions.includes(fileExtension)) {
                        itemType = WorkspaceItemType.code;
                    } else if (imageExtensions.includes(fileExtension)) {
                        itemType = WorkspaceItemType.image;
                    } else {
                        if (
                            typeof contents === "string" &&
                            contents.length < 1000000 // ~2 mb (string is utf-16)
                        ) {
                            itemType = WorkspaceItemType.code;
                        }
                        // test couple first chars if alpha numeric or coding symbols {[(~/ etc.
                        else if (
                            contents instanceof Uint8Array &&
                            contents.byteLength < 2000000 // 2mb
                        ) {
                            const str = td.decode(contents.slice(0, 40));
                            const alphaSymbols = str
                                .slice(0, 10)
                                .split("")
                                .filter(
                                    (char) =>
                                        char.charCodeAt(0) === 10 || // \n
                                        (char.charCodeAt(0) >= 32 &&
                                            char.charCodeAt(0) <= 126), // symbols and letters
                                );
                            if (
                                alphaSymbols.length > 5 ||
                                alphaSymbols.length === str.length
                            ) {
                                itemType = WorkspaceItemType.code;
                            }
                        }
                    }

                    const sameFileOpened = items.find(
                        (i) =>
                            i.workspaceItem.type === itemType &&
                            i.workspaceItem.name === name,
                    );

                    switch (itemType) {
                        case WorkspaceItemType.code:
                            contents =
                                contents instanceof Uint8Array
                                    ? td.decode(contents)
                                    : contents;
                            if (sameFileOpened) {
                                (
                                    sameFileOpened.workspaceItem as Code
                                ).cmView.replaceContents(contents);
                                setView(sameFileOpened.workspaceItem);
                            } else {
                                add(new Code(name, contents));
                            }
                            break;
                        case WorkspaceItemType.image:
                            contents =
                                contents instanceof Uint8Array
                                    ? contents
                                    : te.encode(contents);
                            if (sameFileOpened) {
                                (sameFileOpened.workspaceItem as Image).replace(
                                    contents,
                                );
                                setView(sameFileOpened.workspaceItem);
                            } else {
                                add(new Image(name, contents));
                            }
                            break;
                        case WorkspaceItemType.binary:
                            if (sameFileOpened) {
                                setView(sameFileOpened.workspaceItem);
                            } else {
                                contents =
                                    contents instanceof Uint8Array
                                        ? contents
                                        : te.encode(contents);
                                add(new Binary(name, contents.byteLength));
                            }
                            break;
                    }
                },
                goTo(name: string, pos: number) {
                    const item = items.find(
                        (i) => i.workspaceItem.name === name,
                    );
                    if (item?.workspaceItem.type !== WorkspaceItemType.code) {
                        return;
                    }

                    setView(item.workspaceItem);
                    (item.workspaceItem as Code).cmView.editorView.dispatch({
                        selection: { anchor: pos, head: pos },
                    });
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
