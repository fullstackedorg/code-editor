import { OllamaConfiguration } from "./ollama/config";
import { OpenAIConfiguration } from "./openai/config";
import { ClaudeConfiguration } from "./claude/config";
import { AgentConversationMessages } from "../conversation";
import { MistralConfiguration } from "./mistral/config";
import { GoogleConfiguration } from "./google/config";
import { DeepSeekConfiguration } from "./deepseek/config";

export type AGENT_USE = "chat" | "completion";
export type ModelsSelection = Partial<{ [use: string]: string }>;

export type AgentConfiguration =
    | OllamaConfiguration
    | OpenAIConfiguration
    | ClaudeConfiguration
    | MistralConfiguration
    | GoogleConfiguration
    | DeepSeekConfiguration;

export type AgentConfigWithUses = AgentConfiguration & {
    uses: AGENT_USE[];
};

export type AgentProviderGeneric = AgentProvider<any, any>;

export abstract class AgentProvider<T extends AgentConfiguration, C> {
    abstract id: T["type"];
    abstract name: string;
    abstract defaultModels: ModelsSelection;

    config: T & {
        models: ModelsSelection;
    };

    client: C;
    abstract createClient: (config: Partial<T>) => C;

    configure(config: Partial<T>) {
        this.config = {
            models: this.config?.models,
            ...(config as T),
        };
        this.config.type = this.id;
        this.client = this.createClient(config);
    }

    setModel(use: AGENT_USE, model: string) {
        if (!this.config?.models) {
            this.config.models = {};
        }
        this.config.models[use] = model;
    }

    abstract models(config?: Partial<T>): Promise<string[]>;

    abstract formSpecifics(): HTMLElement[];
    form() {
        const form = document.createElement("form");
        form.append(...this.formSpecifics());
        form.onsubmit = (e) => e.preventDefault();

        return {
            form,
            get value() {
                let obj = {};
                const formData = new FormData(form);
                for (const [key, value] of formData.entries()) {
                    obj[key] = value;
                }
                return obj;
            },
        };
    }

    abstract chat(
        messages: AgentConversationMessages,
    ): Promise<AsyncIterable<string>>;
    abstract completion(prompt: string, suffix: string): Promise<string>;
}
