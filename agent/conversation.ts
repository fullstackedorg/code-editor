import { Button, InputText } from "@fullstacked/ui";
import * as smd from "streaming-markdown";
import {
    languageHighlightExtension,
    languageToFileExtension,
} from "../codemirror/languages";
import { EditorState } from "@codemirror/state";
import { createCmView } from "../codemirror/view";

export function createConversation() {
    const container = document.createElement("div");
    container.classList.add("agent-conversation");

    const addUserMessage = (prompt: string) => {
        const userMessage = document.createElement("div");
        userMessage.classList.add("message-box", "user");
        userMessage.innerText = prompt;
        container.append(userMessage);
    };

    const addAgentMessage = async (
        streamOrString: string | AsyncIterable<string>,
    ) => {
        const agentMessage = document.createElement("div");
        agentMessage.classList.add("message-box", "agent");
        container.append(agentMessage);

        if (typeof streamOrString === "string") {
            agentMessage.innerText = streamOrString;
        } else {
            const renderer = createMarkdownStreamRenderer(agentMessage);
            for await (const chunk of streamOrString) {
                renderer.write(chunk);
            }
            renderer.end();
        }
    };

    return {
        container,
        addUserMessage,
        addAgentMessage,
    };
}

function createMarkdownStreamRenderer(el: HTMLElement) {
    const renderer = smd.default_renderer(el);
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
            extensions: [EditorState.readOnly.of(true)],
        }) as ReturnType<typeof createCmView> & {
            setAttribute(attr: string, value: string): void;
            appendChild(text: Text): void;
            lang: string;
        };
        codeView.setAttribute = async function (attr, value) {
            if (attr !== "class") return;
            codeView.lang = value;
            const highlightExtension = await languageHighlightExtension(value);
            if (highlightExtension) {
                codeView.addExtension(highlightExtension);
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
            // const text = codeView.value;
            // const lang = codeView.lang;
            // const summarized = (await summarize(text)).choices.at(0).message
            //     .content;
            // const fileName =
            //     (summarized.endsWith(".") ? summarized : summarized + ".") +
            //     languageToFileExtension(lang);
            // createFile("// " + fileName + "\n" + text, lang);
        };
        actions.append(copyToClipButton, createFileButton);
        container.append(actions);

        data.nodes[++data.index] = codeView;
    };
    const parser = smd.parser(renderer);
    return {
        write(md: string) {
            smd.parser_write(parser, md);
        },
        end() {
            smd.parser_end(parser);
        },
    };
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
