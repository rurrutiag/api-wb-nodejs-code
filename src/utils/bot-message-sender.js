import dotenv from 'dotenv';
import axios from "axios";
import { logRecorder } from './log-recorder.js';
dotenv.config();

export async function botMessageSender({
    receiver, sender, type, content
}){
    const { GRAPH_API_TOKEN, WAB_API_URL } = process.env;
        let url = `${WAB_API_URL}/${receiver}/messages`;
        let requestData = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sender,
            type: type,
            ...content
        };
        let headers = {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        };
        let logRegistry = {step: "Construir mensaje a enviar en botMessageSender", dataSending: requestData};
        await logRecorder(logRegistry);
    try {    
        let sending = await axios.post(
            url,
            requestData,
            {headers}
        );
        logRegistry = { step: "Resultado de usar axios en botMessageSender", axios: sending };
        await logRecorder(logRegistry);
        return true;
    } catch (error) {
        console.error("error details:", error);
        throw new Error(`Error al enviar a la api url: ${error.response?.data?.error?.message}`);
    }
}