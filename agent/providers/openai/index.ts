import { core_fetch2 } from "fetch";
import { AgentProvider } from "../agentProvider";
import { OpenAIConfiguration, openAiId } from "./config";
import openai from "openai"
import { InputText } from "@fullstacked/ui";
import { AgentConversationMessages } from "../../conversation";

export class OpenAI extends AgentProvider<OpenAIConfiguration, openai> {
    id = openAiId;
    name = "OpenAI";
    defaultModels = {
        chat: "gpt-4o",
    };

    createClient = (config: Partial<OpenAIConfiguration>) => {
        return new openai({
            apiKey: config.apiKey,
            fetch: core_fetch2,
            dangerouslyAllowBrowser: true,
        });
    };

    async models(config?: Partial<OpenAIConfiguration>) {
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

    async chat(messages: AgentConversationMessages) {
        const response = await this.client.chat.completions.create({
            model: this.config.models?.chat || this.defaultModels.chat,
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
