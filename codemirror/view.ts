import { EditorView, basicSetup } from "codemirror";
import { EditorSelection, Extension, StateEffect } from "@codemirror/state";
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
        replaceContents(newContents: string) {
            const currentContents = editorView.state.doc.toString();
            if (newContents === currentContents) return;

            let selection = editorView.state.selection;

            let range = selection.ranges?.at(0);
            if (range?.from > newContents.length) {
                selection = selection.replaceRange(
                    EditorSelection.range(newContents.length, range.to),
                    0,
                );
                range = selection.ranges?.at(0);
            }
            if (range?.to > newContents.length) {
                selection = selection.replaceRange(
                    EditorSelection.range(range.from, newContents.length),
                    0,
                );
            }

            editorView.dispatch({
                changes: {
                    from: 0,
                    to: currentContents.length,
                    insert: newContents,
                },
                selection,
            });
        },
        addExtension(extension: Extension) {
            editorView.dispatch({
                effects: StateEffect.appendConfig.of([extension]),
            });
        },
        remove() {
            container.remove();
            editorView.destroy();
        },
        get value() {
            return editorView.state.doc.toString();
        },
    };
}
