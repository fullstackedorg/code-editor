import { providers } from "./providers";
import Editor from "../editor";
import { createConfigure } from "./configure";
import { createPrompt } from "./prompt";
import { createConversation } from "./conversation";
import { AGENT_USE, AgentProviderGeneric } from "./providers/agentProvider";

export function createAgent(editorInstance: Editor) {
    const currentProviders: { [key: string]: AgentProviderGeneric } = {};
    let configure: ReturnType<typeof createConfigure>;
    let conversation: ReturnType<typeof createConversation>;
    let prompt: ReturnType<typeof createPrompt>;

    const configurations = editorInstance.opts.agentConfigurations;
    if (configurations?.length) {
        for (const configWithUses of configurations) {
            const provider = providers.find(
                ({ id }) => id === configWithUses.type,
            ) as AgentProviderGeneric;
            const { uses, ...config } = configWithUses;
            provider?.configure(config);
            uses?.forEach((u) => (currentProviders[u] = provider));
        }
    }

    return {
        get configure() {
            if (!configure) {
                configure = createConfigure(
                    editorInstance.opts?.agentUses || ["chat"],
                    () => editorInstance.updatedAgentConfiguration(),
                    () => currentProviders,
                    (provider: AgentProviderGeneric, use: AGENT_USE) => {
                        currentProviders[use] = provider;
                        console.log(use, provider);
                        editorInstance.updatedAgentConfiguration();
                    },
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
            console.log(currentProviders);
            return providers
                .filter(({ client }) => !!client)
                .map((p) => {
                    const uses = [];

                    Object.entries(currentProviders).forEach(([u, pp]) => {
                        if (pp === p) {
                            uses.push(u);
                        }
                    });

                    return {
                        uses,
                        ...p.config,
                    };
                });
        },

        complete(prompt: string, suffix: string) {
            const completionProvider = currentProviders?.["completion"];
            if (!completionProvider) return;
            return completionProvider.completion(prompt, suffix);
        },
        ask(text: string, chat: boolean) {
            const chatProvider = currentProviders?.["chat"];
            if (!chatProvider) return;

            if (chat) {
                conversation?.addUserMessage(text);
                chatProvider
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
                            chatProvider.name,
                        ),
                    );
            } else {
                return chatProvider.chat([
                    {
                        role: "user",
                        content: text,
                    },
                ]);
            }
        },
    };
}
