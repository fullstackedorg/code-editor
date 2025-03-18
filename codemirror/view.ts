import { EditorView, basicSetup } from "codemirror";
import { Extension, StateEffect } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";

type CmViewOpts = {
    contents: string;
    extensions?: Extension[];
};

export function createCmView(opts: CmViewOpts) {
    const container = document.createElement("div");
    container.classList.add("cm-container");

    const editorView = new EditorView({
        parent: container,
        doc: opts.contents,
        extensions: [oneDark, basicSetup, ...(opts.extensions || [])],
    });

    return {
        container,
        editorView,
        addExtension(extension: Extension) {
            editorView.dispatch({
                effects: StateEffect.appendConfig.of([extension]),
            });
        },
        get value() {
            return editorView.state.doc.toString();
        },
    };
}
