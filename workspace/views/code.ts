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
import { inlineSuggestion } from "../../codemirror/inline-suggestion";
import { EditorState } from "@codemirror/state";
import { uint8ToStr } from "../contents";
import { EditorView } from "codemirror";
import { diagnosticCount } from "@codemirror/lint";

export class Code extends WorkspaceItem {
    type = WorkspaceItemType.code;

    private cmView: ReturnType<typeof createCmView>;

    private provider: ProviderAndModel;
    cmViewContainer = document.createElement("div");
    loadContents(contents: string | Uint8Array) {
        contents = uint8ToStr(contents);
        this.cmView = createCmView({ contents });
        this.cmViewContainer.append(this.cmView.container);
        return this.reloadExtensions();
    }

    private async getAutocomplete(state: EditorState) {
        if (!this.provider) return "";
        const text = state.doc.toString();
        const cursor = state.selection.main.head;
        const prefix = text.slice(0, cursor);
        const suffix = text.slice(cursor) || " \n";
        const response = await WorkspaceItem.editorInstance
            .getAgent()
            .complete(prefix, suffix, this.provider);
        return response;
    }

    override async rename(newName: string) {
        if (this.name === newName) return;
        const oldName = this.name;
        this.name = newName;
        this.title();
        this.reloadExtensions();
        WorkspaceItem.editorInstance.fileRenamed(oldName, this.name);
    }

    private updatesBlocked = false;
    preventUpdates(prevent: boolean) {
        this.updatesBlocked = prevent;
        if (this.updatesBlocked) {
            this.cmView?.editing.lock();
        } else {
            this.cmView?.editing.unlock();
        }
    }

    lint() {
        this.cmView.linters.reload();
    }

    private async reloadExtensions() {
        if (!this.cmView) return;

        this.cmView.extensions.removeAll();

        this.preventUpdates(this.updatesBlocked);

        this.cmView.extensions.add(
            EditorView.updateListener.of(() => {
                if (this.updatesBlocked) return;

                WorkspaceItem.editorInstance.fileUpdated(
                    this.name,
                    this.cmView.value,
                );

                if (diagnosticCount(this.cmView.editorView.state)) {
                    this.notify(true);
                } else {
                    this.notify(false);
                }
            }),
        );

        const extensions =
            WorkspaceItem.editorInstance?.opts?.codemirrorExtraExtensions?.(
                this.name,
            ) || [];
        for (const ext of extensions) {
            this.cmView.extensions.add(ext);
        }

        if (this.provider) {
            this.cmView.extensions.add(
                inlineSuggestion({
                    fetchFn: (state) => this.getAutocomplete(state),
                    delay: 500,
                }),
            );
        }

        const langExtension = await languageHighlightExtension(
            this.name.split(".").pop(),
        );
        this.cmView.extensions.add(langExtension);

        this.cmView.linters.removeAll();

        const linters =
            WorkspaceItem.editorInstance?.opts?.codemirrorLinters?.(
                this.name,
            ) || [];

        this.cmView.linters.add(linters);
    }

    titleContainer = document.createElement("div");
    icon() {
        return createDevIcon(this.name);
    }

    scroll: { top: number; left: number };
    stash() {
        this.scroll = {
            top: this.cmViewContainer?.parentElement?.scrollTop || 0,
            left: this.cmViewContainer?.parentElement?.scrollLeft || 0,
        };
    }
    restore() {
        if (!this.scroll) return;
        this.cmViewContainer?.parentElement?.scrollTo?.(this.scroll);
        this.cmView.linters.reload();
    }

    static lastProviderUsed: ProviderAndModel = undefined;
    render() {
        this.provider =
            typeof Code.lastProviderUsed !== "undefined"
                ? Code.lastProviderUsed
                : getFirstProviderAvailable(
                      "completion",
                      WorkspaceItem.editorInstance,
                  );

        return renderCodeView(
            WorkspaceItem.editorInstance,
            this.cmViewContainer,
            this.provider,
            (p) => {
                this.provider = p;
                Code.lastProviderUsed = this.provider;
                this.reloadExtensions();
            },
        );
    }
    destroy() {
        this.cmView?.remove();
    }

    replaceContents(contents: string | Uint8Array) {
        this.cmView.replaceContents(uint8ToStr(contents));
    }

    async goTo(pos: number) {
        const editorView = this.cmView.editorView;
        editorView.dispatch({ selection: { anchor: pos, head: pos } });

        const aimedLine = editorView.state.doc.lineAt(pos).number;

        const scrollToPos = () =>
            new Promise((res) => {
                const { top } = editorView.lineBlockAt(pos);
                this.cmViewContainer.parentElement.scrollTo({ top });
                setTimeout(res);
            });

        let firstVisibleLine = -1,
            lastVisibleLine = -1,
            tries = 3;

        do {
            await scrollToPos();
            const height =
                this.cmViewContainer.parentElement.getBoundingClientRect()
                    .height * 0.8;
            const scrollTop = this.cmViewContainer.parentElement.scrollTop;
            const visibleLines = [
                editorView.lineBlockAtHeight(scrollTop),
                editorView.lineBlockAtHeight(height + scrollTop),
            ];
            firstVisibleLine = editorView.state.doc.lineAt(
                visibleLines.at(0).from,
            ).number;
            lastVisibleLine = editorView.state.doc.lineAt(
                visibleLines.at(-1).from,
            ).number;
            tries--;
        } while (
            tries &&
            (aimedLine < firstVisibleLine || aimedLine > lastVisibleLine)
        );
    }

    async format() {
        const formatted = await formatContents(this.name, this.cmView.value);
        if (formatted !== this.cmView.value) {
            this.cmView.replaceContents(formatted);
        }
    }
}

export function createDevIcon(filename: string) {
    WorkspaceItem.loadSetiFont();
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

function renderCodeView(
    editorInstance: Editor,
    cmViewContainer: HTMLDivElement,
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
                        true,
                    ),
                );
            };
            top.append(renderProviderInfos(provider), settingsButton);
            container.append(top);
        }

        const overscroll = document.createElement("div");
        overscroll.classList.add("cm-overscroll");

        container.append(cmViewContainer, overscroll);
    };
    renderView();

    return container;
}
