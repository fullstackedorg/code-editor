import { Button, Icon, InputText } from "@fullstacked/ui";
import { chat, summarize } from "./ollama";
import * as smd from "streaming-markdown";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { langToExtension, loadLanguageExtension } from "../cm-lang";

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

    const messages: Parameters<typeof chat>[0] = [];

    form.onsubmit = async (e) => {
        e.preventDefault();

        const user = document.createElement("div");
        user.classList.add("message-box", "user");

        const prompt = promptInput.input.value;
        user.innerText = prompt;
        promptInput.input.value = "";
        conversation.append(user);

        messages.push({
            role: "user",
            content: prompt,
        });

        const ai = document.createElement("div");
        ai.classList.add("message-box", "ai");
        conversation.append(ai);

        const stream = await chat(messages);

        const renderer = smd.default_renderer(ai);
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
            const copyToClipButton = Button({
                iconRight: "Clipboard",
                style: "icon-small",
            });
            const createFileButton = Button({
                iconRight: "File Add",
                style: "icon-small",
            });
            createFileButton.onclick = async () => {
                const text = slot.state.doc.toString();
                const lang = slot.lang;
                const summarized = (await summarize(text)).choices.at(0).message
                    .content;
                const fileName =
                    (summarized.endsWith(".") ? summarized : summarized + ".") +
                    langToExtension(lang);
                createFile("// " + fileName + "\n" + text, lang);
            };
            actions.append(copyToClipButton, createFileButton);
            cmContainer.append(actions);

            data.nodes[++data.index] = slot;
        };
        const parser = smd.parser(renderer);

        const assistantMessage: (typeof messages)[0] = {
            role: "assistant",
            content: "",
        };
        for await (const chunk of stream) {
            const text = chunk.choices?.at(0)?.delta?.content || "";
            assistantMessage.content += text;
            smd.parser_write(parser, text);
        }
        smd.parser_end(parser);

        messages.push(assistantMessage);
    };

    container.append(conversation, form);

    return container;
}
