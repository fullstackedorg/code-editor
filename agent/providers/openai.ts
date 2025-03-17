import { InputText } from "@fullstacked/ui";
import { AgentProvider } from ".";

export type OpenAIConfiguration = {
    type: "openai";
    apiKey: string;
};

export const OpenAI: AgentProvider = {
    name: "OpenAI",
    form() {
        const form = document.createElement("form");

        const apiKeyInput = InputText({
            label: "Api Key",
        });

        form.append(apiKeyInput.container);

        return form;
    },
};
