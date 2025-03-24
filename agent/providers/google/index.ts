import { AgentConversationMessages, AgentProvider } from "../agentProvider";
import { GoogleConfiguration, googleId } from "./config";
import { InputText } from "@fullstacked/ui";
import openai from "openai";
import { core_fetch2 } from "fetch";

export class Google extends AgentProvider<GoogleConfiguration, openai> {
    id = googleId;
    name = "Google";
    defaultModels = {
        chat: "gemini-2.0-flash",
    };

    createClient = (config: Partial<GoogleConfiguration>) => {
        return new openai({
            apiKey: config.apiKey,
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
            fetch: core_fetch2,
            dangerouslyAllowBrowser: true,
        });
    };

    async models(config?: Partial<GoogleConfiguration>) {
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

        return response.data.map(({ id }) => {
            if (id.startsWith("models/")) {
                return id.slice("models/".length);
            }
            return id;
        });
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
