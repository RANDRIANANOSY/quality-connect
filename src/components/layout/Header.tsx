import { Bell, MessageSquare, Search, Moon, Sun, ChevronRight, Menu, FolderKanban, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { store } from "@/data/store";
import { useStore } from "@/data/useStore";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const labels: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/agencies": "Multi-agences",
  "/dossiers": "Dossiers partagés",
  "/messages": "Messages",
  "/validations": "Validations",
  "/quality": "Contrôle qualité",
  "/anomalies": "Anomalies",
  "/audit": "Audit trail",
  "/settings": "Paramètres",
};

export const Header = () => {
  useStore();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [openSearch, setOpenSearch] = useState(false);
  const title = labels[pathname.split("/").slice(0, 2).join("/")] || "Détails";

  const unread = store.conversations.reduce((s, c) => s + c.unread, 0);
  const recentLogs = store.auditLogs.slice(0, 6);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as { type: string; label: string; sub?: string; to: string; icon: typeof FolderKanban }[];
    const r: { type: string; label: string; sub?: string; to: string; icon: typeof FolderKanban }[] = [];
    store.agencies.forEach((a) => {
      if (a.name.toLowerCase().includes(term) || a.manager.toLowerCase().includes(term))
        r.push({ type: "Agence", label: a.name, sub: a.manager, to: `/agencies/${a.id}`, icon: Building2 });
    });
    store.dossiers.forEach((d) => {
      if (d.name.toLowerCase().includes(term) || d.client.toLowerCase().includes(term))
        r.push({ type: "Dossier", label: d.name, sub: d.client, to: "/dossiers", icon: FolderKanban });
    });
    store.anomalies.forEach((a) => {
      if (a.type.toLowerCase().includes(term) || (a.client ?? "").toLowerCase().includes(term))
        r.push({ type: "Anomalie", label: a.type, sub: a.client, to: "/anomalies", icon: AlertTriangle });
    });
    store.validations.forEach((v) => {
      if (v.dossier.toLowerCase().includes(term))
        r.push({ type: "Validation", label: v.dossier, sub: v.sentBy, to: "/validations", icon: CheckCircle2 });
    });
    return r.slice(0, 8);
  }, [q]);

  const go = (to: string) => {
    setOpenSearch(false);
    setQ("");
    nav(to);
  };

  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
      <div className="flex items-center gap-4 px-4 md:px-8 h-16">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        <div className="flex flex-col min-w-0">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium truncate">Collaboration & Qualité</span>
            {pathname !== "/" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="truncate">{title}</span>
              </>
            )}
          </nav>
          <h1 className="text-lg font-display font-semibold leading-tight truncate">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Popover open={openSearch && results.length > 0} onOpenChange={setOpenSearch}>
            <PopoverTrigger asChild>
              <div className="relative hidden sm:block">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOpenSearch(true); }}
                  onFocus={() => setOpenSearch(true)}
                  placeholder="Rechercher dossiers, agences…"
                  className="pl-9 w-64 bg-secondary/60 border-transparent focus-visible:bg-card"
                />
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-1">
              <div className="text-[11px] uppercase font-semibold text-muted-foreground px-2 py-1.5">{results.length} résultats</div>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => go(r.to)}
                  className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-secondary text-sm"
                >
                  <r.icon className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.label}</div>
                    {r.sub && <div className="text-xs text-muted-foreground truncate">{r.sub}</div>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{r.type}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {recentLogs.length > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold">Notifications</div>
                <Button variant="ghost" size="sm" onClick={() => nav("/audit")}>Voir tout</Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentLogs.map((l) => (
                  <div key={l.id} className="px-3 py-2 border-b border-border/60 hover:bg-secondary/40 text-sm">
                    <div><span className="font-medium">{l.user}</span> <span className="text-muted-foreground">{l.action}</span></div>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.target} · {format(new Date(l.date), "dd MMM HH:mm", { locale: fr })}</div>
                  </div>
                ))}
                {recentLogs.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">Aucune notification</div>}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="relative" aria-label="Messages" onClick={() => nav("/messages")}>
            <MessageSquare className="h-4 w-4" />
            {unread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-primary">{unread}</Badge>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-1 flex items-center gap-2 rounded-full hover:bg-secondary p-1 pr-3 transition">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-semibold">
                    AD
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">Admin</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => nav("/settings")}>Profil</DropdownMenuItem>
              <DropdownMenuItem onClick={() => nav("/settings")}>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
