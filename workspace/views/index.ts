export enum WorkspaceItemType {
    code = "code",
    image = "image",
    chat = "chat",
}

export abstract class WorkspaceItem {
    abstract type: WorkspaceItemType;

    abstract icon(): string;
    abstract name(): string;
    abstract render(): HTMLElement;
    abstract destroy(): void;

    private element: HTMLElement;
    get view() {
        if (!this.element) {
            this.element = this.render();
        }

        return this.element;
    }
}
