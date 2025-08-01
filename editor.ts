import { createFilesControls } from "./files";

await new Promise((res) => setTimeout(res, 1));

export function createCodeEditor() {
    const element = document.createElement("div");
    element.classList.add("code-editor");

    let activeElement: HTMLElement = null;
    const setActiveElement = (el: HTMLElement) => {
        if (activeElement) {
            activeElement.replaceWith(el);
        } else {
            rightContainer.append(el);
        }
        activeElement = el;
    };

    const filesControls = createFilesControls({
        setActiveElement,
    });

    const rightContainer = document.createElement("div");

    element.append(filesControls.element, rightContainer);

    return {
        element,
    };
}
