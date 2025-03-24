import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();
export async function handleGetWebhook(req, res){
    try {
        const { GRAPH_API_TOKEN, WEBHOOK_VERIFY_TOKEN } = process.env;
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];
        if (mode === "suscribe" && token === WEBHOOK_VERIFY_TOKEN) {
            res.status(200).send(challenge);
            console.log("Webhook verified successfully!");
        } else {
            res.sendStatus(403);
        }
    } catch (error) {
        console.error("Error details:", error);
        // throw new Error(`Error in send message: ${e}`);
        res.status(500).json({ error: `Error interno del servicio. ${error}` });
    }

}