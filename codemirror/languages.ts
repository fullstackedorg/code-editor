import { Extension } from "@codemirror/state";

export function languageToFileExtension(lang: string) {
    switch (lang) {
        case "javascript":
            return "js";
        case "typescript":
            return "ts";
        case "markdown":
            return "md";
        case "python":
            return "py";
    }
    return lang;
}

export async function languageHighlightExtension(lang: string): Promise<Extension> {
    switch (lang) {
        case "javascript":
        case "typescript":
        case "js":
        case "jsx":
        case "cjs":
        case "mjs":
        case "ts":
        case "tsx":
            const { javascript } = await import("@codemirror/lang-javascript");
            return javascript({
                typescript: lang.startsWith("t"),
                jsx: lang.endsWith("x"),
            });
        case "css":
            const { css } = await import("@codemirror/lang-css");
            return css();
        case "scss":
        case "sass":
            const { sass } = await import("@codemirror/lang-sass");
            return sass({ indented: lang.startsWith("sa") });
        case "svg":
        case "html":
            const { html } = await import("@codemirror/lang-html");
            return html();
        case "liquid":
            const { liquid } = await import("@codemirror/lang-liquid");
            return liquid();
        case "go":
            const { go } = await import("@codemirror/lang-go");
            return go();
        case "markdown":
            const { markdown } = await import("@codemirror/lang-markdown");
            return markdown();
        case "python":
            const { python } = await import("@codemirror/lang-python");
            return python();
        case "json":
            const { json } = await import("@codemirror/lang-json");
            return json();
    }
}
