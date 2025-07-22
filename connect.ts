import { connect } from "connect";

const langChainChannel = await connect("langchain", 8888);

const activeStreaming = new Map<
    number,
    (part: { chunk: string; done: boolean }) => void
>();

langChainChannel.on(([chatId, chunk, done]: [number, string, boolean]) => {
    activeStreaming.get(chatId)?.({ chunk, done });
    activeStreaming.delete(chatId);
});

export function agentAsk(prompt: string): Promise<AsyncIterable<string>> {
    const chatId = Math.floor(Math.random() * 100000);

    return new Promise((resolve) => {
        let finished = false;
        const read = async () => {
            if (finished) {
                return { done: true };
            }

            const { done, chunk } = await new Promise<{
                done: boolean;
                chunk: string;
            }>((res) => {
                activeStreaming.set(chatId, res);
            });
            finished = done;

            return { done: false, value: chunk };
        };

        const it = {
            next: read,
        } as AsyncIterator<string>;

        langChainChannel.send(chatId, prompt);

        resolve({
            [Symbol.asyncIterator]() {
                return it;
            },
        });
    });
}
