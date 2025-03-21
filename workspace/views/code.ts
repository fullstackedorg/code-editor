import { WorkspaceItem, WorkspaceItemType } from ".";

export class Code extends WorkspaceItem {
    type: WorkspaceItemType.code;

    filename: string;
    constructor(filename: string) {
        super();
        this.filename = filename;
    }

    icon() {
        return "";
    }
    name() {
        return this.filename;
    }
    render() {
        return document.createElement("div");
    }
    destroy() {}
}
