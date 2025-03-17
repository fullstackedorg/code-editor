import { InputText } from "@fullstacked/ui";
import { AgentProvider } from ".";
import { core_fetch2 } from "fetch";
// @ts-ignore
import { Ollama as OllamaClient } from "ollama/browser";
import * as ollama from "ollama";

export type OllamaConfiguration = {
    type: "ollama";
    host: string;
    extraHeaders?: Record<string, string>;
};

let client: ollama.Ollama = null;

export const Ollama: AgentProvider = {
    configure(config: OllamaConfiguration) {
        const opts: ollama.Config = {
            host: config.host,
            fetch: core_fetch2,
            headers: config.extraHeaders || {},
        };
        client = new OllamaClient(opts);
    },
    async test() {
        if (!client) return false;
        let response: ollama.ListResponse;
        try {
            response = await client.ps();
        } catch (e) {
            return false;
        }
        return !!response?.models;
    },
    form() {
        const form = document.createElement("form");

        const hostInput = InputText({
            label: "Host",
        });
        hostInput.input.innerHTML = "http://localhost:11434";

        form.append(hostInput.container);

        return form;
    },
    chat(messages) {
        return client.chat({
            model: "llama3.1:8b",
            messages,
            stream: true,
        });
    },
    completion(prompt, suffix) {
        return client.generate({
            model: "qwen2.5-coder:1.5b",
            prompt,
            suffix,
            stream: false,
        });
    },
};

// export async function summarize(text: string) {
//     return openai.chat.completions.create({
//         model: "llama3.1:8b",
//         messages: [{
//             role: "system",
//             content: "Summarize in one word only what the user input code does to name it as a file. No Markdown. Text only. No extension."
//         }, {
//             role: "user",
//             content: text
//         }],
//         stream: false,
//     });
// }
