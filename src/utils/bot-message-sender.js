import dotenv from 'dotenv';
import axios from "axios";
import { logRecorder } from './log-recorder.js';
dotenv.config();

export async function botMessageSender({
    receiver, sender, type, content
}){
    try {
        const { GRAPH_API_TOKEN, WAB_API_URL } = process.env;
        let dataSending = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sender,
            type: type,
            ...content
        };
        let logRegistry = {step: "Construir mensaje a enviar en botMessageSender", dataSending: dataSending};
        await logRecorder(logRegistry);
        let sending = await axios({
            method: "POST",
            url: `${WAB_API_URL}/${receiver}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: dataSending
        });
        console.log(sending);
        return true;
    } catch (error) {
        console.error("error details:", error);
        throw new Error(`Error al enviar mensaje: ${error.response?.data?.error?.message}`);
    }
}