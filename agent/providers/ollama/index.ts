import { Button, InputText } from "@fullstacked/ui";
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

        const extraHeadersList = document.createElement("div");
        extraHeadersList.classList.add("agent-headers-list");

        const list = document.createElement("ul");

        const addHeaderLine = (key: string, value: string) => {
            const id = Math.floor(Math.random() * 1000);
            const line = document.createElement("li");
            const keyInput = InputText({
                label: "Header Key",
            });
            keyInput.input.value = key;
            keyInput.input.name = `extraHeaders.${id}.key`;
            const valueInput = InputText({
                label: "Header Value",
            });
            valueInput.input.value = value;
            valueInput.input.name = `extraHeaders.${id}.value`;
            line.append(keyInput.container, valueInput.container);
            list.append(line);
        };

        const configHeaders = this.config?.extraHeaders || {};
        for (const [key, value] of Object.entries(configHeaders)) {
            addHeaderLine(key, value);
        }
        addHeaderLine("", "");
        
        const add = Button({
            text: "Header",
            iconRight: "Plus",
        });
        add.onclick = () => addHeaderLine("", "")

        extraHeadersList.append(list, add);
        
        return [hostInput.container, extraHeadersList];
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
                stop: ["```"],
            },
            stream: false,
        });
        return response.response;
    }
}
