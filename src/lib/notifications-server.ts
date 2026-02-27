/**
 * Server-side notification helpers (for API routes and server code).
 * Used by /api/notifications and by cost alerts in /api/costs.
 */
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DATA_PATH = path.join(process.cwd(), "data", "notifications.json");

export interface Notification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function loadNotifications(): Promise<Notification[]> {
  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveNotifications(notifications: Notification[]): Promise<void> {
  const dir = path.dirname(DATA_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  await fs.writeFile(DATA_PATH, JSON.stringify(notifications, null, 2));
}

export async function createNotification(notification: {
  title: string;
  message: string;
  type?: Notification["type"];
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<Notification> {
  const notifications = await loadNotifications();
  const newNotification: Notification = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    title: notification.title,
    message: notification.message,
    type: notification.type ?? "info",
    read: false,
    link: notification.link,
    metadata: notification.metadata,
  };
  notifications.unshift(newNotification);
  if (notifications.length > 100) notifications.splice(100);
  await saveNotifications(notifications);
  return newNotification;
}

/** Returns true if a notification with this title already exists today (for dedupe). */
export async function hasNotificationToday(title: string): Promise<boolean> {
  const notifications = await loadNotifications();
  const today = new Date().toISOString().slice(0, 10);
  return notifications.some(
    (n) => n.title === title && n.timestamp.startsWith(today)
  );
}
