import Editor from "../../editor";

export enum WorkspaceItemType {
    code = "code",
    image = "image",
    chat = "chat",
    binary = "binary",
}

export abstract class WorkspaceItem {
    static editorInstance: Editor;
    abstract type: WorkspaceItemType;

    name: string
    constructor(name: string){
        this.name = name;
    }

    abstract icon(): HTMLElement;
    abstract title(): string | HTMLElement;
    abstract render(): HTMLElement;
    abstract stash(): void;
    abstract restore(): void;
    abstract destroy(): void;

    private element: HTMLElement;
    get view() {
        if (!this.element) {
            this.element = this.render();
        }

        return this.element;
    }
}
