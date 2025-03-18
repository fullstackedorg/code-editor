import { Ollama } from "./providers/ollama";
import { AgentConfiguration, AgentProvider } from "./providers";
import { OpenAI } from "./providers/openai";
import Editor from "../editor";
import { createConfigure } from "./configure";
import { createPrompt } from "./prompt";
import { createConversation } from "./conversation";
import { Claude } from "./providers/claude";

export function createAgent(editorInstance: Editor) {
    let currentProvider: AgentProvider = null;
    const agentProviders: AgentProvider[] = [];
    let configure: ReturnType<typeof createConfigure>;
    let conversation: ReturnType<typeof createConversation>;
    let prompt: ReturnType<typeof createPrompt>;

    const didConfigureProvider = (provider: AgentProvider) => {
        currentProvider = provider;

        const indexOf = agentProviders.findIndex(
            (p) => p.name === provider.name,
        );
        if (indexOf !== -1) {
            agentProviders.splice(indexOf, 1);
        }
        agentProviders.push(provider);
        editorInstance.updatedAgentConfiguration();
    };

    const configurations = editorInstance.opts
        ?.agentConfigurations as (AgentConfiguration & {
        current: boolean;
    })[];
    if (configurations?.length) {
        let savedCurrentProvider = null;
        for (const config of configurations) {
            const provider = getProviderFromConfig(config);
            if (!provider) continue;

            provider.configure(config);
            didConfigureProvider(provider);

            if (config.current) {
                savedCurrentProvider = provider;
            }
        }

        if (savedCurrentProvider) {
            currentProvider = savedCurrentProvider;
        }
    }

    return {
        get configure() {
            if (!configure) {
                configure = createConfigure(
                    currentProvider,
                    didConfigureProvider,
                );
            }

            return configure;
        },
        get conversation() {
            if (!conversation) {
                conversation = createConversation(editorInstance);
            }

            return conversation.container;
        },
        get prompt() {
            if (!prompt) {
                prompt = createPrompt(editorInstance);
            }

            return prompt;
        },

        getConfigurations() {
            return agentProviders.map((p) =>
                p.name === currentProvider.name
                    ? {
                          current: true,
                          ...p.getConfig(),
                      }
                    : p.getConfig(),
            );
        },

        ask(text: string, chat: boolean) {
            if (chat) {
                conversation?.addUserMessage(text);

                if (!currentProvider) {
                    conversation?.addAgentMessage("No provider configured");
                } else {
                    currentProvider
                        .chat(
                            conversation?.messages || [
                                {
                                    role: "user",
                                    content: text,
                                },
                            ],
                        )
                        .then((stream) =>
                            conversation?.addAgentMessage(
                                stream,
                                currentProvider.name,
                            ),
                        );
                }
            } else {
                if (!currentProvider) {
                } else {
                }
            }
        },
    };
}

function getProviderFromConfig(configuration: AgentConfiguration) {
    switch (configuration.type) {
        case "ollama":
            return Ollama;
        case "openai":
            return OpenAI;
        case "claude":
            return Claude;
        default:
            return null;
    }
}
