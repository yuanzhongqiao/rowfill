import { Worker } from 'bullmq';

// Define the worker process
new Worker(
    'track_queue',
    async (job) => {
        
    },
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0") || 0
        }
    }
);
