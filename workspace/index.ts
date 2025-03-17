import Editor from "../editor";
import { createTabs } from "./ tabs";


export function createWorkspace(editorInstance: Editor){
    const container = document.createElement("div");

    const tabs = createTabs();
    
    container.append(tabs, )

    
    container.innerText = "WORKSPACE"
    
    return container;
}