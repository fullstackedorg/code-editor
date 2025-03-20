import { languageHighlightExtension } from "../codemirror/languages";
import { createCmView } from "../codemirror/view";
import Editor from "../editor";
import { inlineSuggestion } from "codemirror-extension-inline-suggestion";
import { EditorState } from "@codemirror/state";
import { Button } from "@fullstacked/ui";

type WorkspaceFile = {
    name: string;
    tab: HTMLElement;
    view: ReturnType<typeof createCmView>;
};

export function createWorkspace(editorInstance: Editor) {
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

    const add = (name: string, contents: string) => {
        let file = files.find((f) => f.name === name);

        if (!file) {
            const tab = createTab(name, remove);
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

        viewContainer.append(file.view.container);
    };

    const remove = (name: string) => {
        const indexOf = files.findIndex((f) => f.name === name);
        if (indexOf === -1) return;
        const [file] = files.splice(indexOf, 1);
        file.tab.remove();
        file.view.remove();
    };

    return {
        container,
        files: {
            get() {
                return files;
            },
            add,
            remove,
        },
    };
}

function createTab(name: string, remove: (name: string) => void) {
    const tab = document.createElement("li");
    tab.innerText = name;
    const closeButton = Button({
        iconLeft: "Close",
        style: "icon-small",
    });
    tab.append(closeButton);
    closeButton.onclick = () => remove(name);
    return tab;
}
