import prettier from "prettier";
import prettierPluginHTML from "prettier/plugins/html";
import prettierPluginCSS from "prettier/plugins/postcss";
import prettierPluginMD from "prettier/plugins/markdown";
import prettierPluginEstree from "prettier/plugins/estree";
import prettierPluginBabel from "prettier/plugins/babel";
import prettierPluginTypeScript from "prettier/plugins/typescript";
import prettierPluginLiquid from "./plugin-liquid";
import { tabWidth } from "../../codemirror/view";

const plugins = [
    prettierPluginHTML,
    prettierPluginCSS,
    prettierPluginMD,
    prettierPluginEstree,
    prettierPluginBabel,
    prettierPluginTypeScript,
    prettierPluginLiquid,
];

export function formatContents(filepath: string, text: string) {
    const fileExtension = filepath.split(".").pop().toLowerCase();

    if (fileExtension === "svg") {
        filepath = filepath.slice(0, 0 - ".svg".length) + ".html";
    }

    return prettier.format(text, {
        filepath,
        plugins,
        tabWidth,
    });
}
