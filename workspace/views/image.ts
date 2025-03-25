import { WorkspaceItem, WorkspaceItemType } from ".";
import { Code, createDevIcon, loadSetiFont } from "./code";

export class Image extends WorkspaceItem {
    type: WorkspaceItemType.image;

    filename: string;
    url: string;
    constructor(filename: string, contents: Uint8Array) {
        super();
        this.filename = filename;
        this.url = URL.createObjectURL(new Blob([contents]));
    }

    equals(item: Image) {
        return this.filename === item?.filename;
    }

    icon() {
        if (!Code.loadedSetiFont) {
            Code.loadedSetiFont = true;
            loadSetiFont();
        }

        return createDevIcon(this.filename);
    }
    name() {
        return this.filename;
    }
    stash() {}
    restore() {}
    render() {
        const container = document.createElement("div");
        container.classList.add("workspace-image-view");
        const image = document.createElement("img");
        image.src = this.url;
        container.append(image);
        return container;
    }
    destroy() {
        URL.revokeObjectURL(this.url);
    }
}
