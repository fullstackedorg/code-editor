import { Button, InputText } from "@fullstacked/ui";
import { chat, summarize } from "./ollama";
import * as smd from "streaming-markdown";
import { languageHighlightExtension, languageToFileExtension } from "../codemirror/languages";
import { EditorState } from "@codemirror/state";
import { createCmView } from "../codemirror/view";

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
            const container = document.createElement("div");
            container.classList.add("cm-container");
            parent = parent.appendChild(container);
            const codeView = createCmView({
                container,
                contents: "",
                extensions: [EditorState.readOnly.of(true)]
            }) as ReturnType<typeof createCmView> & {
                setAttribute(attr: string, value: string): void;
                appendChild(text: Text): void;
                lang: string;
            };
            codeView.setAttribute = async function (attr, value) {
                if (attr !== "class") return;
                codeView.lang = value;
                const highlightExtension =
                    await languageHighlightExtension(value);
                if (highlightExtension) {
                    codeView.addExtension(highlightExtension)
                }
            };
            codeView.appendChild = (text) => {
                codeView.view.dispatch({
                    changes: {
                        from: codeView.view.state.doc.length,
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
            copyToClipButton.onclick = () => {
                copyToClip(codeView.value);
            };
            const createFileButton = Button({
                iconRight: "File Add",
                style: "icon-small",
            });
            createFileButton.onclick = async () => {
                const text = codeView.value;
                const lang = codeView.lang;
                const summarized = (await summarize(text)).choices.at(0).message
                    .content;
                const fileName =
                    (summarized.endsWith(".") ? summarized : summarized + ".") +
                    languageToFileExtension(lang);
                createFile("// " + fileName + "\n" + text, lang);
            };
            actions.append(copyToClipButton, createFileButton);
            container.append(actions);

            data.nodes[++data.index] = codeView;
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

function copyToClip(text: string) {
    var input = document.createElement("textarea");
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
}
