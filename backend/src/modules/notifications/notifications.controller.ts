import type { Request, Response, NextFunction } from 'express';
import { query } from '../../config/database.js';

export async function listNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query['unreadOnly'] === 'true';

    const condition = unreadOnly
      ? 'WHERE recipient_id = $1 AND is_read = false'
      : 'WHERE recipient_id = $1';

    const result = await query<{
      id: string; title: string; message: string; type: string;
      link: string | null; is_read: boolean; created_at: string;
    }>(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM notifications
       ${condition}
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        link: r.link,
        isRead: r.is_read,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM notifications WHERE recipient_id = $1 AND is_read = false',
      [req.user!.id],
    );
    res.json({ success: true, data: { count: parseInt(result.rows[0]!.count, 10) } });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2',
      [req.params['id'], req.user!.id],
    );
    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE recipient_id = $1 AND is_read = false',
      [req.user!.id],
    );
    res.json({ success: true, data: { message: 'All marked as read' } });
  } catch (err) {
    next(err);
  }
}
