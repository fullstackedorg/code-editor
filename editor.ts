import { Extension } from "@codemirror/state";

type OpenAIConfiguration = {
    type: "openai"
    apikey: string
}

type OllamaConfiguration = {
    type: "ollama"
    host: string,
    extraHeaders?: Record<string, string>
}

type AgentConfiguration = OllamaConfiguration | OpenAIConfiguration

type EditorOpts = {
    codeEditorContainer: HTMLElement;
    agentConversationContainer: HTMLElement;
    agentConfigurations?: AgentConfiguration[];
    codemirrorExtraExtensions?(filename: string): Extension[];
};

type EditorAPI = {
    openFile(filename: string, contents: string): void;
    closeFile(filename: string): void;
    getFileContents(filename: string): string;
    goTo(filename: string, line: number, col: number): void;
    promptAgent(text: string): void;
};

export function createEditor(opts: EditorOpts): EditorAPI {
     
}
