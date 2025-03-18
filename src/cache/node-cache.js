import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300});
export {cache};