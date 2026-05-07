import { useState } from "react";
import { Plus, Eye, Trash2, Search, Download, Share2, FolderKanban } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { store, REGIONS, Region, Dossier, uid, nowIso, notify, logAudit } from "@/data/store";
import { useStore } from "@/data/useStore";

export default function Dossiers() {
  useStore();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Dossier | null>(null);
  const [form, setForm] = useState<Omit<Dossier, "id">>({
    name: "",
    client: "",
    region: "Antananarivo",
    agencies: [],
    sharedAt: nowIso(),
    status: "partagé",
    size: "1.0 MB",
    owner: "Admin",
  });

  const filtered = store.dossiers.filter((d) => {
    if (region !== "all" && d.region !== region) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !`${d.name} ${d.client}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCsv = () => {
    const rows = [
      ["Nom", "Client", "Région", "Statut", "Date de partage", "Taille", "Propriétaire"],
      ...filtered.map((d) => [d.name, d.client, d.region, d.status, d.sharedAt, d.size, d.owner]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dossiers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const submit = () => {
    if (!form.name || !form.client) return toast.error("Nom et client requis");
    store.dossiers.push({ id: uid(), ...form, sharedAt: nowIso() });
    logAudit({ user: "Admin", action: "a partagé un dossier", target: form.name, category: "partage" });
    notify();
    toast.success("Dossier partagé");
    setOpen(false);
    setForm({ ...form, name: "", client: "", agencies: [] });
  };

  const remove = (id: string) => {
    const d = store.dossiers.find((x) => x.id === id);
    store.dossiers = store.dossiers.filter((x) => x.id !== id);
    if (d) logAudit({ user: "Admin", action: "a supprimé un dossier", target: d.name, category: "suppression" });
    notify();
    toast.success("Dossier supprimé");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Dossiers partagés</h2>
          <p className="text-sm text-muted-foreground">Centralisez et contrôlez les dossiers partagés entre agences.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4 mr-2" />Exporter</Button>
          <Button onClick={() => setOpen(true)}><Share2 className="h-4 w-4 mr-2" />Partager dossier</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des dossiers</CardTitle>
          <CardDescription>{filtered.length} résultats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher dossier ou client…" className="pl-9" />
            </div>
            <Select value={region} onValueChange={(v) => { setRegion(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="partagé">Partagé</SelectItem>
                <SelectItem value="privé">Privé</SelectItem>
                <SelectItem value="archivé">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Dossier</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Agences</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((d) => (
                  <TableRow key={d.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-muted-foreground">{d.size}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{d.client}</TableCell>
                    <TableCell><StatusBadge tone="info">{d.region}</StatusBadge></TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{d.agencies.map((id) => { const ag = store.agencies.find((a) => a.id === id); return <span key={id} className="text-xs px-1.5 py-0.5 rounded bg-secondary">{ag?.name?.split(" ").slice(-1)[0] || id.toUpperCase()}</span>; })}</div></TableCell>
                    <TableCell className="text-xs">{format(new Date(d.sharedAt), "dd MMM yyyy", { locale: fr })}</TableCell>
                    <TableCell><StatusBadge tone={d.status === "partagé" ? "success" : d.status === "privé" ? "warning" : "neutral"} dot>{d.status}</StatusBadge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(d)} title="Voir"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(d.id)} title="Retirer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {slice.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">Aucun dossier</TableCell></TableRow>}
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

      {/* Share dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager un dossier</DialogTitle>
            <DialogDescription>Sélectionnez les agences ayant accès.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nom du dossier</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Client</Label>
              <Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Région</Label>
                <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v as Region })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Dossier["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partagé">Partagé</SelectItem>
                    <SelectItem value="privé">Privé</SelectItem>
                    <SelectItem value="archivé">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Agences ayant accès</Label>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-md border border-border">
                {store.agencies.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.agencies.includes(a.id)}
                      onCheckedChange={(c) => {
                        setForm({
                          ...form,
                          agencies: c ? [...form.agencies, a.id] : form.agencies.filter((x) => x !== a.id),
                        });
                      }}
                    />
                    {a.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit}>Partager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
            <DialogDescription>{detail?.client} · {detail?.region}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Propriétaire</div><div className="font-medium">{detail.owner}</div></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Taille</div><div className="font-medium">{detail.size}</div></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Date</div><div className="font-medium">{format(new Date(detail.sharedAt), "dd MMM yyyy", { locale: fr })}</div></div>
                <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Statut</div><StatusBadge tone="success" dot>{detail.status}</StatusBadge></div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">Agences ayant accès</div>
                <div className="flex flex-wrap gap-1.5">
                  {detail.agencies.map((id) => {
                    const ag = store.agencies.find((a) => a.id === id);
                    return <StatusBadge key={id} tone="primary">{ag?.name || id}</StatusBadge>;
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
