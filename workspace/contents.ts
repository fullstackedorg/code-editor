const td = new TextDecoder();
const te = new TextEncoder();

export function uint8ToStr(contents: Uint8Array | string): string {
    if (contents instanceof Uint8Array) {
        return td.decode(contents);
    } else if (typeof contents === "string") {
        return contents;
    }
    throw "Received neither Uint8Array or string";
}

export function strToUint8(contents: Uint8Array<ArrayBuffer> | string): Uint8Array<ArrayBuffer> {
    if (contents instanceof Uint8Array) {
        return contents;
    } else if (typeof contents === "string") {
        return te.encode(contents);
    }
    throw "Received neither Uint8Array or string";
}
