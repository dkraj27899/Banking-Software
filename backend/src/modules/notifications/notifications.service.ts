import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

interface CreateNotification {
  recipientId: string;
  title: string;
  message: string;
  type: 'approval' | 'info' | 'alert';
  link?: string;
}

export function sendNotification(params: CreateNotification): void {
  query(
    `INSERT INTO notifications (recipient_id, title, message, type, link)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.recipientId, params.title, params.message, params.type, params.link ?? null],
  ).catch((err) => {
    logger.error('Failed to create notification', {
      error: err instanceof Error ? err.message : 'unknown',
      recipientId: params.recipientId,
    });
  });
}

export async function notifyApprovers(
  excludeUserId: string,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  try {
    const result = await query<{ id: string }>(
      `SELECT id FROM staff_users
       WHERE is_active = true
         AND id != $1
         AND role IN ('super_admin', 'branch_admin')`,
      [excludeUserId],
    );

    for (const row of result.rows) {
      sendNotification({
        recipientId: row.id,
        title,
        message,
        type: 'approval',
        link,
      });
    }
  } catch (err) {
    logger.error('Failed to notify approvers', {
      error: err instanceof Error ? err.message : 'unknown',
    });
  }
}
