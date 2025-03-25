import { providers } from "./providers";
import Editor from "../editor";
import { createConfigurator } from "./configure";
import {
    AgentConversationMessages,
    AgentProvider,
    AgentProviderGeneric,
} from "./providers/agentProvider";

export type ProviderAndModel = {
    provider: AgentProviderGeneric;
    model: string;
};

export function createAgent(editorInstance: Editor) {
    AgentProvider.editorInstance = editorInstance;

    const configurations = editorInstance.opts.agentConfigurations;
    if (configurations?.length) {
        for (const configWithUses of configurations) {
            const provider = providers.find(
                ({ id }) => id === configWithUses.type,
            ) as AgentProviderGeneric;
            const { uses, ...config } = configWithUses;
            provider?.configure(config);
            uses?.forEach(
                (u) => (AgentProvider.lastUsedProviders[u] = provider),
            );
        }
    }

    const getConfiguredProviders = () => {
        return providers.filter(({ client }) => !!client);
    };

    return {
        get configurator() {
            return createConfigurator(() =>
                editorInstance.updatedAgentConfiguration(),
            );
        },

        api: {
            get configurations() {
                return getConfiguredProviders().map((p) => {
                    const uses = [];

                    Object.entries(AgentProvider.lastUsedProviders).forEach(
                        ([u, pp]) => {
                            if (pp === p) {
                                uses.push(u);
                            }
                        },
                    );

                    return {
                        uses,
                        ...p.config,
                    };
                });
            },
            get providers() {
                return getConfiguredProviders();
            },
            complete(
                prompt: string,
                suffix: string,
                opts?: Partial<ProviderAndModel>,
            ) {
                const provider =
                    opts?.provider ||
                    getConfiguredProviders().find((p) => !!p.completion);

                return provider.completion(
                    prompt,
                    suffix,
                    opts?.model ||
                        (provider.defaultModels as Record<string, string>)
                            .completion,
                );
            },
            ask(
                messages: AgentConversationMessages,
                stream: boolean,
                opts?: Partial<ProviderAndModel>,
            ) {
                const provider =
                    opts?.provider ||
                    getConfiguredProviders().find((p) => !!p.chat);

                const chatResponse = provider.chat(
                    messages,
                    opts?.model || provider.defaultModels.chat,
                );
                if (stream) {
                    return chatResponse;
                }
                return new Promise(async (resolve) => {
                    let fullTextResponse = "";
                    const stream = await chatResponse;
                    for await (const chunk of stream) {
                        fullTextResponse += chunk;
                    }
                    resolve(fullTextResponse);
                });
            },
        },
    };
}
