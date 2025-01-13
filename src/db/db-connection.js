import dotenv from 'dotenv';
import { neon } from "@neondatabase/serverless";

dotenv.config();

const config = process.env;

export const dbConnection = neon(process.env.DATABASE_URL);