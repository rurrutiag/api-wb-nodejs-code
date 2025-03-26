import express from 'express';
import { handlePostWebhook } from './controllers/handle-post-webhook.js';
import { handleGetWebhook } from './controllers/handle-get-webhook.js';
import { handleTemporal } from './controllers/handle-temporal.js';

const router = express.Router();

router.post("/", handleTemporal);
router.get("/", handleGetWebhook);

export default router;