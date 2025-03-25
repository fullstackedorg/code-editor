import { WorkspaceItem, WorkspaceItemType } from ".";
import { Code, createDevIcon, loadSetiFont } from "./code";
import prettyBytes from "pretty-bytes";

export class Binary extends WorkspaceItem {
    type: WorkspaceItemType.binary;

    byteLength: number;
    constructor(filename: string, byteLength: number) {
        super(filename);
        this.byteLength = byteLength;
    }

    icon() {
        if (!Code.loadedSetiFont) {
            Code.loadedSetiFont = true;
            loadSetiFont();
        }

        return createDevIcon(this.name);
    }
    title() {
        return this.name;
    }
    stash() {}
    restore() {}
    render() {
        const container = document.createElement("div");
        container.classList.add("workspace-binary-view");
        container.innerText = prettyBytes(this.byteLength);
        return container;
    }
    destroy() {}
}
