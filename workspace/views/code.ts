import fs from "fs";
import { WorkspaceItem, WorkspaceItemType } from ".";
import { languageHighlightExtension } from "../../codemirror/languages";
import { createCmView } from "../../codemirror/view";
import { formatContents } from "../prettier";
import { Button } from "@fullstacked/ui";
import Editor from "../../editor";
import {
    getFirstProviderAvailable,
    renderProviderAndModelForm,
    renderProviderInfos,
} from "./chat";
import { ProviderAndModel } from "../../agent";
import { inlineSuggestion } from "codemirror-extension-inline-suggestion";
import { EditorState } from "@codemirror/state";

export class Code extends WorkspaceItem {
    static loadedSetiFont = false;

    type: WorkspaceItemType.code;

    cmView: ReturnType<typeof createCmView>;
    constructor(filename: string, contents: string) {
        super(filename);
        this.cmView = createCmView({
            contents,
            extensions:
                WorkspaceItem.editorInstance.opts?.codemirrorExtraExtensions?.(
                    filename,
                ),
        });
        languageHighlightExtension(this.name.split(".").pop()).then((ext) =>
            this.cmView.addExtension(ext),
        );
    }

    icon() {
        if (!Code.loadedSetiFont) {
            Code.loadedSetiFont = true;
            loadSetiFont(WorkspaceItem.editorInstance.opts.setiFontLocation);
        }

        return createDevIcon(this.name);
    }
    title() {
        return this.name;
    }

    scroll: { top: number; left: number };
    stash() {
        this.scroll = {
            top: this.cmView.container.parentElement.scrollTop,
            left: this.cmView.container.parentElement.scrollLeft,
        };
    }
    restore() {
        if (!this.scroll) return;
        this.cmView.container.parentElement.scrollTo(this.scroll);
        this.cmView.editorView.focus();
    }

    static lastProviderUsed: ProviderAndModel = null;
    render() {
        let provider =
            Code.lastProviderUsed ||
            getFirstProviderAvailable(
                "completion",
                WorkspaceItem.editorInstance,
            );

        const getAutocomplete = async (state: EditorState) => {
            if (!provider) return "";
            const text = state.doc.toString();
            const cursor = state.selection.main.head;
            const prefix = text.slice(0, cursor);
            const suffix = text.slice(cursor) || " \n";
            const response = await WorkspaceItem.editorInstance
                .getAgent()
                .complete(prefix, suffix, provider);
            return response;
        };

        this.cmView.addExtension(
            inlineSuggestion({
                fetchFn: getAutocomplete,
                delay: 500,
            }),
        );

        return renderCodeView(
            WorkspaceItem.editorInstance,
            this.cmView,
            provider,
            (p) => {
                provider = p;
                Code.lastProviderUsed = provider;
            },
        );
    }
    destroy() {
        this.cmView.remove();
    }

    async format() {
        const formatted = await formatContents(this.name, this.cmView.value);
        if (formatted !== this.cmView.value) {
            this.cmView.replaceContents(formatted);
        }
    }
}

export function createDevIcon(filename: string) {
    const container = document.createElement("div");
    container.classList.add("dev-icon");
    container.classList.add(filenameToDevIconClass(filename));
    return container;
}

function filenameToDevIconClass(filename: string) {
    const ext = filename.split(".").pop();
    switch (ext) {
        case "ts":
        case "cts":
        case "mts":
            return "typescript";
        case "js":
        case "cjs":
        case "mjs":
            return "javascript";
        case "tsx":
        case "jsx":
            return "react";
        case "html":
            return "html";
        case "sass":
        case "scss":
            return "sass";
        case "css":
            return "css";
        case "json":
            return "json";
        case "md":
            return "markdown";
        case "liquid":
            return "liquid";
        case "png":
        case "jpg":
        case "jpeg":
            return "image";
        case "svg":
            return "svg";
        case "npmignore":
            return "npm";
        default:
            return "default";
    }
}

export async function loadSetiFont(fontLocation: string) {
    if (fontLocation === null) return;

    const setiFont = new FontFace(
        "Dev Icons",
        await fs.readFile(fontLocation || "/workspace/dev-icons/seti.woff"),
    );
    await setiFont.load();
    document.fonts.add(setiFont);
}

function renderCodeView(
    editorInstance: Editor,
    cmView: ReturnType<typeof createCmView>,
    provider: ProviderAndModel,
    didSwitchProvider: (provider: ProviderAndModel) => void,
) {
    const container = document.createElement("div");
    container.classList.add("workspace-view-code");

    const clearContainer = () =>
        Array.from(container.children).forEach((c) => c.remove());

    const renderView = () => {
        clearContainer();

        const codeCompletionProviders = editorInstance
            .getAgent()
            .providers.filter((p) => !!p.completion);
        if (codeCompletionProviders.length) {
            const top = document.createElement("div");
            top.classList.add("agent-provider");
            const settingsButton = Button({
                iconRight: "Settings",
                style: "icon-small",
            });
            settingsButton.onclick = () => {
                clearContainer();
                container.append(
                    renderProviderAndModelForm(
                        "completion",
                        editorInstance,
                        provider,
                        (p) => {
                            provider = p;
                            renderView();
                            didSwitchProvider(provider);
                        },
                    ),
                );
            };
            top.append(renderProviderInfos(provider), settingsButton);
            container.append(top);
        }

        const overscroll = document.createElement("div");
        overscroll.classList.add("cm-overscroll");

        container.append(cmView.container, overscroll);
    };
    renderView();

    return container;
}
