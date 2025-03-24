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
import { EditorView } from "codemirror";
import {
    AGENT_USE,
    AgentConversationMessages,
    AgentProvider,
} from "../../agent/providers/agentProvider";

export class Chat extends WorkspaceItem {
    type = WorkspaceItemType.chat;

    static lastProviderUsed: ProviderAndModel = null;
    provider: ProviderAndModel;

    id: string;
    nameContainer = document.createElement("div");
    constructor() {
        super();
        this.id = makeid(6);
        this.nameContainer.innerText = "New Chat";
    }

    equals(item: Chat) {
        return this.id === item?.id;
    }

    icon() {
        const chatIconContainer = document.createElement("div");
        chatIconContainer.classList.add("chat-icon");
        chatIconContainer.append(Icon("Glitter"));
        return chatIconContainer;
    }
    name() {
        return this.nameContainer;
    }

    scroll: { top: number; left: number };
    stash() {}
    restore() {}

    render() {
        const provider =
            Chat.lastProviderUsed ||
            getFirstProviderAvailable("chat", WorkspaceItem.editorInstance);

        return createChatView(
            WorkspaceItem.editorInstance,
            provider,
            (provider) => (Chat.lastProviderUsed = provider),
            (title) => (this.nameContainer.innerText = title),
        );
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

function createChatView(
    editorInstance: Editor,
    provider: ProviderAndModel,
    didSwitchProvider: (provider: ProviderAndModel) => void,
    setTitle: (title: string) => void,
) {
    const messages: AgentConversationMessages = [];

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
            role: "agent",
            content: "",
        } as AgentConversationMessages[0];

        messages.push(agentMessageText);

        const renderer = createMarkdownStreamRenderer(
            editorInstance,
            provider,
            agentMessage,
        );

        let didUpdateTitle = false;
        const updateTitle = () => {
            if (!firstResponse || didUpdateTitle) return;
            didUpdateTitle = true;
            editorInstance
                .getAgent()
                .ask(
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
                )
                .then(setTitle);
        };

        for await (const chunk of streamOrString) {
            agentMessageText.content += chunk;
            renderer.write(chunk);

            if (agentMessageText.content.length > 100) {
                updateTitle();
            }
        }
        renderer.end();
        updateTitle();
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
            addUserMessage(prompt.input.value);
            prompt.input.value = "";

            const agentResponse = editorInstance
                .getAgent()
                .ask(messages, true, provider);
            addAgentMessage(agentResponse);
        };

        container.append(top, conversation, form);
    };

    renderConversationView();
    return container;
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
        const codeView = createCmView({
            contents: "",
            extensions: [EditorView.editable.of(false)],
        }) as ReturnType<typeof createCmView> & {
            setAttribute(attr: string, value: string): void;
            appendChild(text: Text): void;
            lang: string;
        };
        codeView.setAttribute = async function (attr, value) {
            if (attr !== "class") return;
            codeView.lang = value;
            const highlightExtension = await languageHighlightExtension(value);
            if (highlightExtension) {
                codeView.addExtension(highlightExtension);
            }
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
            editorInstance.getWorkspace().addFile(filename, text);
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

function makeid(length) {
    let result = "";
    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
        counter += 1;
    }
    return result;
}
