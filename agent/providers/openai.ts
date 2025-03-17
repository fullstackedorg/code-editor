import { InputText } from "@fullstacked/ui";
import { AgentProvider } from ".";
import openai from "openai";
import { core_fetch2 } from "fetch";

export type OpenAIConfiguration = {
    type: "openai";
    apiKey: string;
};

let client: openai = null;

function createClient(config: Partial<OpenAIConfiguration>) {
    return new openai({
        apiKey: config.apiKey,
        fetch: core_fetch2,
        dangerouslyAllowBrowser: true,
    });
}

export const OpenAI: AgentProvider = {
    name: "OpenAI",
    configure(config: Partial<OpenAIConfiguration>) {
        client = createClient(config);
    },
    getConfig() {
        return {
            type: "openai",
            apiKey: client.apiKey,
        };
    },
    async test(config: Partial<OpenAIConfiguration>) {
        const testClient = createClient(config);
        let response: openai.Models.ModelsPage;
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
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: text,
                },
            ],
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
                            value: (
                                value as openai.Chat.Completions.ChatCompletionChunk
                            )?.choices?.at(0)?.delta?.content || "",
                        };
                    },
                };
            },
        };
    },
};
