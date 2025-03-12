export function createRenderer(container: HTMLElement) {
    return {
        write(md: string) {
            container.innerText += md;
        },
    };
}
