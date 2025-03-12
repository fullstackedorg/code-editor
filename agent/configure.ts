import { Button, InputText, Loader, Message } from "@fullstacked/ui";
import { initOllama } from "./ollama";

export function configureForm(
    didConnect: (endpoint: string) => void,
    defaultValue = "http://localhost:11434",
) {
    const form = document.createElement("form");
    form.classList.add("agent-configure");

    form.innerHTML = "<h3>Connect to Ollama</h3>";

    const endpointInput = InputText({
        label: "Endpoint",
    });
    endpointInput.input.value = defaultValue;

    const connectButton = Button({
        text: "Connect",
    });

    form.append(endpointInput.container, connectButton);

    let message: ReturnType<typeof Message> = null;
    form.onsubmit = async (e) => {
        e.preventDefault();
        message?.remove();
        if (endpointInput.input.value === "") {
            return;
        }

        connectButton.disabled = true;

        const loader = Loader();
        form.append(loader);
        const loaderText = document.createElement("div");
        loaderText.className = "loader-text";
        loaderText.innerText = "Testing Connection...";
        form.append(loaderText);

        if (await initOllama(endpointInput.input.value)) {
            didConnect(endpointInput.input.value);
        } else {
            message = Message({
                style: "warning",
                text: "Failed to connect",
            });
            form.append(message);
        }

        loader.remove();
        loaderText.remove();

        connectButton.disabled = false;
    };

    return form;
}
