/**
 * GET /api/notifications-log
 * List of outbound messages (Telegram, etc.) from activities with type message_sent.
 * Supports filters: startDate, endDate, channel (agent), delivery status.
 */
import { NextRequest, NextResponse } from "next/server";
import { getActivities, getDistinctChannelsForMessageLog } from "@/lib/activities-db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const channel = searchParams.get("channel") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const result = getActivities({
      type: "message_sent",
      status: status && status !== "all" ? status : undefined,
      agent: channel && channel !== "all" ? channel : undefined,
      startDate,
      endDate,
      sort: "newest",
      limit,
      offset,
    });

    const messages = result.activities.map((a) => ({
      id: a.id,
      timestamp: a.timestamp,
      channel: a.agent ?? "unknown",
      type: a.type,
      preview: a.description,
      deliveryStatus: a.status,
      metadata: a.metadata ?? undefined,
    }));

    const channels = getDistinctChannelsForMessageLog();

    return NextResponse.json({
      messages,
      channels,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.activities.length < result.total,
    });
  } catch (error) {
    console.error("Failed to get notifications log:", error);
    return NextResponse.json(
      { error: "Failed to get notifications log" },
      { status: 500 }
    );
  }
}
