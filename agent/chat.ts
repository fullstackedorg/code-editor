import { InputText } from "@fullstacked/ui";
import { chat, updateStats } from "./ollama";
import { ChatResponse } from "ollama";
import { createRenderer } from "../markdown/renderer";

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

        const renderer = createRenderer(conversation);

        let rawText = "", lastChunk: ChatResponse = null;
        for await (const chunk of stream) {
            lastChunk = chunk;
            rawText += chunk.message.content;
            renderer.write(chunk.message.content);
            conversation.scrollTop = conversation.scrollHeight;
        }

        updateStats(lastChunk.eval_count, lastChunk.eval_duration)

        conversation
            .querySelectorAll<HTMLButtonElement>(".actions > button")
            .forEach((btn) => {
                btn.onclick = () => {
                    const text = decodeURIComponent(
                        btn.getAttribute("data-raw"),
                    ).trim().replace(/(^\`{3}.*|\`{3}$)/g, "").trim();
                    const lang = btn.getAttribute("data-lang");
                    createFile(text, lang);
                };
            });
    };

    container.append(conversation, form);

    return container;
}
