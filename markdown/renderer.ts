enum SPECIAL_CHAR {
    SPACE = " ",
    NEW_LINE = "\n",
    STAR = "*",
    CODE_QUOTE = "`",
    UNDERSCORE = "_",
    HASHTAG = "#",
}

enum STATE {
    STAR_1,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    CODE_1,
    CODE_2,
    CODE_3,
}

export function createRenderer(container: HTMLElement) {
    let currentElement = container;
    let state: STATE = null;

    return {
        write(md: string) {
            for (const char of md) {
                if (
                    char === SPECIAL_CHAR.NEW_LINE &&
                    currentElement.tagName !== "PRE"
                ) {
                    currentElement = container;
                    continue;
                }

                if (currentElement === container) {
                    const p = document.createElement("p");
                    currentElement.append(p);
                    currentElement = p;
                }

                if (char === SPECIAL_CHAR.STAR) {
                    if (state === null) {
                        state = STATE.STAR_1;
                    } else {
                        if (currentElement.tagName === "STRONG") {
                            currentElement = currentElement.parentElement;
                        } else {
                            const strong = document.createElement("strong");
                            currentElement.append(strong);
                            currentElement = strong;
                        }
                        state = null;
                    }
                    continue;
                } else if (char === SPECIAL_CHAR.UNDERSCORE) {
                    if (currentElement.tagName === "EM") {
                        currentElement = currentElement.parentElement;
                    } else {
                        const em = document.createElement("em");
                        currentElement.append(em);
                        currentElement = em;
                    }
                    continue;
                } else if (char === SPECIAL_CHAR.CODE_QUOTE) {
                    if (currentElement.tagName === "CODE") {
                        currentElement = currentElement.parentElement;
                        state = null;
                        continue;
                    }

                    switch (state) {
                        case null:
                            state = STATE.CODE_1;
                            break;
                        case STATE.CODE_1:
                            state = STATE.CODE_2;
                            break;
                        case STATE.CODE_2:
                            state = STATE.CODE_3;
                            break;
                    }
                    continue;
                } else if (
                    char === SPECIAL_CHAR.HASHTAG &&
                    currentElement.tagName === "P" &&
                    currentElement.innerText.trim() === ""
                ) {
                    switch (state) {
                        case null:
                            state = STATE.H1;
                            break;
                        case STATE.H1:
                            state = STATE.H2;
                            break;
                        case STATE.H2:
                            state = STATE.H3;
                            break;
                        case STATE.H3:
                            state = STATE.H4;
                            break;
                        case STATE.H4:
                            state = STATE.H5;
                            break;
                        case STATE.H5:
                            state = STATE.H6;
                            break;
                    }
                    continue;
                }

                if (
                    state === STATE.H1 ||
                    state === STATE.H2 ||
                    state === STATE.H3 ||
                    state === STATE.H4 ||
                    state === STATE.H5 ||
                    state === STATE.H6
                ) {
                    if (char === SPECIAL_CHAR.SPACE) {
                        switch (state) {
                            case STATE.H1:
                                const h1 = document.createElement("h1");
                                currentElement.replaceWith(h1);
                                currentElement = h1;
                                break;
                            case STATE.H2:
                                const h2 = document.createElement("h2");
                                currentElement.replaceWith(h2);
                                currentElement = h2;
                                break;
                            case STATE.H3:
                                const h3 = document.createElement("h3");
                                currentElement.replaceWith(h3);
                                currentElement = h3;
                                break;
                            case STATE.H4:
                                const h4 = document.createElement("h4");
                                currentElement.replaceWith(h4);
                                currentElement = h4;
                                break;
                            case STATE.H5:
                                const h5 = document.createElement("h5");
                                currentElement.replaceWith(h5);
                                currentElement = h5;
                                break;
                            case STATE.H6:
                                const h6 = document.createElement("h6");
                                currentElement.replaceWith(h6);
                                currentElement = h6;
                                break;
                        }
                        state = null;
                        continue;
                    } else {
                        switch (state) {
                            case STATE.H1:
                                currentElement.innerHTML +=
                                    SPECIAL_CHAR.HASHTAG;
                                break;
                            case STATE.H2:
                                currentElement.innerHTML += new Array(2)
                                    .fill(SPECIAL_CHAR.HASHTAG)
                                    .join("");
                                break;
                            case STATE.H3:
                                currentElement.innerHTML += new Array(3)
                                    .fill(SPECIAL_CHAR.HASHTAG)
                                    .join("");
                                break;
                            case STATE.H4:
                                currentElement.innerHTML += new Array(4)
                                    .fill(SPECIAL_CHAR.HASHTAG)
                                    .join("");
                                break;
                            case STATE.H5:
                                currentElement.innerHTML += new Array(5)
                                    .fill(SPECIAL_CHAR.HASHTAG)
                                    .join("");
                                break;
                            case STATE.H6:
                                currentElement.innerHTML += new Array(6)
                                    .fill(SPECIAL_CHAR.HASHTAG)
                                    .join("");
                                break;
                        }
                    }

                    state = null;
                } else if (state === STATE.STAR_1) {
                    if (
                        char === SPECIAL_CHAR.SPACE &&
                        currentElement.innerText.trim() === ""
                    ) {
                        currentElement.remove();
                        let ul: HTMLUListElement;
                        if (
                            container.children.length &&
                            container.children[container.children.length - 1]
                                .tagName === "UL"
                        ) {
                            ul = container.children[
                                container.children.length - 1
                            ] as HTMLUListElement;
                        } else {
                            ul = document.createElement("ul");
                            container.append(ul);
                        }
                        const li = document.createElement("li");
                        ul.append(li);
                        currentElement = li;
                        state = null;
                        continue;
                    }

                    currentElement.innerHTML += SPECIAL_CHAR.STAR;
                    state = null;
                } else if (state === STATE.CODE_1) {
                    const code = document.createElement("code");
                    currentElement.append(code);
                    currentElement = code;
                    state = null;
                } else if (state === STATE.CODE_3) {
                    if (currentElement.tagName === "PRE") {
                        const p = document.createElement("p");
                        container.append(p);
                        currentElement = p;
                    } else {
                        const pre = document.createElement("pre");
                        currentElement.replaceWith(pre);
                        currentElement = pre;
                    }
                    state = null;
                }

                currentElement.innerHTML += char;
            }
        },
    };
}
