import { Queue, Worker, Job } from 'bullmq';
import { DatabaseConnection } from '../database/DatabaseConnection';
import { logger } from '../utils';

// Set up Redis connection options
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
};

// Create notification queue
const notificationQueue = new Queue('notifications', {
    connection: redisConnection,
});

// Notification types enum
export enum NotificationType {
    FRIEND_REQUEST = 'FRIEND_REQUEST',
    FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
    FRIEND_REJECTED = 'FRIEND_REJECTED',
    FRIEND_CANCELLED = 'FRIEND_CANCELLED',
    FRIEND_UNFRIENDED = 'FRIEND_UNFRIENDED',
}

// Notification job payload interface
export interface NotificationJobPayload {
    userId: string;
    senderId: string;
    type: NotificationType;
    message: string;
}

/**
 * Add a notification job to the queue
 * @param payload - Notification data to be processed
 */
export async function addNotificationJob(payload: NotificationJobPayload): Promise<void> {
    try {
        await notificationQueue.add('send_notification', payload, {
            attempts: 3, // Retry 3 times on failure
            backoff: {
                type: 'exponential',
                delay: 2000, // Initial delay of 2 seconds between retries
            },
            removeOnComplete: true,
            removeOnFail: false, // Keep failed jobs for debugging
        });
        logger.info('[notification.queue] Notification job added to queue', { 
            userId: payload.userId, 
            type: payload.type 
        });
    } catch (error) {
        logger.error('[notification.queue] Failed to add notification job', { 
            error,
            payload 
        });
        throw error;
    }
}

/**
 * Create and start the notification worker
 * This worker processes notification jobs and inserts them into the database
 */
export function startNotificationWorker(): void {
    const worker = new Worker(
        'notifications',
        async (job: Job) => {
            const { userId, senderId, type, message } = job.data as NotificationJobPayload;
            
            logger.debug('[notification.queue] Processing notification job', {
                jobId: job.id,
                userId,
                senderId,
                type
            });

            // Insert notification into database
            const query = `
                INSERT INTO notifications (user_id, sender_id, type, message)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            `;
            
            await DatabaseConnection.query(query, [userId, senderId, type, message]);
            
            logger.info('[notification.queue] Notification saved to database', {
                jobId: job.id,
                userId,
                type
            });
        },
        {
            connection: redisConnection
        }
    );

    // Event handlers
    worker.on('completed', (job) => {
        logger.info('[notification.queue] Job completed', { 
            jobId: job.id, 
            jobName: job.name 
        });
    });

    worker.on('failed', (job, err) => {
        logger.error('[notification.queue] Job failed', { 
            jobId: job?.id, 
            jobName: job?.name, 
            attemptsMade: job?.attemptsMade,
            error: err 
        });
        if (job && job.attemptsMade < 3) {
            logger.warn('[notification.queue] Retrying job', { 
                jobId: job.id, 
                attempt: job.attemptsMade + 1 
            });
        }
    });

    logger.info('[notification.queue] Notification worker started');
}

// Export default
export default {
    addNotificationJob,
    queue: notificationQueue,
};

