import { Extension } from "@codemirror/state";
import { AgentConfiguration } from "./agent/providers";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";
import { createPrompt } from "./agent/prompt";

type EditorOpts = {
    agentConfigurations?: AgentConfiguration[];
    codemirrorExtraExtensions?(filename: string): Extension[];
};

type UpdatedConfigEvent = Event & {
    agentConfigurations: AgentConfiguration[];
};

export default class Editor extends EventTarget {
    private workspace: ReturnType<typeof createWorkspace>;
    private agent: ReturnType<typeof createAgent>;
    private prompt: ReturnType<typeof createPrompt>;
    defaultOpts: EditorOpts;

    constructor(opts: EditorOpts) {
        super();
        this.defaultOpts = opts;
    }

    get workspaceElement() {
        if (this.workspace === undefined) {
            this.workspace = createWorkspace(this);
        }
        return this.workspace;
    }
    get agentElement() {
        if (this.agent === undefined) {
            this.agent = createAgent(this);
        }
        return this.agent.element;
    }
    get promptElement() {
        if (this.prompt === undefined) {
            this.prompt = createPrompt(this);
        }
        return this.prompt;
    }

    addEventListener(
        event: "updated-config",
        callback: (e: UpdatedConfigEvent) => void,
    ): void;
    addEventListener(e: string, cb: (e: any) => void): void {
        super.addEventListener(e, cb);
    }

    openFile(filename: string, contents: string): void {}
    closeFile(filename: string): void {}
    getFileContents(filename: string): string {}
    goTo(filename: string, line: number, col: number): void {}
    askAgent(text: string): void {
        if(!this.agent) {
            this.agent = createAgent(this, this.defaultOpts.agentConfigurations);
        }
    }
}
