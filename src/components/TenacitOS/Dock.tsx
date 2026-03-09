"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  ChevronRight,
} from "lucide-react";

const coreItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/agents", icon: Bot, label: "Agents" },
  { href: "/cron", icon: Clock, label: "Cron Jobs" },
];

const folders = [
  {
    id: "monitor",
    icon: Monitor,
    label: "Monitor",
    items: [
      { href: "/activity", icon: Activity, label: "Activity" },
      { href: "/system", icon: Monitor, label: "System Monitor" },
      { href: "/sessions", icon: History, label: "Sessions" },
      { href: "/costs", icon: DollarSign, label: "Costs & Analytics" },
    ],
  },
  {
    id: "resources",
    icon: Brain,
    label: "Resources",
    items: [
      { href: "/memory", icon: Brain, label: "Memory" },
      { href: "/files", icon: FolderOpen, label: "Files" },
      { href: "/skills", icon: Puzzle, label: "Skills" },
      { href: "/subagents", icon: Bot, label: "Sub-Agents" },
    ],
  },
  {
    id: "workspace",
    icon: Building2,
    label: "Workspace",
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
  indent = false,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  isActive: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
        indent ? "ml-1" : ""
      } ${
        isActive
          ? "bg-red-500/15"
          : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-red-500"
          aria-hidden
        />
      )}
      <Icon
        className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-red-400" : ""}`}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-zinc-700/60 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl opacity-0 transition-opacity group-hover:opacity-100">
        <span
          className="absolute -left-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-700/60"
          aria-hidden
        />
        {label}
      </span>
    </Link>
  );
}

export function Dock() {
  const pathname = usePathname();
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const isItemActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const toggleFolder = (id: string) => {
    setOpenFolder((prev) => (prev === id ? null : id));
  };

  const hasActiveChild = (items: { href: string }[]) =>
    items.some((item) => isItemActive(item.href));

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-14 flex-col border-r border-zinc-800/50 bg-zinc-950 px-2.5 py-3">
      {/* Core items */}
      <div className="flex flex-col items-center gap-0.5">
        {coreItems.map((item) => (
          <DockItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={isItemActive(item.href)}
          />
        ))}
      </div>

      <div className="mx-auto my-3 h-px w-6 bg-zinc-800" aria-hidden />

      {/* Scrollable area with folders */}
      <div className="min-h-0 flex-1 overflow-x-visible overflow-y-auto">
        <div className="flex flex-col items-center gap-0.5">
          {folders.map((folder) => {
            const isOpen = openFolder === folder.id;
            const hasActive = hasActiveChild(folder.items);
            const FolderIcon = folder.icon;

            return (
              <div key={folder.id} className="flex w-full flex-col items-center">
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className={`group relative flex h-9 w-9 flex-shrink-0 items-center justify-center gap-0.5 rounded-xl transition-all duration-150 ${
                    hasActive && !isOpen
                      ? "text-zinc-300"
                      : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                  aria-expanded={isOpen}
                  aria-label={`${folder.label}, ${isOpen ? "collapse" : "expand"}`}
                >
                  <FolderIcon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
                  <ChevronRight
                    size={10}
                    className={`flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                    strokeWidth={2.5}
                  />
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-zinc-700/60 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      className="absolute -left-1.5 top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-700/60"
                      aria-hidden
                    />
                    {folder.label}
                  </span>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="flex min-h-0 flex-col items-center gap-0.5 overflow-hidden">
                    {folder.items.map((item) => (
                      <DockItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={isItemActive(item.href)}
                        indent
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto my-2 h-px w-6 bg-zinc-800/70" aria-hidden />
      <DockItem
        href={bottomItem.href}
        icon={bottomItem.icon}
        label={bottomItem.label}
        isActive={isItemActive(bottomItem.href)}
      />
    </aside>
  );
}
