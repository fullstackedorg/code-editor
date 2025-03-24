import Editor from "../../editor";

export enum WorkspaceItemType {
    code = "code",
    image = "image",
    chat = "chat",
}

export abstract class WorkspaceItem {
    static editorInstance: Editor;
    abstract type: WorkspaceItemType;

    abstract icon(): HTMLElement;
    abstract name(): string | HTMLElement;
    abstract render(): HTMLElement;
    abstract stash(): void;
    abstract restore(): void;
    abstract destroy(): void;
    abstract equals(item: WorkspaceItem): boolean;

    private element: HTMLElement;
    get view() {
        if (!this.element) {
            this.element = this.render();
        }

        return this.element;
    }
}
