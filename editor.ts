import { Extension } from "@codemirror/state";
import { createWorkspace } from "./workspace";
import { createAgent, ProviderAndModel } from "./agent";
import {
    AgentConfigWithUses,
    AgentConversationMessages,
} from "./agent/providers/agentProvider";

type EditorOpts = {
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
    get agentConfigurator() {
        if (this.agent === undefined) {
            this.agent = createAgent(this);
        }
        return this.agent.configurator;
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
            ask(
                messages: AgentConversationMessages,
                stream: false,
                opts?: Partial<ProviderAndModel>,
            ): Promise<string>;
            ask(
                messages: AgentConversationMessages,
                stream: true,
                opts?: Partial<ProviderAndModel>,
            ): Promise<AsyncIterable<string>>;
        };
    }
    getWorkspace() {
        if (this.workspace === undefined) {
            this.workspace = createWorkspace(this);
        }

        return this.workspace.api;
    }
}

export { Chat } from "./workspace/views/chat";
export { AgentConfigWithUses } from "./agent/providers/agentProvider";
