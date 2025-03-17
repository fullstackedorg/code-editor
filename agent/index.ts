import { Ollama } from "./providers/ollama";
import { AgentConfiguration, AgentProvider } from "./providers";
import { OpenAI } from "./providers/openai";
import Editor from "../editor";
import { createAgentConfigure } from "./configure";

export function createAgent(editorInstance: Editor) {
    let currentProvider: AgentProvider = null;
    const agentProviders: AgentProvider[] = [];
    let dom: HTMLElement;

    const configurations = editorInstance.defaultOpts?.agentConfigurations;
    if (configurations?.length) {
        for (const config of configurations) {
            const provider = getProviderFromConfig(config);
            if (!provider) continue;
            agentProviders.push(provider);
            provider.configure(config);
        }
    }

    return {
        get element() {
            if (!dom) {
                dom = renderAgent(agentProviders.length === 0);
            }

            return dom;
        },
        ask(prompt: string){
            if(!currentProvider) return;
        },
        chat(prompt: string){
            if(!currentProvider) return;
        }
    };
}

function getProviderFromConfig(configuration: AgentConfiguration) {
    switch (configuration.type) {
        case "ollama":
            return Ollama;
        case "openai":
            return OpenAI;
        default:
            return null;
    }
}

function renderAgent(configure: boolean) {
    const container = document.createElement("div");

    if(configure) {
        container.append(createAgentConfigure())
    }

    return container;
}
