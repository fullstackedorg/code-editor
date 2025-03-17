import { Button } from "@fullstacked/ui";
import { AgentConfiguration, AgentProvider, providers } from "./providers";

export function createAgentConfigure() {
    const container = document.createElement("div");

    const select = document.createElement("select");
    const options = providers.map(({ name }, i) => {
        const option = document.createElement("option");
        option.value = i.toString();
        option.innerText = name;
        return option;
    });

    select.append(...options);

    container.append(select);

    let selectedProvider: AgentProvider;
    let providerForm: HTMLFormElement;

    const setProviderForm = () => {
        const indexOf = parseInt(select.value);
        selectedProvider = providers.at(indexOf);
        const f = selectedProvider.form();
        if (providerForm) {
            providerForm.replaceWith(f);
        } else {
            container.append(f);
        }
        providerForm = f;
    };
    select.onchange = setProviderForm;
    setProviderForm();

    const testButton = Button({
        text: "Test",
        style: "text",
    });
    testButton.onclick = async () => {
        testButton.disabled = true;
        saveButton.disabled = true;

        const config = formToObj(providerForm);
        selectedProvider.test(config);

        testButton.disabled = false;
        saveButton.disabled = false;
    };

    const saveButton = Button({
        text: "Save",
    });

    const buttons = document.createElement("div");
    buttons.append(testButton, saveButton);
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
