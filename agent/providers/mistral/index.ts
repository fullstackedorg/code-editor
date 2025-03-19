import { AgentProvider } from "../agentProvider";
import { MistralConfiguration, mistralId } from "./config";
import { core_fetch2 } from "fetch";
import { InputText } from "@fullstacked/ui";
import { AgentConversationMessages } from "../../conversation";
import { Mistral as mistral } from "@mistralai/mistralai";
import type { CompletionEvent, ModelList } from "@mistralai/mistralai/models/components";
import { HTTPClient } from "@mistralai/mistralai/lib/http";

export class Mistral extends AgentProvider<MistralConfiguration, mistral> {
    id = mistralId;
    name = "Mistral";
    defaultModels = {
        chat: "mistral-large-latest",
        completion: "codestral-latest",
    };

    createClient = (config: Partial<MistralConfiguration>) => {
        return new mistral({
            apiKey: config.apiKey,
            httpClient: {
                request: (r) => {
                    console.log(r);
                    return core_fetch2(r);
                },
            } as HTTPClient,
        });
    };

    async models(config?: Partial<MistralConfiguration>) {
        const testClient = config ? this.createClient(config) : this.client;
        let response: ModelList;
        try {
            response = await testClient.models.list();
        } catch (e) {
            console.log(e);
            return null;
        }

        if (!response?.data) {
            return null;
        }

        return response.data.map(({ id }) => id);
    }
    formSpecifics() {
        const apiKeyInput = InputText({
            label: "API Key",
        });
        apiKeyInput.input.name = "apiKey";
        apiKeyInput.input.value = this.config?.apiKey || "";

        return [apiKeyInput.container];
    }
    async chat(messages: AgentConversationMessages) {
        const response = await this.client.chat.stream({
            model: this.config.models?.chat || this.defaultModels.chat,
            messages: messages.map((m) => ({
                role: m.role === "agent" ? "assistant" : m.role,
                content: m.content,
            })),
        });

        const iterator = response[Symbol.asyncIterator]();

        return {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        const { done, value } = await iterator.next();
                        if (done) {
                            return { done, value: "" };
                        }

                        return {
                            done,
                            value: (value as CompletionEvent).data.choices[0].delta.content as string
                        };
                    },
                };
            },
        };
    }

    async completion(prompt: string, suffix: string) {
        const response = await this.client.fim.complete({
            model: this.config.models?.completion || this.defaultModels.completion,
            prompt,
            suffix,
        });

        return response.choices[0].message.content as string
    };
}
