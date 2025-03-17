import { Extension } from "@codemirror/state";
import { AgentConfiguration } from "./agent/configurations";
import { createWorkspace } from "./workspace";
import { createAgent } from "./agent";
import { createPrompt } from "./agent/prompt";

type EditorOpts = {
    agentConfigurations?: AgentConfiguration[];
    codemirrorExtraExtensions?(filename: string): Extension[];
};

type EditorAPI = {
    workspace: HTMLElement;
    agent: HTMLElement;
    prompt: HTMLElement;

    openFile(filename: string, contents: string): void;
    closeFile(filename: string): void;
    getFileContents(filename: string): string;
    goTo(filename: string, line: number, col: number): void;
    askAgent(text: string): void;
};

export function createEditor(opts: EditorOpts): EditorAPI {
    const workspace = createWorkspace();
    const agent = createAgent();
    const prompt = createPrompt();

    return {
        workspace,
        agent,
        prompt,

        
    };
}
