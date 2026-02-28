import { NextResponse } from "next/server";
import { MODEL_PRICING } from "@/lib/pricing";

export async function GET() {
  return NextResponse.json({
    models: MODEL_PRICING.map((p) => ({
      id: p.id,
      name: p.name,
      alias: p.alias,
    })),
  });
}
