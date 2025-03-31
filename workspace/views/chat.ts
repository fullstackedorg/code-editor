import { Button, Icon, InputSelect, InputText } from "@fullstacked/ui";
import { WorkspaceItem, WorkspaceItemType } from ".";
import Editor from "../../editor";
import { ProviderAndModel } from "../../agent";
import * as smd from "streaming-markdown";
import {
    languageHighlightExtension,
    languageToFileExtension,
} from "../../codemirror/languages";
import { createCmView } from "../../codemirror/view";
import {
    AGENT_USE,
    AgentConversationMessages,
    AgentProvider,
} from "../../agent/providers/agentProvider";
import { Code } from "./code";
import type f from "filenamify";
//@ts-ignore
import ff from "filenamify/browser";

const filenamify: typeof f = ff;

type AgentMessagesWithProvider = (AgentConversationMessages[0] & {
    provider?: string;
    model?: string;
})[];

export class Chat extends WorkspaceItem {
    type = WorkspaceItemType.chat;

    static lastProviderUsed: ProviderAndModel = null;

    constructor() {
        super("New Chat");

        // make sure providers opts are loaded
        WorkspaceItem.editorInstance.getAgent();
    }

    loadContents(contents: string) {
        if(contents) return;

        this.messages = JSON.parse(contents) as AgentMessagesWithProvider;
        
    };
    replaceContents: undefined;

    icon() {
        const chatIconContainer = document.createElement("div");
        chatIconContainer.classList.add("chat-icon");
        chatIconContainer.append(Icon("Glitter"));
        return chatIconContainer;
    }

    scrollTop: number;
    conversationContainer: HTMLDivElement;
    stash() {
        this.scrollTop = this.conversationContainer.scrollTop;
    }
    private streaming = false;
    restore() {
        if (!this.streaming) {
            this.notify(false);
        }
        this.conversationContainer.scrollTo(0, this.scrollTop);
    }

    override title() {
        const title = this.name.split("/").pop();
        if (title.endsWith(".chat")) {
            return super.title(title.slice(0, 0 - ".chat".length));
        }

        return super.title();
    }

    private updated(messages: AgentMessagesWithProvider) {
        if (this.name === "New Chat") return;

        WorkspaceItem.editorInstance.fileUpdated(
            this.name,
            JSON.stringify(messages),
        );
    }

    prompt: (message: string) => void;
    render() {
        const provider =
            Chat.lastProviderUsed ||
            getFirstProviderAvailable("chat", WorkspaceItem.editorInstance);

        const { container, conversation, promptAgent } = createChatView(
            WorkspaceItem.editorInstance,
            provider,
            (provider) => (Chat.lastProviderUsed = provider),
            {
                setTitle: async (title) => {
                    const sanitized = filenamify(title) + ".chat";
                    let validName =
                        WorkspaceItem.editorInstance.opts?.createNewFileName?.(
                            sanitized,
                        ) || sanitized;
                    if (validName instanceof Promise) {
                        validName = await validName;
                    }
                    this.name = validName;
                    this.title();
                },
                onStreamStart: () => {
                    this.notify(true, true);
                    this.streaming = true;
                },
                onStreamEnd: (messages) => {
                    this.streaming = false;
                    const focused =
                        WorkspaceItem.editorInstance.getWorkspace()?.item
                            ?.current?.workspaceItem === this;
                    if (focused) {
                        this.notify(false);
                    } else {
                        this.notify(true);
                    }
                    this.updated(messages);
                },
            },
        );

        this.conversationContainer = conversation;
        this.prompt = promptAgent;
        return container;
    }
    destroy() {}
}

export function getFirstProviderAvailable(
    use: AGENT_USE,
    editorInstance: Editor,
): ProviderAndModel {
    const firstAvailableProvider =
        AgentProvider.lastUsedProviders[use] ||
        editorInstance.getAgent().providers.find((p) => !!p[use]);

    if (!firstAvailableProvider) return null;

    return {
        provider: firstAvailableProvider,
        model:
            firstAvailableProvider?.config?.models?.[use] ||
            firstAvailableProvider.defaultModels[use],
    };
}

export function renderProviderInfos(provider: ProviderAndModel) {
    const providerInfos = document.createElement("div");
    providerInfos.classList.add("infos");
    const providerName = document.createElement("div");
    providerName.innerText = provider?.provider?.name;
    const providerModel = document.createElement("div");
    providerModel.innerText = provider?.model;
    providerInfos.append(providerName, providerModel);
    return providerInfos;
}

