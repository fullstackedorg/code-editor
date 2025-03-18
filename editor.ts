import { Extension } from "@codemirror/state";
import { AgentConfiguration } from "./agent/providers";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";

type EditorOpts = {
    agentConfigurations?: AgentConfiguration[];
    codemirrorExtraExtensions?(filename: string): Extension[];
};

type AgentConfigurationUpdate = Event & {
    agentConfigurations: AgentConfiguration[];
};

export default class Editor extends EventTarget {
    private workspace: ReturnType<typeof createWorkspace>;
    private agent: ReturnType<typeof createAgent>;
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
    hasWorkspace() {
        return !!this.workspace;
    }

    getAgentElement(e: "configure" | "conversation" | "prompt") {
        if (this.agent === undefined) {
            this.agent = createAgent(this);
        }
        return this.agent[e];
    }

    addEventListener(
        event: "agent-configuration-update",
        callback: (e: AgentConfigurationUpdate) => void,
    ): void;
    addEventListener(e: string, cb: (e: any) => void): void {
        super.addEventListener(e, cb);
    }

    updatedAgentConfiguration() {
        if (!this.agent) return;
        const e = new Event(
            "agent-configuration-update",
        ) as AgentConfigurationUpdate;
        e.agentConfigurations = this.agent.getConfigurations();
        this.dispatchEvent(e);
    }

    promptAgent(text: string, chat: boolean): void {
        if (!this.agent) {
            this.agent = createAgent(this);
        }

        this.agent.ask(text, chat);
    }

    openFile(filename: string, contents: string): void {}
    closeFile(filename: string): void {}
    getFileContents(filename: string): string {}
    goTo(filename: string, line: number, col: number): void {}
}
