import { AgentProvider } from "../agentProvider";
import { DeepSeekConfiguration, deepseekId } from "./config";
import { InputText } from "@fullstacked/ui";
import { AgentConversationMessages } from "../../conversation";
import openai from "openai";
import { core_fetch2 } from "fetch";

export class DeepSeek extends AgentProvider<DeepSeekConfiguration, openai> {
    id = deepseekId;
    name = "DeepSeek";
    defaultModels = {
        chat: "deepseek-chat",
        completion: "deepseek-chat",
    };

    createClient = (config: Partial<DeepSeekConfiguration>) => {
        return new openai({
            apiKey: config.apiKey,
            baseURL: "https://api.deepseek.com",
            fetch: core_fetch2,
            dangerouslyAllowBrowser: true,
        });
    };

    async models(config?: Partial<DeepSeekConfiguration>) {
        const testClient = config ? this.createClient(config) : this.client;
        let response: openai.Models.ModelsPage;
        try {
            response = await testClient.models.list({});
        } catch (e) {
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
    async chat(messages: AgentConversationMessages, model: string) {
        const response = await this.client.chat.completions.create({
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
                            return { done, value: "" };
                        }

                        return {
                            done,
                            value:
                                (
                                    value as openai.Chat.Completions.ChatCompletionChunk
                                )?.choices?.at(0)?.delta?.content || "",
                        };
                    },
                };
            },
        };
    }

    betaClient: openai = null;
    async completion(prompt: string, suffix: string, model: string) {
        if (!this.betaClient) {
            this.betaClient = new openai({
                apiKey: this.config.apiKey,
                baseURL: "https://api.deepseek.com/beta",
                fetch: core_fetch2,
                dangerouslyAllowBrowser: true,
            });
        }

        const response = await this.betaClient.completions.create({
            model,
            prompt,
            suffix,
            stream: false,
        });

        return response.choices.at(0)?.text;
    }
}
