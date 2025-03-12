import { InputText } from "@fullstacked/ui";
import { chat, updateStats } from "./ollama";
import { marked, MarkedExtension } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { ChatResponse } from "ollama";

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

        let rawText = "", lastChunk: ChatResponse = null;
        for await (const chunk of stream) {
            lastChunk = chunk;
            rawText += chunk.message.content;
            conversation.innerHTML = await marked.parse(rawText);
            conversation.scrollTop = conversation.scrollHeight;
        }

        updateStats(lastChunk.eval_count, lastChunk.eval_duration)

        conversation
            .querySelectorAll<HTMLButtonElement>(".actions > button")
            .forEach((btn) => {
                btn.onclick = () => {
                    const text = decodeURIComponent(
                        btn.getAttribute("data-raw"),
                    ).replace(/(^\`{3}.*|\`*$)/g, "").trim();
                    const lang = btn.getAttribute("data-lang");
                    createFile(text, lang);
                };
            });
    };

    container.append(conversation, form);

    return container;
}

const highlight = markedHighlight({
    async: true,
    emptyLangClass: "hljs",
    langPrefix: "hljs language-",
    highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
    },
});

const codeExtension: MarkedExtension = {
    renderer: {
        code(args) {
            return `<div class="code-block">
                <div class="actions">
                    <button 
                        data-raw="${encodeURIComponent(args.raw)}"
                        data-lang="${args.lang}"
                    >To File</button>
                </div>
                <pre>${args.text}</pre>
            </div>`;
        },
    },
};

marked.use(highlight, codeExtension);
