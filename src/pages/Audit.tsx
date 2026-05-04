import { useState } from "react";
import { Filter, Download, Trash2, Activity } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { store, notify } from "@/data/store";
import { useStore } from "@/data/useStore";

export default function Audit() {
  useStore();
  const [user, setUser] = useState("");
  const [cat, setCat] = useState("all");
  const [confirmClean, setConfirmClean] = useState(false);

  const filtered = store.auditLogs.filter((l) => {
    if (cat !== "all" && l.category !== cat) return false;
    if (user && !l.user.toLowerCase().includes(user.toLowerCase())) return false;
    return true;
  });

  const exportLogs = () => {
    const rows = [["Date", "Utilisateur", "Action", "Cible", "Catégorie"], ...filtered.map((l) => [l.date, l.user, l.action, l.target, l.category])];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "audit-logs.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportés");
  };

  const cleanup = () => {
    store.auditLogs = store.auditLogs.slice(0, 3);
    notify();
    toast.success("Historique nettoyé");
    setConfirmClean(false);
  };

  const catTone = (c: string) =>
    c === "validation" ? "success" :
    c === "suppression" ? "danger" :
    c === "modification" ? "warning" :
    c === "création" ? "info" : "primary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Audit trail</h2>
          <p className="text-sm text-muted-foreground">Traçabilité complète de toutes les actions sur la plateforme.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLogs}><Download className="h-4 w-4 mr-2" />Export logs</Button>
          <Button variant="outline" onClick={() => setConfirmClean(true)}><Trash2 className="h-4 w-4 mr-2" />Nettoyer historique</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-4 w-4" />Filtres</CardTitle>
          <CardDescription>Affinez la liste des évènements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-xs" placeholder="Filtrer par utilisateur…" value={user} onChange={(e) => setUser(e.target.value)} />
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="validation">Validation</SelectItem>
                <SelectItem value="modification">Modification</SelectItem>
                <SelectItem value="suppression">Suppression</SelectItem>
                <SelectItem value="création">Création</SelectItem>
                <SelectItem value="partage">Partage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chronologie</CardTitle>
          <CardDescription>{filtered.length} évènements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {filtered.map((l) => (
                <div key={l.id} className="relative">
                  <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-card border-2 border-primary" />
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{l.user}</span>
                    <span className="text-sm text-muted-foreground">{l.action}</span>
                    <span className="text-sm font-medium">"{l.target}"</span>
                    <StatusBadge tone={catTone(l.category) as never}>{l.category}</StatusBadge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <Activity className="h-3 w-3" />
                    <span>{format(new Date(l.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    <span>·</span>
                    <span>il y a {formatDistanceToNow(new Date(l.date), { locale: fr })}</span>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div className="text-center text-sm text-muted-foreground py-8">Aucun évènement</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmClean} onOpenChange={setConfirmClean}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nettoyer l'historique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les logs antérieurs seront supprimés (seuls les 3 plus récents sont conservés). Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={cleanup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Nettoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
