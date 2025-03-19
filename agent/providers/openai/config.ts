export const openAiId = "openai" as const;

export type OpenAIConfiguration = {
    type: typeof openAiId;
    apiKey: string;
};
