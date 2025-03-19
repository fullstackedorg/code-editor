import { Button, InputSelect, Message } from "@fullstacked/ui";
import { AGENT_USE, AgentProviderGeneric } from "./providers/agentProvider";
import { providers } from "./providers";

export function createConfigure(
    uses: AGENT_USE[],
    didConfigureProvider: (provider: AgentProviderGeneric) => void,
    getCurrentProviders: () => { [use: string]: AgentProviderGeneric },
    didSelectModel: (provider: AgentProviderGeneric, use: AGENT_USE) => void,
) {
    const container = document.createElement("div");
    container.classList.add("agent-configure");

    let modelUseForms: HTMLFormElement[] = [];
    const renderModelSelectionForms = () => {
        const currentProviders = getCurrentProviders();
        const availableProviders = providers.filter((p) => !!p.client);
        uses.forEach((u, i) => {
            const f = availableProviders.find((p) => !!p[u])
                ? renderModelSelectionForm(u, currentProviders[u], (p) =>
                      didSelectModel(p, u),
                  )
                : document.createElement("form");

            if (modelUseForms[i]) {
                modelUseForms[i].replaceWith(f);
                modelUseForms[i] = f;
            } else {
                modelUseForms.push(f);
            }
        });
    };

    container.append(
        configureAgentProviders((p) => {
            didConfigureProvider(p);
            renderModelSelectionForms();
        }),
    );

    renderModelSelectionForms();
    container.append(...(modelUseForms || []));

    return container;
}

function configureAgentProviders(
    didConfigureProvider: (provider: AgentProviderGeneric) => void,
) {
    const container = document.createElement("div");

    container.innerHTML = `<h3>Configure agent providers</h3>`;

    let selectedProvider: AgentProviderGeneric = null;

    const inputSelect = InputSelect({
        label: "Agent Provider",
    });
    const options = providers.map((p) => ({
        name: p.name,
    }));

    inputSelect.options.add(...options);
    inputSelect.select.onchange = () => {
        selectedProvider = providers.find(
            (p) => p.name === inputSelect.select.value,
        );
        renderConnectionForm();
    };

    let connectionForm = document.createElement("form");
    container.append(inputSelect.container, connectionForm);

    const renderConnectionForm = () => {
        if (!selectedProvider) return;

        const providerForm = selectedProvider.form();

        connectionForm.replaceWith(providerForm.form);
        connectionForm = providerForm.form;

        const connectionActionRow = document.createElement("div");
        connectionActionRow.classList.add("agent-configure-action-row");
        let connectionStatus = document.createElement("div");
        const testButton = Button({
            text: "Test",
            style: "text",
        });
        const saveButton = Button({
            text: "Save",
        });

        connectionActionRow.append(connectionStatus, testButton, saveButton);
        connectionForm.append(connectionActionRow);

        testButton.onclick = async () => {
            connectionStatus.innerHTML = "";
            testButton.disabled = true;
            saveButton.disabled = true;

            const config = providerForm.value;
            const models = await selectedProvider.models(config);

            testButton.disabled = false;
            saveButton.disabled = false;

            const status = models
                ? Message({
                      text: "Connection success",
                  })
                : Message({
                      text: "Connection failed",
                      style: "warning",
                  });
            connectionStatus.replaceWith(status);
            connectionStatus = status;
        };

        saveButton.onclick = () => {
            connectionStatus.innerHTML = "";
            selectedProvider.configure(providerForm.value);
            didConfigureProvider(selectedProvider);
            const status = Message({
                text: "Configuration saved",
            });
            connectionStatus.replaceWith(status);
            connectionStatus = status;
        };
    };

    return container;
}

function renderModelSelectionForm(
    use: AGENT_USE,
    currentProvider: AgentProviderGeneric,
    didSelectModel: (provider: AgentProviderGeneric) => void,
) {
    const form = document.createElement("form");

    form.innerHTML = `<h3>Model for ${use}</h3>`;

    const providerSelect = InputSelect({
        label: "Agent Provider",
    });

    form.append(providerSelect.container);

    const optionsProviders = providers.filter((p) => p.client && !!p[use]);
    providerSelect.options.add(
        ...optionsProviders.map(({ name }) => ({ name })),
    );
    providerSelect.options.add({ name: "None", id: null });
    providerSelect.select.value = currentProvider?.name;

    let modelSelection = document.createElement("div");
    form.append(modelSelection);

    providerSelect.select.onchange = () => {
        modelSelection.innerHTML = "";
        const provider = optionsProviders.find(
            ({ name }) => name === providerSelect.select.value,
        );

        if (!provider) {
            didSelectModel(null);
            return;
        }

        const modelSelect = InputSelect({
            label: "Model",
        });
        modelSelect.select.onchange = () => {
            provider.setModel(use, modelSelect.select.value);
            didSelectModel(provider);
        };

        modelSelection.append(modelSelect.container);

        provider.models().then((models) => {
            if (models) {
                const providerUseModel =
                    provider.config?.models?.[use] ||
                    provider.defaultModels[use];

                const modelsOptions = models.map((name) => {
                    return {
                        name,
                        selected: providerUseModel === name,
                    };
                });

                modelSelect.options.add(...modelsOptions);
                modelSelect.select.onchange();
            } else {
                modelSelection.innerHTML = `Failed to get models for <b>${provider.name}</b>. Verify provider configuration.`;
            }
        });
    };
    providerSelect.select.onchange();

    return form;
}
