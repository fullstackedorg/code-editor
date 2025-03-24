import { WorkspaceItem, WorkspaceItemType } from ".";

export class Image extends WorkspaceItem {
    type: WorkspaceItemType.image;

    filename: string;
    constructor(filename: string, contents: Uint8Array) {
        super();
        this.filename = filename;
    }

    equals(item: Image) {
        return this.filename === item?.filename;
    }

    icon() {
        return document.createElement("div");
    }
    name() {
        return this.filename;
    }
    stash() {}
    restore() {}
    render() {
        return document.createElement("div");
    }
    destroy() {}
}
