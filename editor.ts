import { Extension } from "@codemirror/state";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";
import { AgentConfigWithUses } from "./agent/providers/agentProvider";

type EditorOpts = {
    agentConfigurations?: AgentConfigWithUses[];
    codemirrorExtraExtensions?(filename: string): Extension[];
    setiFontLocation?: string;
    validateNewFileName?(currentName: string, suggestedName: string): string | Promise<string>;
};

type AgentConfigurationUpdate = Event & {
    agentConfigurations: AgentConfigWithUses[];
};
type FileUpdateEvent = Event & {
    fileUpdate: {
        name: string;
        contents: string | Uint8Array;
    };
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
    addEventListener(
        event: "file-update",
        callback: (e: FileUpdateEvent) => void,
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

    fileUpdated(name: string, contents: string | Uint8Array) {
        if (!name) return;
        const e = new Event("file-update") as FileUpdateEvent;
        e.fileUpdate = { name, contents };
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
