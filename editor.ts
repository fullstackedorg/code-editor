import { Extension } from "@codemirror/state";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";
import { AGENT_USE, AgentConfigWithUses } from "./agent/providers/agentProvider";

type EditorOpts = {
    agentUses?: AGENT_USE[],
    agentConfigurations?: AgentConfigWithUses[];
    codemirrorExtraExtensions?(filename: string): Extension[];
};

type AgentConfigurationUpdate = Event & {
    agentConfigurations: AgentConfigWithUses[];
};

export default class Editor extends EventTarget {
    private workspace: ReturnType<typeof createWorkspace>;
    private agent: ReturnType<typeof createAgent>;
    opts: EditorOpts;

    constructor(opts: EditorOpts) {
        super();
        this.opts = opts;
    }

    get workspaceElement() {
        if (this.workspace === undefined) {
            this.workspace = createWorkspace(this);
        }
        return this.workspace.container;
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

    agentAsk(text: string, chat: true): void;
    // agentAsk(text: string, chat: false): Promise<AsyncIterator>;
    agentAsk(text: string, chat: boolean): void {
        if (!this.agent) {
            this.agent = createAgent(this);
        }

        this.agent.ask(text, chat);
    }
    agentComplete(prompt: string, suffix: string): Promise<string> {
        if (!this.agent) {
            this.agent = createAgent(this);
        }

        return this.agent.complete(prompt, suffix);
    }

    openFile(filename: string, contents: string): void {
        this.workspace?.files.add(filename, contents);
    }
    closeFile(filename: string): void {
        this.workspace?.files.remove(filename);
    }
    getFileContents(filename: string): string {}
    goTo(filename: string, line: number, col: number): void {}
}
