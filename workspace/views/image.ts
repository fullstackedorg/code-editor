import { WorkspaceItem, WorkspaceItemType } from ".";
import { Code, createDevIcon, loadSetiFont } from "./code";

export class Image extends WorkspaceItem {
    type: WorkspaceItemType.image;

    url: string;
    constructor(filename: string, contents: Uint8Array) {
        super(filename);
        this.url = URL.createObjectURL(new Blob([contents]));
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

    image: HTMLImageElement = document.createElement("img");
    render() {
        const container = document.createElement("div");
        container.classList.add("workspace-image-view");
        this.image.src = this.url;
        container.append(this.image);
        return container;
    }
    destroy() {
        URL.revokeObjectURL(this.url);
    }

    replace(contents: Uint8Array) {
        this.destroy();
        this.url = URL.createObjectURL(new Blob([contents]));
        this.image.src = this.url;
    }
}
