import express from 'express';
import { handlePostWebhook } from './controllers/handle-post-webhook.js';

const router = express.Router();

router.post("/", handlePostWebhook);

export default router;