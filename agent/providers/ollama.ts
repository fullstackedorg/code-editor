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

let clientConfig: OllamaConfiguration = null;
let client: ollama.Ollama = null;

function createClient(config: Partial<OllamaConfiguration>): ollama.Ollama {
    const opts: ollama.Config = {
        host: config.host,
        fetch: core_fetch2,
        headers: config.extraHeaders || {},
    };
    return new OllamaClient(opts);
}

export const Ollama: AgentProvider = {
    name: "Ollama",
    configure(config: OllamaConfiguration) {
        clientConfig = config;
        client = createClient(config);
    },
    getConfig: () => {
        if (!client) return null;
        return {
            type: "ollama",
            host: clientConfig.host,
            extraHeaders: clientConfig.extraHeaders || {},
        };
    },
    async test(config?: Partial<OllamaConfiguration>) {
        let testClient = config ? createClient(config) : client;

        let response: ollama.ListResponse;
        try {
            response = await testClient.ps();
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
        hostInput.input.name = "host";
        hostInput.input.value = clientConfig?.host || "http://localhost:11434";

        form.append(hostInput.container);

        return form;
    },
    async chat(messages) {
        const response = await client.chat({
            model: "llama3.1:8b",
            messages: messages.map((m) => ({
                role: m.role === "agent" ? "assistant" : m.role,
                content: m.content,
            })),
            stream: true,
        });

        const iterator = response[Symbol.asyncIterator]();

        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        const { done, value } = await iterator.next();
                        if (done) {
                            return { done, value };
                        }

                        return {
                            done,
                            value: (value as ollama.ChatResponse).message
                                .content,
                        };
                    },
                };
            },
        };
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
