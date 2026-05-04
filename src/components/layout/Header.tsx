import { Bell, MessageSquare, Search, Moon, Sun, ChevronRight, Menu } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

const labels: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/agencies": "Multi-agences",
  "/dossiers": "Dossiers partagés",
  "/messages": "Communication",
  "/validations": "Validations",
  "/quality": "Contrôle qualité",
  "/anomalies": "Anomalies",
  "/audit": "Audit trail",
  "/settings": "Paramètres",
};

export const Header = () => {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [q, setQ] = useState("");
  const title = labels[pathname.split("/").slice(0, 2).join("/")] || "Détails";

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

        <div className="flex flex-col">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Collaboration & Qualité</span>
            {pathname !== "/" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{title}</span>
              </>
            )}
          </nav>
          <h1 className="text-lg font-display font-semibold leading-tight">{title}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher dossiers, agences…"
              className="pl-9 w-64 bg-secondary/60 border-transparent focus-visible:bg-card"
            />
          </div>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-destructive" />
          </Button>

          <Button variant="ghost" size="icon" className="relative" aria-label="Messages">
            <MessageSquare className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-primary">3</Badge>
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
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Déconnexion</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
