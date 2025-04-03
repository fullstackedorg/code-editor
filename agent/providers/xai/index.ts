import { core_fetch2 } from "fetch";
import { AgentConversationMessages, AgentProvider } from "../agentProvider";
import { XAIConfiguration, xAiId } from "./config";
import openai from "openai";
import { InputText } from "@fullstacked/ui";

export class XAI extends AgentProvider<XAIConfiguration, openai> {
    id = xAiId;
    name = "xAI";
    defaultModels = {
        chat: "grok-2-1212",
    };

    createClient = (config: Partial<XAIConfiguration>) => {
        return new openai({
            apiKey: config.apiKey,
            fetch: core_fetch2,
            baseURL: "https://api.x.ai/v1",
            dangerouslyAllowBrowser: true,
        });
    };

    async models(config?: Partial<XAIConfiguration>) {
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

    completion: undefined;
}
