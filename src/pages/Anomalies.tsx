import { useState } from "react";
import { Plus, Pencil, Eye, Search, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { store, REGIONS, Region, Anomaly, Severity, uid, nowIso, notify, logAudit } from "@/data/store";
import { useStore } from "@/data/useStore";

const empty: Omit<Anomaly, "id"> = {
  type: "",
  category: "comptable",
  dossier: "",
  region: "Antananarivo",
  severity: "moyen",
  status: "ouverte",
  assignedTo: "",
  date: nowIso(),
  description: "",
};

export default function Anomalies() {
  useStore();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Anomaly | null>(null);
  const [form, setForm] = useState<Omit<Anomaly, "id">>(empty);
  const [detail, setDetail] = useState<Anomaly | null>(null);

  const filtered = store.anomalies.filter((a) => {
    if (region !== "all" && a.region !== region) return false;
    if (category !== "all" && a.category !== category) return false;
    if (severity !== "all" && a.severity !== severity) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search && !`${a.type} ${a.dossier} ${a.assignedTo}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sevTone = (s: Severity) => (s === "critique" ? "danger" : s === "moyen" ? "warning" : "success");

  const openNew = () => { setEditing(null); setForm({ ...empty, date: nowIso() }); setOpen(true); };
  const openEdit = (a: Anomaly) => { setEditing(a); setForm(a); setOpen(true); };
  const submit = () => {
    if (!form.type || !form.dossier) return toast.error("Type et dossier requis");
    if (editing) {
      Object.assign(editing, form);
      logAudit({ user: "Admin", action: "a modifié une anomalie", target: form.type, category: "modification" });
      toast.success("Anomalie modifiée");
    } else {
      store.anomalies.unshift({ id: uid(), ...form });
      logAudit({ user: "Admin", action: "a signalé une anomalie", target: form.type, category: "création" });
      toast.success("Anomalie créée");
    }
    notify();
    setOpen(false);
  };

  const resolve = (a: Anomaly) => {
    a.status = "résolue";
    logAudit({ user: "Admin", action: "a résolu une anomalie", target: a.type, category: "validation" });
    notify();
    toast.success("Anomalie résolue");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Suivi des anomalies</h2>
          <p className="text-sm text-muted-foreground">Catégorisez et résolvez les anomalies par région et gravité.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ajouter anomalie</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["critique", "moyen", "faible"] as Severity[]).map((s) => {
          const count = store.anomalies.filter((a) => a.severity === s && a.status !== "résolue").length;
          return (
            <Card key={s}>
              <CardContent className="pt-5 flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  s === "critique" ? "bg-destructive/15 text-destructive" :
                  s === "moyen" ? "bg-warning/15 text-warning" :
                  "bg-success/15 text-success"
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground capitalize">Gravité {s}</div>
                  <div className="text-2xl font-display font-bold">{count}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anomalies</CardTitle>
          <CardDescription>{filtered.length} résultats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher…" className="pl-9" />
            </div>
            <Select value={region} onValueChange={(v) => { setRegion(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Région" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="comptable">Comptable</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="juridique">Juridique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Gravité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="ouverte">Ouverte</SelectItem>
                <SelectItem value="en cours">En cours</SelectItem>
                <SelectItem value="résolue">Résolue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Anomalie</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Dossier</TableHead>
                  <TableHead>Gravité</TableHead>
                  <TableHead>Assigné à</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((a) => (
                  <TableRow key={a.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <div className="font-medium">{a.type}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(a.date), "dd MMM yyyy", { locale: fr })}</div>
                    </TableCell>
                    <TableCell><StatusBadge tone="primary">{a.category}</StatusBadge></TableCell>
                    <TableCell><StatusBadge tone="info">{a.region}</StatusBadge></TableCell>
                    <TableCell className="text-xs">{a.dossier}</TableCell>
                    <TableCell><StatusBadge tone={sevTone(a.severity)} dot>{a.severity}</StatusBadge></TableCell>
                    <TableCell>{a.assignedTo}</TableCell>
                    <TableCell>
                      <StatusBadge tone={a.status === "résolue" ? "success" : a.status === "en cours" ? "info" : "warning"} dot>{a.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(a)} title="Voir"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)} title="Modifier"><Pencil className="h-4 w-4" /></Button>
                        {a.status !== "résolue" && (
                          <Button variant="ghost" size="icon" onClick={() => resolve(a)} title="Résoudre"><Check className="h-4 w-4 text-success" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {slice.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">Aucune anomalie</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-muted-foreground">Page {page} / {pages}</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Précédent</Button>
                <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'anomalie" : "Nouvelle anomalie"}</DialogTitle>
            <DialogDescription>Décrivez la nature et la gravité.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Type / Titre</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Dossier</Label><Input value={form.dossier} onChange={(e) => setForm({ ...form, dossier: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Anomaly["category"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comptable">Comptable</SelectItem>
                    <SelectItem value="fiscal">Fiscal</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="juridique">Juridique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Région</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v as Region })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Gravité</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v as Severity })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faible">Faible</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Anomaly["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ouverte">Ouverte</SelectItem>
                    <SelectItem value="en cours">En cours</SelectItem>
                    <SelectItem value="résolue">Résolue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Assigné à</Label><Input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>{editing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.type}</DialogTitle>
            <DialogDescription>{detail?.dossier} · {detail?.region}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Catégorie</div><div className="font-medium capitalize">{detail.category}</div></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Gravité</div><StatusBadge tone={sevTone(detail.severity)} dot>{detail.severity}</StatusBadge></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Assigné à</div><div className="font-medium">{detail.assignedTo}</div></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Statut</div><StatusBadge tone={detail.status === "résolue" ? "success" : "warning"} dot>{detail.status}</StatusBadge></div>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3 text-sm">{detail.description}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
