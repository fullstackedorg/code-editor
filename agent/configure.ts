import { Button, InputSelect, Message } from "@fullstacked/ui";
import { AgentConfiguration, AgentProvider, providers } from "./providers";

export function createConfigure(
    currentProvider: AgentProvider,
    configuredProvider: (provider: AgentProvider) => void,
) {
    const container = document.createElement("div");

    const inputSelect = InputSelect({
        label: "Agent Provider",
    });
    const options = providers.map((p) => ({
        name: p.name,
    }));

    inputSelect.options.add(...options);
    inputSelect.select.value = currentProvider?.name;
    container.append(inputSelect.container);

    let selectedProvider: AgentProvider;
    let providerForm: HTMLFormElement;

    let message: ReturnType<typeof Message> = document.createElement("div");
    const resetMessage = () => {
        const m = document.createElement("div");
        message.replaceWith(m);
        message = m;
    };

    const setProviderForm = () => {
        resetMessage();
        const selected = inputSelect.select.value;
        selectedProvider = providers.find((p) => p.name === selected);
        const f = selectedProvider.form();
        if (providerForm) {
            providerForm.replaceWith(f);
        } else {
            container.append(f);
        }
        providerForm = f;
        providerForm.onsubmit = (e) => {
            e.preventDefault();
        };
    };
    inputSelect.select.onchange = setProviderForm;
    setProviderForm();

    const testButton = Button({
        text: "Test",
        style: "text",
    });

    testButton.onclick = async () => {
        resetMessage();
        testButton.disabled = true;
        saveButton.disabled = true;

        const config = formToObj(providerForm);
        console.log(selectedProvider);
        const success = await selectedProvider.test(config);

        const m = success
            ? Message({
                  text: "Connection success",
              })
            : Message({
                  text: "Connection failed",
                  style: "warning",
              });
        message.replaceWith(m);
        message = m;

        testButton.disabled = false;
        saveButton.disabled = false;
    };

    const saveButton = Button({
        text: "Save",
    });
    saveButton.onclick = async () => {
        testButton.disabled = true;
        saveButton.disabled = true;

        const config = formToObj(providerForm);
        selectedProvider.configure(config);
        const m = Message({
            text: "Configuration saved",
        });
        message.replaceWith(m);
        message = m;
        configuredProvider(selectedProvider);

        testButton.disabled = false;
        saveButton.disabled = false;
    };

    const buttons = document.createElement("div");
    buttons.append(message, testButton, saveButton);
    container.append(buttons);

    return container;
}

function formToObj(form: HTMLFormElement): Partial<AgentConfiguration> {
    let obj = {};
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
        obj[key] = value;
    }

    return obj;
}
