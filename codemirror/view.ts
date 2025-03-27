import { EditorView, basicSetup } from "codemirror";
import { keymap } from "@codemirror/view";
import { Compartment, EditorSelection, Extension } from "@codemirror/state";
import { indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { coloredBrackets } from "./brackets";

type CmViewOpts = {
    contents: string;
    extensions?: Extension[];
};

export const tabWidth = 4;

export function createCmView(opts: CmViewOpts) {
    const container = document.createElement("div");
    container.classList.add("cm-container");

    const compartment = new Compartment();
    const extensions = new Set<Extension>();

    if (opts?.extensions) {
        for (const ext of opts.extensions) {
            extensions.add(ext);
        }
    }

    const editorView = new EditorView({
        parent: container,
        doc: opts.contents,
        extensions: [
            oneDark,
            coloredBrackets,
            basicSetup,
            keymap.of([indentWithTab]),
            indentUnit.of(new Array(tabWidth + 1).join(" ")),
            compartment.of([...extensions]),
        ],
    });

    const reloadExtensions = () => {
        const effects = compartment.reconfigure([...extensions]);
        editorView.dispatch({ effects });
    };

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
        extensions: {
            add(extension: Extension) {
                if (!extension || extensions.has(extension)) return;
                extensions.add(extension);
                reloadExtensions();
            },
            remove(extension: Extension) {
                if (!extension || extensions.has(extension)) return;
                extensions.delete(extension);
                reloadExtensions();
            },
            removeAll() {
                extensions.clear();
                reloadExtensions();
            },
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
