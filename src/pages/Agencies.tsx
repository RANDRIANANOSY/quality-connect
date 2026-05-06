import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Eye, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { store, REGIONS, Region, Agency, uid, nowIso, notify, logAudit } from "@/data/store";
import { useStore } from "@/data/useStore";

const empty: Omit<Agency, "id"> = {
  name: "",
  region: "Antananarivo",
  location: "",
  dossiers: 0,
  status: "actif",
  manager: "",
  email: "",
  phone: "",
  createdAt: nowIso(),
  members: [],
  clients: [],
  projects: [],
};

function perfScore(a: Agency) {
  const projs = a.projects;
  if (!projs.length) return 0;
  const avg = projs.reduce((s, p) => s + p.progress, 0) / projs.length;
  const penalty = projs.filter((p) => p.status === "retard").length * 10;
  return Math.max(0, Math.min(100, Math.round(avg - penalty)));
}

export default function Agencies() {
  useStore();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manager, setManager] = useState<string>("all");
  const [perf, setPerf] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agency | null>(null);
  const [form, setForm] = useState<Omit<Agency, "id">>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const managers = Array.from(new Set(store.agencies.map((a) => a.manager)));

  const filtered = store.agencies.filter((a) => {
    if (region !== "all" && a.region !== region) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (manager !== "all" && a.manager !== manager) return false;
    if (perf !== "all") {
      const s = perfScore(a);
      if (perf === "high" && s < 75) return false;
      if (perf === "mid" && (s < 50 || s >= 75)) return false;
      if (perf === "low" && s >= 50) return false;
    }
    if (search && !`${a.name} ${a.manager} ${a.location}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, createdAt: nowIso() });
    setDialogOpen(true);
  };
  const openEdit = (a: Agency) => {
    setEditing(a);
    setForm(a);
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.name || !form.manager) {
      toast.error("Nom et responsable obligatoires.");
      return;
    }
    if (editing) {
      Object.assign(editing, form);
      logAudit({ user: "Admin", action: "a modifié l'agence", target: form.name, category: "modification" });
      toast.success("Agence modifiée");
    } else {
      const newAg: Agency = { id: uid(), ...form };
      store.agencies.push(newAg);
      logAudit({ user: "Admin", action: "a créé l'agence", target: form.name, category: "création" });
      toast.success("Agence créée");
    }
    notify();
    setDialogOpen(false);
  };
  const confirmDelete = () => {
    if (!deleteId) return;
    const ag = store.agencies.find((a) => a.id === deleteId);
    store.agencies = store.agencies.filter((a) => a.id !== deleteId);
    if (ag) logAudit({ user: "Admin", action: "a supprimé l'agence", target: ag.name, category: "suppression" });
    notify();
    toast.success("Agence supprimée");
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Multi-agences</h2>
          <p className="text-sm text-muted-foreground">Gestion centralisée du réseau d'agences comptables.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter une agence
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total agences", value: store.agencies.length },
          { label: "Agences actives", value: store.agencies.filter((a) => a.status === "actif").length },
          { label: "Régions couvertes", value: new Set(store.agencies.map((a) => a.region)).size },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
                <div className="text-2xl font-display font-bold">{k.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des agences</CardTitle>
          <CardDescription>Recherchez, filtrez et gérez les agences du réseau.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9" />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Responsable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous responsables</SelectItem>
                {managers.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={perf} onValueChange={setPerf}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Performance" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute performance</SelectItem>
                <SelectItem value="high">Élevée (≥75)</SelectItem>
                <SelectItem value="mid">Moyenne (50-74)</SelectItem>
                <SelectItem value="low">Faible (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Agence</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead className="text-right">Dossiers</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="w-40">Performance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const score = perfScore(a);
                  const tone = score >= 75 ? "success" : score >= 50 ? "warning" : "danger";
                  return (
                  <TableRow key={a.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.location}</div>
                    </TableCell>
                    <TableCell><StatusBadge tone="info">{a.region}</StatusBadge></TableCell>
                    <TableCell className="text-right font-mono">{a.dossiers}</TableCell>
                    <TableCell>{a.manager}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full ${tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-destructive"}`} style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs font-mono w-9 text-right">{score}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={a.status === "actif" ? "success" : "neutral"} dot>{a.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Voir détails">
                          <Link to={`/agencies/${a.id}`}><Eye className="h-4 w-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Supprimer" onClick={() => setDeleteId(a.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Aucune agence ne correspond aux filtres.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dossiers Audit Fiscal (Version Professionnelle)</CardTitle>
          <CardDescription>Liste de tous les dossiers liés aux audits fiscaux professionnels.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Dossier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Agences</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Taille</TableHead>
                  <TableHead>Propriétaire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.dossiers
                  .filter((d) => d.name.toLowerCase().includes("audit fiscal") || d.name.toLowerCase().includes("audit"))
                  .map((d) => (
                    <TableRow key={d.id} className="hover:bg-secondary/40">
                      <TableCell className="font-medium">{d.name}</TableCell>
                      <TableCell>{d.client}</TableCell>
                      <TableCell><StatusBadge tone="info">{d.region}</StatusBadge></TableCell>
                      <TableCell className="text-sm">
                        {d.agencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {d.agencies.slice(0, 2).map((agId) => {
                              const agency = store.agencies.find((a) => a.id === agId);
                              return agency ? (
                                <StatusBadge key={agId} tone="neutral" className="text-xs">
                                  {agency.name}
                                </StatusBadge>
                              ) : null;
                            })}
                            {d.agencies.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{d.agencies.length - 2} autres</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Aucune</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone={
                          d.status === "partagé" ? "success" :
                          d.status === "privé" ? "neutral" : "warning"
                        } dot>
                          {d.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{d.size}</TableCell>
                      <TableCell className="text-sm">{d.owner}</TableCell>
                    </TableRow>
                  ))}
                {store.dossiers.filter((d) => d.name.toLowerCase().includes("audit fiscal") || d.name.toLowerCase().includes("audit")).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      Aucun dossier d'audit fiscal trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'agence" : "Nouvelle agence"}</DialogTitle>
            <DialogDescription>Renseignez les informations principales.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nom de l'agence</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Région</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v as Region })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "actif" | "inactif" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Localisation</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Responsable</Label>
              <Input value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Nombre de dossiers</Label>
              <Input type="number" value={form.dossiers} onChange={(e) => setForm({ ...form, dossiers: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={submit}>{editing ? "Enregistrer" : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette agence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données liées resteront mais ne seront plus rattachées à cette agence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
