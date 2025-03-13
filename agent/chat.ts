import { Button, InputText } from "@fullstacked/ui";
import { chat, updateStats } from "./ollama";
import { ChatResponse } from "ollama";
import * as smd from "streaming-markdown";
import { basicSetup, EditorView } from "codemirror";
import { EditorState, StateEffect } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";

export default function Chat(createFile: (text: string, lang: string) => void) {
    const container = document.createElement("div");
    container.classList.add("agent-chat");

    const conversation = document.createElement("div");
    conversation.classList.add("conversation");

    const form = document.createElement("form");

    const promptInput = InputText({
        label: "Prompt",
    });
    form.append(promptInput.container);

    form.onsubmit = async (e) => {
        e.preventDefault();

        const stream = await chat(promptInput.input.value);
        promptInput.input.value = "";

        const renderer = smd.default_renderer(conversation);
        const defaultAddToken = renderer.add_token;
        renderer.add_token = function (data: any, type: any) {
            if (type !== 9 && type !== 10) {
                return defaultAddToken(data, type);
            }

            let parent = data.nodes[data.index];
            const cmContainer = document.createElement("div");
            cmContainer.classList.add("cm-container");
            const actions = document.createElement("div");
            actions.classList.add("actions");
            actions.append(Button({ text: "To File" }));
            cmContainer.append(actions);
            parent = parent.appendChild(cmContainer);
            const slot = new EditorView({
                doc: "",
                parent: cmContainer,
                extensions: [
                    oneDark,
                    basicSetup,
                    EditorState.readOnly.of(true),
                ],
            }) as any;
            slot.setAttribute = async function (attr: string, value: string) {
                if (attr !== "class") return;
                switch (value) {
                    case "javascript":
                    case "typescript":
                    case "jsx":
                    case "tsx":
                        const { javascript } = await import(
                            "@codemirror/lang-javascript"
                        );
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([
                                javascript({
                                    typescript: value.startsWith("t"),
                                    jsx: value.endsWith("x"),
                                }),
                            ]),
                        });
                        break;
                    case "css":
                        const { css } = await import("@codemirror/lang-css");
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([css()]),
                        });
                        break;
                    case "scss":
                    case "sass":
                        const { sass } = await import("@codemirror/lang-sass");
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([
                                sass({
                                    indented: value.startsWith("sa"),
                                }),
                            ]),
                        });
                        break;
                    case "svg":
                    case "html":
                        const { html } = await import("@codemirror/lang-html");
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([html()]),
                        });
                        break;
                    case "liquid":
                        const { liquid } = await import(
                            "@codemirror/lang-liquid"
                        );
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([liquid()]),
                        });
                        break;
                    case "go":
                        const { go } = await import("@codemirror/lang-go");
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([go()]),
                        });
                        break;
                    case "markdown":
                        const { markdown } = await import(
                            "@codemirror/lang-markdown"
                        );
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([markdown()]),
                        });
                        break;
                    case "python":
                        const { python } = await import(
                            "@codemirror/lang-python"
                        );
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([python()]),
                        });
                        break;
                    case "json":
                        const { json } = await import("@codemirror/lang-json");
                        slot.dispatch({
                            effects: StateEffect.appendConfig.of([json()]),
                        });
                        break;
                }
            };
            slot.appendChild = (text: Text) => {
                slot.dispatch({
                    changes: {
                        from: slot.state.doc.length,
                        insert: text.wholeText,
                    },
                });
            };
            data.nodes[++data.index] = slot;
        };
        const parser = smd.parser(renderer);

        let rawText = "",
            lastChunk: ChatResponse = null;
        for await (const chunk of stream) {
            lastChunk = chunk;
            rawText += chunk.message.content;
            smd.parser_write(parser, chunk.message.content);
            conversation.scrollTop = conversation.scrollHeight;
        }
        smd.parser_end(parser);

        console.log(rawText);

        updateStats(lastChunk.eval_count, lastChunk.eval_duration);
    };

    container.append(conversation, form);

    return container;
}
