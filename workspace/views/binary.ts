import { WorkspaceItem, WorkspaceItemType } from ".";
import { strToUint8, uint8ToStr } from "../contents";
import { Code, createDevIcon } from "./code";
import prettyBytes from "pretty-bytes";

export class Binary extends WorkspaceItem {
    type = WorkspaceItemType.binary;

    byteLength: number;
    container = document.createElement("div");

    convertToCode(contents: string | Uint8Array) {
        const workspace = WorkspaceItem.editorInstance.getWorkspace();
        workspace.item.remove(this);
        const codeView = new Code(this.name);
        workspace.item.add(codeView);
        return codeView.init(contents);
    }

    loadContents(contents: string | Uint8Array) {
        if (
            typeof contents === "string" &&
            contents.length < 1000000 // ~2 mb (string is utf-16)
        ) {
            return this.convertToCode(contents);
        }
        // test couple first chars if alpha numeric or coding symbols {[(~/ etc.
        else if (
            contents instanceof Uint8Array &&
            contents.byteLength < 2000000 // 2mb
        ) {
            const str = uint8ToStr(contents.slice(0, 40));
            const alphaSymbols = str
                .slice(0, 10)
                .split("")
                .filter(
                    (char) =>
                        char.charCodeAt(0) === 10 || // \n
                        (char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126), // symbols and letters
                );
            if (alphaSymbols.length > 5 || alphaSymbols.length === str.length) {
                return this.convertToCode(contents);
            }
        }

        this.container.innerText = prettyBytes(strToUint8(contents).byteLength);
    }

    replaceContents(contents: Uint8Array | string) {
        this.container.innerText = prettyBytes(strToUint8(contents).byteLength);
    }

    icon() {
        return createDevIcon(this.name);
    }
    stash() {}
    restore() {}
    render() {
        this.container.classList.add("workspace-binary-view");
        return this.container;
    }
    destroy() {}
}
