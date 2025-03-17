import { createTabs } from "./ tabs";


export function createWorkspace(){
    const container = document.createElement("div");

    const tabs = createTabs();

    container.append(tabs, )
    
    return container;
}