import { InputText } from "@fullstacked/ui";
import { chat } from "./ollama";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import 'highlight.js/styles/github-dark.css';

export default function Chat() {
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

        let rawText = "";
        for await (const text of stream) {
            rawText += text.message.content;
            conversation.innerHTML = await marked.parse(rawText);
            conversation.scrollTop = conversation.scrollHeight;
        }
        console.log(rawText);
    };

    container.append(conversation, form);

    return container;
}

const marked = new Marked(
    markedHighlight({
        async: true,
        emptyLangClass: "hljs",
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    }),
);
