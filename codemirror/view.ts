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

export function createCmView(opts?: CmViewOpts) {
    const container = document.createElement("div");
    container.classList.add("cm-container");

    const lintersCompartment = new Compartment();
    const loadedLinters = new Set<Extension>();

    const compartment = new Compartment();
    const loadedExtensions = new Set<Extension>();

    if (opts?.extensions) {
        for (const ext of opts.extensions) {
            loadedExtensions.add(ext);
        }
    }

    const editorView = new EditorView({
        parent: container,
        doc: opts?.contents || "",
        extensions: [
            oneDark,
            coloredBrackets,
            basicSetup,
            keymap.of([indentWithTab]),
            indentUnit.of(new Array(tabWidth + 1).join(" ")),
            compartment.of([...loadedExtensions]),
        ],
    });

    const reloadExtensions = () => {
        const effects = compartment.reconfigure([...loadedExtensions]);
        editorView.dispatch({ effects });
    };

    const extensions = {
        add(extension: Extension) {
            if (!extension) return;
            loadedExtensions.add(extension);
            reloadExtensions();
        },
        remove(extension: Extension) {
            if (!extension) return;
            loadedExtensions.delete(extension);
            reloadExtensions();
        },
        removeAll() {
            loadedExtensions.clear();
            reloadExtensions();
        },
    };

    const reloadLinters = () => {
        const effects = lintersCompartment.reconfigure([...loadedLinters]);
        editorView.dispatch({ effects });
    };

    const linters = {
        add(extensions: Extension[]) {
            for (const extension of extensions) {
                if (!extension) continue;
                loadedLinters.add(extension);
            }
            reloadLinters();
        },
        reload: reloadLinters,
        removeAll() {
            loadedLinters.clear();
            reloadLinters();
        },
    };

    const lockEditing = EditorView.editable.of(false);

    return {
        container,
        editorView,
        editing: {
            lock() {
                extensions.add(lockEditing);
            },
            unlock() {
                extensions.remove(lockEditing);
            },
        },
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
        extensions,
        linters,
        remove() {
            container.remove();
            editorView.destroy();
        },
        get value() {
            return editorView.state.doc.toString();
        },
    };
}
