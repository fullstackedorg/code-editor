import { Button, InputText } from "@fullstacked/ui";
import { chat, updateStats } from "./ollama";
import { ChatResponse } from "ollama";
import * as smd from "streaming-markdown";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { loadLanguageExtension } from "../cm-lang";

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
            parent = parent.appendChild(cmContainer);
            const slot = new EditorView({
                doc: "",
                parent: cmContainer,
                extensions: [
                    oneDark,
                    basicSetup,
                    EditorState.readOnly.of(true),
                ],
            }) as EditorView & {
                setAttribute(attr: string, value: string): void;
                appendChild(text: Text): void;
                lang: string;
            };
            slot.setAttribute = async function (attr, value) {
                if (attr !== "class") return;
                slot.lang = value;
                loadLanguageExtension(slot, value);
            };
            slot.appendChild = (text) => {
                slot.dispatch({
                    changes: {
                        from: slot.state.doc.length,
                        insert: text.wholeText,
                    },
                });
            };

            const actions = document.createElement("div");
            actions.classList.add("actions");
            const button = Button({ text: "To File" });
            button.onclick = () => {
                createFile(slot.state.doc.toString(), slot.lang);
            };
            actions.append(button);
            cmContainer.append(actions);

            data.nodes[++data.index] = slot;
        };
        const parser = smd.parser(renderer);

        let rawText = "";
        // ,
        // lastChunk: ChatResponse = null;
        for await (const chunk of stream) {
            // lastChunk = chunk;
            // rawText += chunk.message.content;
            // smd.parser_write(parser, chunk.message.content);

            const text = chunk.choices?.at(0)?.delta?.content || "";
            rawText += text;
            smd.parser_write(parser, text);
            conversation.scrollTop = conversation.scrollHeight;
        }
        smd.parser_end(parser);

        console.log(rawText);

        // updateStats(lastChunk.eval_count, lastChunk.eval_duration);
    };

    container.append(conversation, form);

    return container;
}
