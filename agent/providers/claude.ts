import { InputText } from "@fullstacked/ui";
import { AgentProvider } from ".";
import Anthropic from "@anthropic-ai/sdk";
import { core_fetch2 } from "fetch";

export type ClaudeConfiguration = {
    type: "claude";
    apiKey: string;
};

let client: Anthropic = null;

function createClient(config: Partial<ClaudeConfiguration>) {
    return new Anthropic({
        apiKey: config.apiKey,
        fetch: core_fetch2,
        dangerouslyAllowBrowser: true,
    });
}

export const Claude: AgentProvider = {
    name: "Claude",
    configure(config: Partial<ClaudeConfiguration>) {
        client = createClient(config);
    },
    getConfig() {
        return {
            type: "claude",
            apiKey: client.apiKey,
        };
    },
    async test(config: Partial<ClaudeConfiguration>) {
        const testClient = createClient(config);
        let response: Anthropic.Models.ModelInfosPage;
        try {
            response = await testClient.models.list();
        } catch (e) {
            return false;
        }

        return !!response?.data;
    },
    form() {
        const form = document.createElement("form");

        const apiKeyInput = InputText({
            label: "Api Key",
        });
        apiKeyInput.input.name = "apiKey";
        apiKeyInput.input.value = client?.apiKey || "";

        form.append(apiKeyInput.container);

        return form;
    },
    async chat(text: string) {
        const response = await client.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1024,
            messages: [{ role: "user", content: text }],
            stream: true
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
                            value: value?.delta?.text || "",
                        };
                    },
                };
            },
        };
    },
};
