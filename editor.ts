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
    setiFontLocation?: string;
    validateNewFileName?(suggestedName: string): string;
};

type AgentConfigurationUpdate = Event & {
    agentConfigurations: AgentConfigWithUses[];
};

export default class Editor extends EventTarget {
    private workspace: ReturnType<typeof createWorkspace>;
    private agent: ReturnType<typeof createAgent>;
    opts: EditorOpts;

    constructor(opts?: EditorOpts) {
        super();
        this.opts = opts;
    }

    get workspaceElement() {
        this.workspace = createWorkspace(this);
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

        return this.agent.api;
    }
    getWorkspace() {
        return this.workspace?.api as Editor["workspace"]["api"] & {
            file: Editor["workspace"]["api"]["file"] & {
                open(name: string, contents: Uint8Array): void;
                open(name: string, contents: string): void;
                open(name: string, contents: Promise<string>): Promise<void>;
                open(
                    name: string,
                    contents: Promise<Uint8Array>,
                ): Promise<void>;
            };
        };
    }
}

export { Chat } from "./workspace/views/chat";
export { AgentConfigWithUses } from "./agent/providers/agentProvider";
