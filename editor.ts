import { Extension } from "@codemirror/state";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";
import {
    AGENT_USE,
    AgentConfigWithUses,
} from "./agent/providers/agentProvider";

type EditorOpts = {
    agentUses?: AGENT_USE[];
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
        e.agentConfigurations = this.agent.api.configurations;
        this.dispatchEvent(e);
    }

    getAgent() {
        if (this.agent === undefined) {
            this.agent = createAgent(this);
        }

        return this.agent.api as Editor["agent"]["api"] & {
            ask(text: string, chat: false): Promise<string>;
            ask(text: string, chat: true): void;
        }
    }

    getWorkspaceFiles(){
        return this.workspace?.files
    }
}
