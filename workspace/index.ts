import { languageHighlightExtension } from "../codemirror/languages";
import { createCmView } from "../codemirror/view";
import Editor from "../editor";
import { inlineSuggestion } from "codemirror-extension-inline-suggestion";
import { EditorState } from "@codemirror/state";
import { Button } from "@fullstacked/ui";
import { formatContents } from "./prettier";

type WorkspaceFile = {
    name: string;
    tab: HTMLElement;
    view: ReturnType<typeof createCmView>;
};

export function createWorkspace(editorInstance: Editor) {
    let currentFile: WorkspaceFile = null;

    const container = document.createElement("div");
    container.classList.add("workspace");

    const files: WorkspaceFile[] = [];

    const tabs = document.createElement("ul");
    const viewContainer = document.createElement("div");
    viewContainer.classList.add("view");

    container.append(tabs, viewContainer);

    const getAutocomplete = async (state: EditorState) => {
        const text = state.doc.toString();
        const cursor = state.selection.main.head;
        const prefix = text.slice(0, cursor);
        const suffix = text.slice(cursor) || " \n";
        const response = await editorInstance.agentComplete(prefix, suffix);
        return response;
    };

    const open = (file: WorkspaceFile) => {
        if (!file) return;
        files.forEach((f) =>
            f === file
                ? f.tab.classList.add("active")
                : f.tab.classList.remove("active"),
        );
        Array.from(viewContainer.children).forEach((c) => c.remove());
        viewContainer.append(file.view.container);
        currentFile = file;
    };

    const add = (name: string, contents: string) => {
        let file = files.find((f) => f.name === name);

        if (!file) {
            const tab = createTab(name, () => open(file), remove);
            tabs.append(tab);
            const view = createCmView({
                contents,
                extensions: [
                    inlineSuggestion({
                        fetchFn: getAutocomplete,
                        delay: 500,
                    }),
                    ...(editorInstance.opts.codemirrorExtraExtensions?.(name) ||
                        []),
                ],
            });
            file = {
                name,
                tab,
                view,
            };
            files.push(file);

            const fileExtension = name.split(".").pop();
            languageHighlightExtension(fileExtension).then(view.addExtension);
        } else {
            file.view.replaceContents(contents);
        }

        open(file);
    };

    const remove = (name: string) => {
        const indexOf = files.findIndex((f) => f.name === name);
        if (indexOf === -1) return;
        const [file] = files.splice(indexOf, 1);

        if (file === currentFile) {
            currentFile = null;
            open(files.at(indexOf) || files.at(-1));
        }

        file.tab.remove();
        file.view.remove();
    };

    const format = async (name: string) => {
        const file = files.find((f) => f.name === name);
        if (!file) return;
        const formatted = await formatContents(name, file.view.value);
        if (formatted !== file.view.value) {
            file.view.replaceContents(formatted);
        }
    };

    return {
        container,
        files: {
            current: () => currentFile.name,
            get: () => files.map(({ name }) => name),
            add,
            remove,
            format,
        },
    };
}

function createTab(
    name: string,
    open: () => void,
    remove: (name: string) => void,
) {
    const tab = document.createElement("li");
    tab.innerText = name;
    tab.onclick = () => open();
    const closeButton = Button({
        iconLeft: "Close",
        style: "icon-small",
    });
    tab.append(closeButton);
    closeButton.onclick = (e) => {
        e.stopPropagation();
        remove(name);
    };
    return tab;
}
