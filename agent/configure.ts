import { Button, InputSelect, Message } from "@fullstacked/ui";
import { AgentProviderGeneric } from "./providers/agentProvider";
import { providers } from "./providers";

export function createConfigurator(
    didConfigureProvider: (provider: AgentProviderGeneric) => void,
) {
    const container = document.createElement("div");
    container.classList.add("agent-configure");

    container.append(configureAgentProviders(didConfigureProvider));

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