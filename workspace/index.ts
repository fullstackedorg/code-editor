import { createCmView } from "../codemirror/view";
import Editor from "../editor";
import { createTabs } from "./ tabs";

type WorkspaceFile = {
    name: string;
    view: ReturnType<typeof createCmView>;
};

export function createWorkspace(editorInstance: Editor) {
    const container = document.createElement("div");

    const files: WorkspaceFile[] = [];

    const tabs = createTabs();
    container.append(tabs);

    container.innerText = "WORKSPACE";

    return {
        container,
        files: {
            get() {
                return files;
            },
            add(name: string, contents: string) {
                
                files.push({
                    name,
                    view: createCmView({
                        contents,
                        extensions:
                            editorInstance.opts.codemirrorExtraExtensions?.(
                                name,
                            ),
                    }),
                });
            },
            remove(name: string) {
                const indexOf = files.findIndex((f) => f.name === name);
                if (indexOf === -1) return;
                files.splice(indexOf, 1);
            },
        },
    };
}
