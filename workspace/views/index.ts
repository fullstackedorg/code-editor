import fs from "fs";
import Editor from "../../editor";

export enum WorkspaceItemType {
    code = "code",
    image = "image",
    chat = "chat",
    binary = "binary",
}

export type Contents = string | Uint8Array | Promise<string | Uint8Array>;

export abstract class WorkspaceItem {
    static editorInstance: Editor;
    abstract type: WorkspaceItemType;

    static loadedSetiFont = false;
    static async loadSetiFont() {
        if (this.loadedSetiFont) return;
        this.loadedSetiFont = true;

        const fontLocation = this.editorInstance.opts?.setiFontLocation;

        if (fontLocation === null) return;

        const setiFont = new FontFace(
            "Dev Icons",
            await fs.readFile(fontLocation || "/workspace/dev-icons/seti.woff"),
        );
        await setiFont.load();
        document.fonts.add(setiFont);
    }

    name: string;
    constructor(name: string) {
        this.name = name;
    }

    abstract icon(): HTMLElement;
    abstract title(): string | HTMLElement;
    abstract render(): HTMLElement;
    abstract stash(): void;
    abstract restore(): void;
    abstract destroy(): void;

    abstract loadContents(contents: string | Uint8Array): void;
    init(contents: Contents) {
        if (contents instanceof Promise) {
            return new Promise<void>(async (resolve) => {
                this.loadContents?.(await contents);
                resolve();
            });
        }
        return this.loadContents?.(contents);
    }

    abstract replaceContents(contents: string | Uint8Array): void;
    replace(contents: Contents) {
        if (contents instanceof Promise) {
            return new Promise<void>(async (resolve) => {
                this.replaceContents(await contents);
                resolve();
            });
        }

        return this.replaceContents(contents);
    }

    private element: HTMLElement;
    get view() {
        if (!this.element) {
            this.element = this.render();
        }

        return this.element;
    }
}
