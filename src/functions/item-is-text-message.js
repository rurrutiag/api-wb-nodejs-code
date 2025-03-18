import { sendMessage } from "./common-assets";

function constructMessage({
    platformName, userPlatform, textContent
}){
    return {
        messaging_product: platformName,
        recipient_type: "individual",
        to: userPlatform,
        type: "text",
        text: textContent
    };
}
export default async function itemIsTextMessageSender({
    apiUrl,
    userPlatform,
    GRAPH_API_TOKEN,
    itemId,
    textContent  
}) {
    try {
        const message = constructMessage({
            platformName,
            userPlatform,
            textContent
        });
        return await sendMessage({
            apiUrl,
            GRAPH_API_TOKEN,
            message
        });
    } catch (error) {
      throw new Error(`Error al enviar el mensaje: ${error.message}`);
    }
    
}