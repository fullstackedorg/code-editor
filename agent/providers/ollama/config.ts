export const ollamaId = "ollama" as const;

export type OllamaConfiguration = {
    type: typeof ollamaId;
    host: string;
    extraHeaders?: Record<string, string>;
};
