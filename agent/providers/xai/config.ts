export const xAiId = "xai" as const;

export type XAIConfiguration = {
    type: typeof xAiId;
    apiKey: string;
};