type ChatViewCallbacks = {
    setTitle(title: string): void | Promise<void>;
    onStreamStart(): void;
    onStreamEnd(messages: AgentMessagesWithProvider): void;
};

function createChatView(
    editorInstance: Editor,
    provider: ProviderAndModel,
    didSwitchProvider: (provider: ProviderAndModel) => void,
    cb: ChatViewCallbacks,
) {
    const messages: AgentMessagesWithProvider = [];

    const container = document.createElement("div");
    container.classList.add("workspace-view-chat");
    const clearContainer = () =>
        Array.from(container.children).forEach((c) => c.remove());

    const conversation = document.createElement("div");
    conversation.classList.add("conversation");

    const addUserMessage = (prompt: string) => {
        const userMessage = document.createElement("div");
        userMessage.classList.add("message-box", "user");
        userMessage.innerText = prompt;
        conversation.append(userMessage);
        messages.push({
            role: "user",
            content: prompt,
        });
    };

    const addAgentMessage = async (
        agentResponse: Promise<AsyncIterable<string>>,
    ) => {
        const firstResponse =
            messages.filter(({ role }) => role === "agent").length === 0;

        const agentMessage = document.createElement("div");
        agentMessage.classList.add("message-box", "agent");
        conversation.append(agentMessage);

        const streamOrString = await agentResponse;

        // for error messages
        if (typeof streamOrString === "string") {
            agentMessage.innerText = streamOrString;
            return;
        }

        const agentMessageText = {
            role: "agent" as const,
            content: "",
            provider: provider.provider.id,
            model: provider.model,
        };

        messages.push(agentMessageText);

        const renderer = createMarkdownStreamRenderer(
            editorInstance,
            provider,
            agentMessage,
        );

        let didUpdateTitle = false;
        const updateTitle = async () => {
            if (!firstResponse || didUpdateTitle) return;
            didUpdateTitle = true;
            const title = await editorInstance.getAgent().ask(
                [
                    ...messages,
                    {
                        role: "user",
                        content:
                            "In less than 5 words, no markdown, text-only, what is the subject?",
                    },
                ],
                false,
                provider,
            );
            await cb.setTitle(title);
        };

        for await (const chunk of streamOrString) {
            agentMessageText.content += chunk;
            renderer.write(chunk);

            if (agentMessageText.content.length > 100) {
                updateTitle();
            }
        }
        renderer.end();
        await updateTitle();

        cb.onStreamEnd(messages);
    };

    const promptAgent = (message: string) => {
        cb.onStreamStart();
        addUserMessage(message);
        const agentResponse = editorInstance
            .getAgent()
            .ask(messages, true, provider);
        addAgentMessage(agentResponse);
    };

    const renderConversationView = () => {
        clearContainer();

        const top = document.createElement("div");
        top.classList.add("agent-provider");

        const settingsButton = Button({
            iconRight: "Settings",
            style: "icon-small",
        });

        settingsButton.onclick = () => {
            clearContainer();
            container.append(
                renderProviderAndModelForm(
                    "chat",
                    editorInstance,
                    provider,
                    (p) => {
                        provider = p;
                        didSwitchProvider(provider);
                        renderConversationView();
                    },
                ),
            );
        };

        top.append(renderProviderInfos(provider), settingsButton);

        const form = document.createElement("form");
        const prompt = InputText({
            label: "Prompt",
        });
        form.append(prompt.container);
        form.onsubmit = (e) => {
            e.preventDefault();
            promptAgent(prompt.input.value);

            prompt.input.value = "";
        };

        container.append(top, conversation, form);
    };

    renderConversationView();
    return {
        container,
        conversation,
        promptAgent,
    };
}

