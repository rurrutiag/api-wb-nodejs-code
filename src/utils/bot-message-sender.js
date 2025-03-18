import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();

export async function botMessageSender({
    receiver, sender, type, content
}){
    try {
        const { GRAPH_API_TOKEN, WAB_API_URL } = process.env;
        let sending = await axios({
            method: "POST",
            url: `${WAB_API_URL}/${receiver}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: sender,
                type: type,
                ...content
            }
        });
        console.log(sending);
        return true;
    } catch (error) {
        console.error("error details:", error);
        throw new Error(`Error in send message: ${error.response?.data?.error?.message}`);
    }
}