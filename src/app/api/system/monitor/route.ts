import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

interface ServiceEntry {
  name: string;
  status: string;
  description: string;
  backend: string;
  uptime?: number | null;
  restarts?: number;
  pid?: number | null;
  mem?: number | null;
  cpu?: number | null;
}

function parseDf(stdout: string): { total: number; used: number; free: number; percent: number } {
  const lines = stdout.trim().split("\n").filter(Boolean);
  const row = lines[lines.length - 1] || "";
  const parts = row.trim().split(/\s+/);
  const totalKb = Number(parts[1]);
  const usedKb = Number(parts[2]);
  const freeKb = Number(parts[3]);
  const percent = totalKb > 0 ? (usedKb / totalKb) * 100 : 0;
  return {
    total: Number((totalKb / 1024 / 1024).toFixed(2)),
    used: Number((usedKb / 1024 / 1024).toFixed(2)),
    free: Number((freeKb / 1024 / 1024).toFixed(2)),
    percent: Number(percent.toFixed(2)),
  };
}

export async function GET() {
  try {
    const cpuCount = os.cpus().length || 1;
    const loadAvg = os.loadavg();
    const cpuUsage = Math.min(Math.round((loadAvg[0] / cpuCount) * 100), 100);

    const cpus = os.cpus();
    const coreAvg = Math.min(100, Math.round((cpuUsage / Math.max(1, cpus.length)) * 1.5));

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    let disk = { total: 0, used: 0, free: 0, percent: 0 };
    try {
      const { stdout } = await execAsync("df -k /");
      disk = parseDf(stdout);
    } catch {}

    let network = { rx: 0, tx: 0 };
    try {
      if (process.platform === "darwin") {
        const { stdout } = await execAsync("netstat -ib");
        const lines = stdout.split("\n").filter((l) => l.includes("en0"));
        let rx = 0;
        let tx = 0;
        for (const l of lines) {
          const p = l.trim().split(/\s+/);
          rx += Number(p[6]) || 0;
          tx += Number(p[9]) || 0;
        }
        network = { rx: Number((rx / 1024 / 1024).toFixed(2)), tx: Number((tx / 1024 / 1024).toFixed(2)) };
      }
    } catch {}

    const services: ServiceEntry[] = [];

    // PM2 dynamic discovery
    try {
      const { stdout } = await execAsync("pm2 jlist 2>/dev/null");
      const pm2List = JSON.parse(stdout) as Array<any>;
      for (const proc of pm2List) {
        services.push({
          name: proc.name,
          status: proc.pm2_env?.status === "online" ? "active" : proc.pm2_env?.status || "unknown",
          description: proc.name,
          backend: "pm2",
          uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : null,
          restarts: proc.pm2_env?.restart_time ?? 0,
          pid: proc.pid ?? null,
          cpu: proc.pm2_env?.monit?.cpu ?? null,
          mem: proc.pm2_env?.monit?.memory ?? null,
        });
      }
    } catch {}

    // systemd only on linux
    if (process.platform === "linux") {
      try {
        const { stdout } = await execAsync("systemctl list-units --type=service --state=running --no-legend --no-pager | head -n 20");
        for (const line of stdout.split("\n").filter(Boolean)) {
          const unit = line.trim().split(/\s+/)[0];
          if (!unit) continue;
          services.push({
            name: unit.replace(/\.service$/, ""),
            status: "active",
            description: unit,
            backend: "systemd",
          });
        }
      } catch {}
    }

    // openclaw gateway quick check
    let gatewayActive = false;
    try {
      const { stdout } = await execAsync("openclaw gateway status 2>/dev/null || true");
      gatewayActive = /running|active|online/i.test(stdout);
    } catch {}

    const tailscale = { active: false, ip: "", devices: [] as any[] };
    try {
      const { stdout } = await execAsync("tailscale ip -4 2>/dev/null || true");
      const ip = stdout.trim();
      if (ip) {
        tailscale.active = true;
        tailscale.ip = ip;
      }
    } catch {}

    const firewall = { active: false, rules: [] as any[], ruleCount: 0 };

    if (!services.find((s) => s.name.includes("openclaw"))) {
      services.unshift({
        name: "openclaw-gateway",
        status: gatewayActive ? "active" : "inactive",
        description: "OpenClaw Gateway",
        backend: "openclaw",
      });
    }

    return NextResponse.json({
      cpu: {
        usage: cpuUsage,
        cores: cpus.map(() => coreAvg),
        loadAvg,
      },
      ram: {
        total: Number((totalMem / 1024 / 1024 / 1024).toFixed(2)),
        used: Number((usedMem / 1024 / 1024 / 1024).toFixed(2)),
        free: Number((freeMem / 1024 / 1024 / 1024).toFixed(2)),
        cached: 0,
      },
      disk,
      network,
      systemd: services,
      tailscale,
      firewall,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching system monitor data:", error);
    return NextResponse.json({ error: "Failed to fetch system monitor data" }, { status: 500 });
  }
}
