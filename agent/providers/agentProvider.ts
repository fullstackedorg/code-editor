import { OllamaConfiguration } from "./ollama/config";
import { OpenAIConfiguration } from "./openai/config";
import { ClaudeConfiguration } from "./claude/config";
import { MistralConfiguration } from "./mistral/config";
import { GoogleConfiguration } from "./google/config";
import { DeepSeekConfiguration } from "./deepseek/config";
import { XAIConfiguration } from "./xai/config";
import Editor from "../../editor";

export type AGENT_USE = "chat" | "completion";
export type ModelsSelection = { [use: string]: string };

export type AgentConfiguration =
    | OllamaConfiguration
    | OpenAIConfiguration
    | ClaudeConfiguration
    | MistralConfiguration
    | GoogleConfiguration
    | DeepSeekConfiguration
    | XAIConfiguration;

export type AgentConfigWithUses = AgentConfiguration & {
    uses: AGENT_USE[];
};

export type AgentProviderGeneric = AgentProvider<any, any>;

export type AgentConversationMessages = {
    role: "user" | "agent";
    content: string;
}[];

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

    static lastUsedProviders: { [use: string]: AgentProviderGeneric } = {};
    static editorInstance: Editor;
    setModel(use: AGENT_USE, model: string) {
        if (!this.config?.models) {
            this.config.models = {};
        }
        this.config.models[use] = model;
        AgentProvider.lastUsedProviders[use] = this;
        AgentProvider.editorInstance.updatedAgentConfiguration();
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
                    if (key.endsWith(".value")) {
                        continue;
                    } else if (key.endsWith(".key")) {
                        if (!value) {
                            continue;
                        }

                        const keyComponents = key.split(".");

                        if (!obj[keyComponents[0]]) {
                            obj[keyComponents[0]] = {};
                        }

                        const keySearch = `${keyComponents[0]}.${keyComponents[1]}.value`;
                        obj[keyComponents[0]][value] = formData.get(keySearch);
                        continue;
                    }

                    obj[key] = value;
                }
                return obj;
            },
        };
    }

    abstract chat(
        messages: AgentConversationMessages,
        model: string,
    ): Promise<AsyncIterable<string>>;
    abstract completion(
        prompt: string,
        suffix: string,
        model: string,
    ): Promise<string>;
}
