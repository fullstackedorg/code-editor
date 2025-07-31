import { createCodeMirrorView } from "@fullstacked/codemirror-view";
import { createFileTree } from "@fullstacked/file-tree";

export function createCodeEditor() {
    const element = document.createElement("div");
    element.classList.add("code-editor")

    const fileTree = createFileTree({
        readDirectory: () => [
            {
                isDirectory: true,
                name: "directory",
            },
            {
                isDirectory: false,
                name: "file1.txt",
            },
            {
                isDirectory: false,
                name: "file2.txt",
            },
            {
                isDirectory: false,
                name: "file3.txt",
            },
        ],
        isDirectory: () => false,
    });
    const cmView = createCodeMirrorView();

    element.append(fileTree.container, cmView.element);

    return {
        element,
    };
}
