import { EditorView, basicSetup } from "codemirror";
import { Extension, StateEffect } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";

type CmViewOpts = {
    container: HTMLElement;
    contents: string;
    extensions?: Extension[];
};

export function createCmView(opts: CmViewOpts) {
    const view = new EditorView({
        doc: opts.contents,
        parent: opts.container,
        extensions: [oneDark, basicSetup, ...(opts.extensions || [])],
    });

    return {
        view,
        addExtension(extension: Extension) {
            view.dispatch({
                effects: StateEffect.appendConfig.of([extension]),
            });
        },
        get value() {
            return view.state.doc.toString();
        },
    };
}
