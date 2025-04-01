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
                'Content-Type': 'application/json'
        };
        let logRegistry = {step: "Construir mensaje a enviar en botMessageSender", dataSending: requestData};
    try {    
        await logRecorder(logRegistry);
        console.log("Datos para la solicitud axios");
        console.log("method","POST");
        console.log("url",url);
        console.log("headers",headers);
        console.log("data",requestData);
        let sending = await axios({
            method: "POST",
            url: url,
            headers: headers,
            data: requestData
        });
        console.log("sending", sending.data.messages);
        // logRegistry = { step: "Resultado de usar axios en botMessageSender", "axios": sending };
        // await logRecorder(logRegistry);
        return true;
    } catch (error) {
        await logRecorder({
            step: "botMessageSender: Error al envíar POST a la API",
            error: error
        });
        throw new Error(`Error al enviar a la api url: ${error.response?.data?.error?.message}`);
    }
}