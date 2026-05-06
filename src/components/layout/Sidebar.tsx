import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Vue d'ensemble" },
  { to: "/agencies", icon: Building2, label: "Multi-agences" },
  { to: "/dossiers", icon: FolderKanban, label: "Dossiers partagés" },
  { to: "/validations", icon: CheckCircle2, label: "Validations" },
  { to: "/quality", icon: ShieldCheck, label: "Contrôle qualité" },
  { to: "/anomalies", icon: AlertTriangle, label: "Anomalies" },
  { to: "/audit", icon: ScrollText, label: "Audit trail" },
  { to: "/settings", icon: Settings, label: "Paramètres" },
];

export const Sidebar = () => {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-white text-sm leading-tight">Qualis</div>
          <div className="text-[11px] text-sidebar-foreground/70 leading-tight">Collab & Qualité</div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {items.map((it) => {
          const active = pathname === it.to;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <it.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-glow" />}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/40 p-3">
          <div className="text-xs font-medium text-white">Plan Pro</div>
          <div className="text-[11px] text-sidebar-foreground/70 mt-0.5">
            4 agences · 156 dossiers
          </div>
        </div>
      </div>
    </aside>
  );
};
