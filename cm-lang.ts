import { EditorView } from "codemirror";
import { StateEffect } from "@codemirror/state";

export async function loadLanguageExtension(editor: EditorView, lang: string) {
    switch (lang) {
        case "javascript":
        case "typescript":
        case "jsx":
        case "tsx":
            const { javascript } = await import("@codemirror/lang-javascript");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([
                    javascript({
                        typescript: lang.startsWith("t"),
                        jsx: lang.endsWith("x"),
                    }),
                ]),
            });
            break;
        case "css":
            const { css } = await import("@codemirror/lang-css");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([css()]),
            });
            break;
        case "scss":
        case "sass":
            const { sass } = await import("@codemirror/lang-sass");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([
                    sass({
                        indented: lang.startsWith("sa"),
                    }),
                ]),
            });
            break;
        case "svg":
        case "html":
            const { html } = await import("@codemirror/lang-html");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([html()]),
            });
            break;
        case "liquid":
            const { liquid } = await import("@codemirror/lang-liquid");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([liquid()]),
            });
            break;
        case "go":
            const { go } = await import("@codemirror/lang-go");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([go()]),
            });
            break;
        case "markdown":
            const { markdown } = await import("@codemirror/lang-markdown");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([markdown()]),
            });
            break;
        case "python":
            const { python } = await import("@codemirror/lang-python");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([python()]),
            });
            break;
        case "json":
            const { json } = await import("@codemirror/lang-json");
            editor.dispatch({
                effects: StateEffect.appendConfig.of([json()]),
            });
            break;
    }
}
