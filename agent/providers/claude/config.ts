export const claudeId = "claude" as const;

export type ClaudeConfiguration = {
    type: typeof claudeId;
    apiKey: string;
    maxToken: number;
};
