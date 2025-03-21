// source: https://github.com/eriknewland/rainbowbrackets/blob/main/rainbowBrackets.js
import {
    EditorView,
    Decoration,
    ViewPlugin,
    ViewUpdate,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";

const yellow = "#ffd700",
    violet = "#da70d6",
    blue = "#179fff";

const colors = ["yellow", "violet", "blue"];

const skip = [
    "LineComment",
    "InterpolationStart",
    "Interpolation",
    "String",
    "BlockComment",
];

const coloredBracketsPlugin = ViewPlugin.fromClass(
    class {
        decorations = null;

        constructor(view: EditorView) {
            this.decorations = this.getBracketDecorations(view);
        }

        update(update: ViewUpdate) {
            this.decorations = this.getBracketDecorations(update.view);
        }

        getBracketDecorations(view: EditorView) {
            const { doc } = view.state;
            const decorations = [];
            const stack = [];

            const tree = syntaxTree(view.state);

            for (let pos = 0; pos < doc.length; pos += 1) {
                const char = doc.sliceString(pos, pos + 1);
                if (char === "(" || char === "[" || char === "{") {
                    const t = tree.resolve(pos);
                    if (!skip.includes(t.type.name)) {
                        stack.push({ type: char, from: pos });
                    }
                } else if (char === ")" || char === "]" || char === "}") {
                    const t = tree.resolve(pos);
                    if (skip.includes(t.type.name)) {
                        continue;
                    }
                    const open = stack.pop();
                    if (open && open.type === this.getMatchingBracket(char)) {
                        const color = colors[stack.length % colors.length];
                        decorations.push(
                            Decoration.mark({
                                class: `rainbow-bracket-${color}`,
                            }).range(open.from, open.from + 1),
                            Decoration.mark({
                                class: `rainbow-bracket-${color}`,
                            }).range(pos, pos + 1),
                        );
                    }
                }
            }

            decorations.sort(
                (a, b) => a.from - b.from || a.startSide - b.startSide,
            );

            return Decoration.set(decorations);
        }

        getMatchingBracket(closingBracket: string) {
            switch (closingBracket) {
                case ")":
                    return "(";
                case "]":
                    return "[";
                case "}":
                    return "{";
                default:
                    return null;
            }
        }
    },
    {
        decorations: (v) => v.decorations,
    },
);

export const coloredBrackets = [
    coloredBracketsPlugin,
    EditorView.baseTheme({
        ".rainbow-bracket-yellow": { color: yellow },
        ".rainbow-bracket-yellow > span": { color: yellow },
        ".rainbow-bracket-violet": { color: violet },
        ".rainbow-bracket-violet > span": { color: violet },
        ".rainbow-bracket-blue": { color: blue },
        ".rainbow-bracket-blue > span": { color: blue },
    }),
];
