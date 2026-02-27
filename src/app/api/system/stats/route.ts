import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);
const SYSTEMD_SERVICES = ["mission-control", "content-vault", "classvault", "creatoros"];

function parseDf(stdout: string): { used: number; total: number } {
  const lines = stdout.trim().split("\n").filter(Boolean);
  const row = lines[lines.length - 1] || "";
  const parts = row.trim().split(/\s+/);

  // macOS/Linux `df -k /` -> Filesystem 1024-blocks Used Available Capacity Mounted on
  const totalKb = Number(parts[1]);
  const usedKb = Number(parts[2]);

  if (!Number.isFinite(totalKb) || !Number.isFinite(usedKb) || totalKb <= 0) {
    return { used: 0, total: 0 };
  }

  return {
    used: Number((usedKb / 1024 / 1024).toFixed(2)),
    total: Number((totalKb / 1024 / 1024).toFixed(2)),
  };
}

export async function GET() {
  try {
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length || 1;
    const cpu = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ram = {
      used: parseFloat((usedMem / 1024 / 1024 / 1024).toFixed(2)),
      total: parseFloat((totalMem / 1024 / 1024 / 1024).toFixed(2)),
    };

    let disk = { used: 0, total: 0 };
    try {
      const { stdout } = await execAsync("df -k /");
      disk = parseDf(stdout);
    } catch (error) {
      console.error("Failed to get disk stats:", error);
    }

    let activeServices = 0;
    let totalServices = 0;
    if (process.platform === "linux") {
      totalServices = SYSTEMD_SERVICES.length;
      try {
        for (const name of SYSTEMD_SERVICES) {
          const { stdout } = await execAsync(`systemctl is-active ${name} 2>/dev/null || true`);
          if (stdout.trim() === "active") activeServices++;
        }
      } catch {
        activeServices = 0;
      }
    }

    // lightweight indicators (best effort)
    let vpnActive = false;
    try {
      const { stdout } = await execAsync("tailscale status 2>/dev/null || true");
      vpnActive = stdout.trim().length > 0 && !stdout.includes("Tailscale is stopped");
    } catch {
      vpnActive = false;
    }

    let firewallActive = false;
    try {
      if (process.platform === "linux") {
        const { stdout } = await execAsync("ufw status 2>/dev/null | head -1 || true");
        firewallActive = stdout.toLowerCase().includes("active");
      } else if (process.platform === "darwin") {
        const { stdout } = await execAsync("/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || true");
        firewallActive = /enabled|on/i.test(stdout);
      }
    } catch {
      firewallActive = false;
    }

    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptime = `${days}d ${hours}h`;

    return NextResponse.json({
      cpu,
      ram,
      disk,
      vpnActive,
      firewallActive,
      activeServices,
      totalServices,
      uptime,
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return NextResponse.json({ error: "Failed to fetch system stats" }, { status: 500 });
  }
}
