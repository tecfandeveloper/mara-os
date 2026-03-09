"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Monitor,
  FolderOpen,
  Brain,
  Bot,
  Building2,
  Activity,
  Clock,
  Puzzle,
  DollarSign,
  Settings,
  History,
  MessageSquare,
  FlaskConical,
  Boxes,
} from "lucide-react";

const groups = [
  {
    id: "core",
    items: [
      { href: "/", icon: Home, label: "Dashboard" },
      { href: "/agents", icon: Bot, label: "Agents" },
      { href: "/cron", icon: Clock, label: "Cron Jobs" },
    ],
  },
  {
    id: "monitor",
    items: [
      { href: "/activity", icon: Activity, label: "Activity" },
      { href: "/system", icon: Monitor, label: "System Monitor" },
      { href: "/sessions", icon: History, label: "Sessions" },
      { href: "/costs", icon: DollarSign, label: "Costs & Analytics" },
    ],
  },
  {
    id: "resources",
    items: [
      { href: "/memory", icon: Brain, label: "Memory" },
      { href: "/files", icon: FolderOpen, label: "Files" },
      { href: "/skills", icon: Puzzle, label: "Skills" },
      { href: "/subagents", icon: Bot, label: "Sub-Agents" },
    ],
  },
  {
    id: "workspace",
    items: [
      { href: "/office", icon: Building2, label: "Office" },
      { href: "/workspace-3d", icon: Boxes, label: "Workspace 3D" },
      { href: "/playground", icon: FlaskConical, label: "Model Playground" },
      { href: "/notifications-log", icon: MessageSquare, label: "Notifications Log" },
    ],
  },
];

const bottomItem = { href: "/settings", icon: Settings, label: "Settings" };

function DockItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${
        isActive
          ? "bg-red-500/15"
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-red-500"
          aria-hidden
        />
      )}
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-red-400" : ""}`}
        strokeWidth={isActive ? 2.5 : 2}
      />
      {/* Tooltip with left-pointing arrow */}
      <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 opacity-0 transition-opacity group-hover:opacity-100">
        <span
          className="absolute -left-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-900"
          aria-hidden
        />
        {label}
      </span>
    </Link>
  );
}

export function Dock() {
  const pathname = usePathname();

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const separator = (
    <div className="mx-auto my-2 h-px w-6 bg-zinc-800/70" aria-hidden />
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-14 flex-col items-center border-r border-zinc-800 bg-zinc-950 py-3 px-2.5">
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="flex flex-col items-center gap-0.5">
          {groupIndex > 0 && separator}
          {group.items.map((item) => (
            <DockItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isItemActive(item.href)}
            />
          ))}
        </div>
      ))}
      <div className="flex-1" />
      {separator}
      <DockItem
        href={bottomItem.href}
        icon={bottomItem.icon}
        label={bottomItem.label}
        isActive={isItemActive(bottomItem.href)}
      />
    </aside>
  );
}
