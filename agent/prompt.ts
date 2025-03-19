import { InputText } from "@fullstacked/ui";
import Editor from "../editor";

export function createPrompt(editorInstance: Editor){
    const form = document.createElement("form");

    const promptInput = InputText({
        label: "Prompt"
    })

    form.append(promptInput.container);

    form.onsubmit = e => {
        e.preventDefault();

        const prompt = promptInput.input.value;

        if(!prompt) {
            return
        }
        
        editorInstance.agentAsk(prompt, true)
        promptInput.input.value = ""
    }
    
    return form;
}