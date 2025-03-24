import Anthropic from "@anthropic-ai/sdk";
import { AgentProvider } from "../agentProvider";
import { ClaudeConfiguration, claudeId } from "./config";
import { core_fetch2 } from "fetch";
import { InputText } from "@fullstacked/ui";
import { AgentConversationMessages } from "../../conversation";

export class Claude extends AgentProvider<ClaudeConfiguration, Anthropic> {
    id = claudeId;
    name = "Claude";
    defaultModels = {
        chat: "claude-3-7-sonnet-20250219",
    };

    createClient = (config: Partial<ClaudeConfiguration>) => {
        return new Anthropic({
            apiKey: config.apiKey,
            fetch: core_fetch2,
            dangerouslyAllowBrowser: true,
        });
    };

    async models(config?: Partial<ClaudeConfiguration>) {
        const testClient = config ? this.createClient(config) : this.client;
        let response: Anthropic.Models.ModelInfosPage;
        try {
            response = await testClient.models.list();
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
        const response = await this.client.messages.create({
            model,
            max_tokens: 8192,
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

                        const text = value?.delta?.text || "";
                        return {
                            done,
                            value: text,
                        };
                    },
                };
            },
        };
    }

    completion: undefined;
}
