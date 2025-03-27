import { InputText } from "@fullstacked/ui";
import { core_fetch2 } from "fetch";
// @ts-ignore
import { Ollama as OllamaClient } from "ollama/browser";
import type * as ollama from "ollama";
import { AgentConversationMessages, AgentProvider } from "../agentProvider";
import { OllamaConfiguration, ollamaId } from "./config";

export class Ollama extends AgentProvider<OllamaConfiguration, ollama.Ollama> {
    id = ollamaId;
    name = "Ollama";
    defaultModels = {
        chat: "llama3.1:8b",
        completion: "qwen2.5-coder:1.5b",
    };

    createClient = (config: Partial<OllamaConfiguration>) => {
        const opts: ollama.Config = {
            host: config.host,
            fetch: core_fetch2,
            headers: config.extraHeaders || {},
        };
        return new OllamaClient(opts);
    };

    async models(config?: Partial<OllamaConfiguration>) {
        let testClient = config ? this.createClient(config) : this.client;

        let response: ollama.ListResponse;
        try {
            response = await testClient.list();
        } catch (e) {
            return null;
        }

        if (!response?.models) {
            return null;
        }

        return response.models.map(({ name }) => name);
    }

    formSpecifics() {
        const hostInput = InputText({
            label: "Host",
        });
        hostInput.input.name = "host";
        hostInput.input.value = this.config?.host || "http://localhost:11434";

        return [hostInput.container];
    }

    async chat(messages: AgentConversationMessages, model: string) {
        const response = await this.client.chat({
            model,
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
    }
    async completion(prompt: string, suffix: string, model: string) {
        const response = await this.client.generate({
            model,
            prompt,
            suffix,
            options: {
                stop: ["```"]
            },
            stream: false,
        });
        return response.response;
    }
}

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
