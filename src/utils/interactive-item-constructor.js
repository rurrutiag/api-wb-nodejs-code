import { randomUUID } from "crypto";
import { queryDb } from "../db/db-query.js";

export async function interactiveItemConstructor(inputData){
    let requestData;
    let requestReply;
    let itemMatrix = {};
    let itemPath = {};
    async function idGenerator(service){
        if (service.number) {
            const uuid = randomUUID();
            itemMatrix[service.number] = uuid;
            itemPath[service.number] = { action_id: uuid };
            return uuid;
        }
        return null;
    }
    if (inputData.class === "list") {
        requestReply = {
            "type": "list_reply"
        };
        const sections = await Promise.all(
            inputData.services.map(async serviceCategory => ({
                title: serviceCategory.category,
                rows: await Promise.all(
                    serviceCategory.services.map(async service => ({
                        id: await idGenerator(service),
                        title: service.title,
                        description: service.description
                    }))
                )
            }))
        );

        requestData = {
            interactive: {
                type: inputData.class,
                header: inputData.header? { text: inputData.header.text, type: "text" } : undefined,
                body: inputData.body ? { text: inputData.body.text } : undefined,
                footer: inputData.footer ? { text: inputData.footer.text } : undefined,
                action: {
                    sections,
                    button: inputData.button_text,
                }
            }
        }
    } else if (inputData.class == "button") {
        requestReply = {
            type: "button_reply"
        };
        const buttons = await Promise.all(
            inputData.buttons.map(async option => ({
                type: "reply",
                reply: {
                    id: await idGenerator(option),
                    title: option.title
                }
            }))
        );
        requestData = {
            interactive: {
                type: inputData.class,
                header: inputData.header? { text: inputData.header.text, type: "text" } : undefined,
                body: inputData.body ? { text: inputData.body.text } : undefined,
                footer: inputData.footer ? { text: inputData.footer.text } : undefined,
                action: {
                    buttons
                }
            }
        };
    }

    return {
        requestData,
        requestReply,
        itemMatrix,
        itemPath
    };

}