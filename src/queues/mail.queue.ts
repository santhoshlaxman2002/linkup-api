import { Queue, Worker, Job } from 'bullmq';
import { UsersBL } from '../businessLayer';
import { logger } from '../utils';

// Set up Redis connection options
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

const mailQueue = new Queue('mail', {
    connection: redisConnection,
});

interface MailJobPayload {
    userId: string,
    email: string
}

/**
 * Add a mail job to the queue, with retry mechanism.
 */
export async function addMailJob(mailData: MailJobPayload) {
    await mailQueue.add('send_mail', mailData, {
        attempts: 5, // Retry 5 times on failure
        backoff: {
            type: 'exponential',
            delay: 3000, // Initial delay of 3 seconds between retries
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
    });
}

// Worker to process mail jobs, will auto-retry failed jobs according to `attempts` above
const mailWorker = new Worker(
    'mail',
    async (job: Job) => {
        const { userId, email } = job.data as MailJobPayload;
        await UsersBL.generateAndSendOtp(userId, email);
    },
    {
        connection: redisConnection
    }
);

mailWorker.on('completed', (job) => {
    logger.info(`[mail.queue] Job completed: id=${job.id}, name=${job.name}`);
});

mailWorker.on('failed', (job, err) => {
    logger.error(`[mail.queue] Job failed: id=${job?.id}, name=${job?.name}, attemptsMade=${job?.attemptsMade}`, { error: err });
    if (job && job.attemptsMade < 5) {
        logger.warn(`[mail.queue] Retrying job id=${job.id}, attempt ${job.attemptsMade + 1}/5`);
    }
});

export default {
    addMailJob,
    queue: mailQueue,
};