export function renderProviderAndModelForm(
    use: AGENT_USE,
    editorInstance: Editor,
    provider: ProviderAndModel,
    didSwitchProvider: (provider: ProviderAndModel) => void,
) {
    const form = document.createElement("form");
    form.classList.add("provider-and-model");

    const providersSelect = InputSelect({
        label: "Provider",
    });

    const availableProviders = editorInstance
        .getAgent()
        .providers.filter((p) => !!p[use]);
    const chatProvidersOpts = availableProviders.map((p) => ({
        name: p.name,
        selected: p === provider.provider,
    }));
    providersSelect.options.add(...chatProvidersOpts);

    const modelsSelectContainer = document.createElement("div");
    let modelsSelect: ReturnType<typeof InputSelect>;

    providersSelect.select.onchange = () => {
        modelsSelect = null;
        Array.from(modelsSelectContainer.children).forEach((c) => c.remove());

        const p = availableProviders.find(
            (p) => p.name === providersSelect.select.value,
        );

        if (!p) return;

        modelsSelect = InputSelect({
            label: "Models",
        });
        modelsSelectContainer.append(modelsSelect.container);

        p.models().then((models) => {
            const modelsOptions = models.map((m) => ({
                name: m,
                selected:
                    provider.provider === p
                        ? m === provider.model
                        : m === p.defaultModels[use],
            }));

            modelsSelect.options.add(...modelsOptions);
        });
    };
    providersSelect.select.onchange();

    const cancelButton = Button({
        text: "Cancel",
        style: "text",
    });

    const saveButton = Button({
        text: "Save",
    });

    cancelButton.onclick = () => {
        didSwitchProvider(provider);
    };
    saveButton.onclick = () => {
        const updatedProvider = {
            provider: availableProviders.find(
                (p) => p.name === providersSelect.select.value,
            ),
            model: modelsSelect.select.value,
        };
        updatedProvider.provider.setModel(use, updatedProvider.model);
        didSwitchProvider(updatedProvider);
    };

    const buttons = document.createElement("div");
    buttons.append(cancelButton, saveButton);

    form.append(providersSelect.container, modelsSelectContainer, buttons);

    form.onsubmit = (e) => {
        e.preventDefault();
    };

    return form;
}

function createMarkdownStreamRenderer(
    editorInstance: Editor,
    provider: ProviderAndModel,
    el: HTMLElement,
) {
    const renderer = smd.default_renderer(el);
    const defaultAddToken = renderer.add_token;
    renderer.add_token = function (data: any, type: any) {
        if (type !== 9 && type !== 10) {
            return defaultAddToken(data, type);
        }

        let parent = data.nodes[data.index];
        const codeView = createCmView() as ReturnType<typeof createCmView> & {
            setAttribute(attr: string, value: string): void;
            appendChild(text: Text): void;
            lang: string;
        };
        codeView.editing.lock();
        codeView.setAttribute = async function (attr, value) {
            if (attr !== "class") return;
            codeView.lang = value;
            const highlightExtension = await languageHighlightExtension(value);
            codeView.extensions.add(highlightExtension);
        };
        codeView.appendChild = (text) => {
            codeView.editorView.dispatch({
                changes: {
                    from: codeView.editorView.state.doc.length,
                    insert: text.wholeText,
                },
            });
        };
        codeView.container.classList.add("read-only");
        parent = parent.appendChild(codeView.container);

        const actions = document.createElement("div");
        actions.classList.add("actions");
        const copyToClipButton = Button({
            iconRight: "Clipboard",
            style: "icon-small",
        });
        copyToClipButton.onclick = () => {
            copyToClip(codeView.value);
        };
        actions.append(copyToClipButton);

        const createFileButton = Button({
            iconRight: "File Add",
            style: "icon-small",
        });
        createFileButton.onclick = async () => {
            const text = codeView.value;
            const lang = codeView.lang;
            const fileExtension = languageToFileExtension(lang);

            const placeholderName = "new-file." + fileExtension;
            const code = new Code(placeholderName);

            const validateAndRename = async (name: string) => {
                code.preventUpdates(true);
                let validName =
                    editorInstance.opts?.createNewFileName?.(name) || name;
                if (validName instanceof Promise) {
                    validName = await validName;
                }
                code.rename(validName);
                code.preventUpdates(false);
            };

            const createSummarizedName = async () => {
                const summarized = await editorInstance.getAgent().ask(
                    [
                        {
                            role: "user",
                            content: `Summarize in one word only what this code is about, no markdown: ${text}`,
                        },
                    ],
                    false,
                    provider,
                );
                const filename =
                    summarized.split(".").shift().toLowerCase().trim() +
                    "." +
                    languageToFileExtension(lang);
                await validateAndRename(filename);
            };

            validateAndRename(placeholderName).then(createSummarizedName);

            editorInstance.getWorkspace().item.add(code);
            code.init(text);
        };
        actions.append(createFileButton);

        codeView.container.append(actions);

        data.nodes[++data.index] = codeView;
    };
    const parser = smd.parser(renderer);
    return {
        write(md: string) {
            smd.parser_write(parser, md);
        },
        end() {
            smd.parser_end(parser);
        },
    };
}

function copyToClip(text: string) {
    var input = document.createElement("textarea");
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
}
