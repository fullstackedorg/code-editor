import { Contents, WorkspaceItem, WorkspaceItemType } from ".";
import { strToUint8 } from "../contents";
import { createDevIcon } from "./code";

export class Image extends WorkspaceItem {
    type: WorkspaceItemType.image;

    image: HTMLImageElement = document.createElement("img");

    loadContents(contents: string | Uint8Array) {
        const data = strToUint8(contents);
        const fileExtension = this.name.split(".").pop();
        this.image.src = URL.createObjectURL(
            new Blob([data], { type: `image/${fileExtension}` }),
        );
    }

    icon() {
        return createDevIcon(this.name);
    }
    title() {
        return this.name;
    }
    stash() {}
    restore() {}

    render() {
        const container = document.createElement("div");
        container.classList.add("workspace-image-view");
        container.append(this.image);
        return container;
    }
    destroy() {
        if (!this.image.src) return;
        URL.revokeObjectURL(this.image.src);
    }

    replaceContents(contents: Contents) {
        this.destroy();
        this.init(contents);
    }
}
