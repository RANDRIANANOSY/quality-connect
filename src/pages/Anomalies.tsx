import { useState, useMemo } from "react";
import { Plus, Pencil, Eye, Search, AlertTriangle, Check, Paperclip, Clock, MessageSquare, Bell } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { store, REGIONS, Region, Anomaly, Severity, uid, nowIso, notify, logAudit } from "@/data/store";
import { useStore } from "@/data/useStore";

const empty: Omit<Anomaly, "id"> = {
  type: "",
  category: "comptable",
  dossier: "",
  client: "",
  mission: "",
  region: "Antananarivo",
  severity: "moyen",
  status: "ouverte",
  assignedTo: "",
  date: nowIso(),
  startDate: nowIso(),
  endDate: nowIso(),
  description: "",
  attachments: [],
  timeline: [],
  comments: [],
};

const sevTone = (s: Severity) => (s === "critique" ? "danger" : s === "moyen" ? "warning" : "success");

export default function Anomalies() {
  useStore();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [project, setProject] = useState("all");
  const [user, setUser] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Anomaly | null>(null);
  const [form, setForm] = useState<Omit<Anomaly, "id">>(empty);
  const [detail, setDetail] = useState<Anomaly | null>(null);
  const [comment, setComment] = useState("");

  const projects = useMemo(() => Array.from(new Set(store.anomalies.map((a) => a.mission).filter(Boolean))) as string[], []);
  const users = useMemo(() => Array.from(new Set(store.anomalies.map((a) => a.assignedTo))), []);

  const filtered = store.anomalies.filter((a) => {
    if (region !== "all" && a.region !== region) return false;
    if (category !== "all" && a.category !== category) return false;
    if (severity !== "all" && a.severity !== severity) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (project !== "all" && a.mission !== project) return false;
    if (user !== "all" && a.assignedTo !== user) return false;
    if (dateFrom && new Date(a.date) < new Date(dateFrom)) return false;
    if (search && !`${a.type} ${a.dossier} ${a.client ?? ""} ${a.assignedTo}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const criticalOpen = store.anomalies.filter((a) => a.severity === "critique" && a.status !== "résolue").length;

  const openNew = () => { setEditing(null); setForm({ ...empty, date: nowIso(), startDate: nowIso(), endDate: nowIso() }); setOpen(true); };
  const openEdit = (a: Anomaly) => { setEditing(a); setForm(a); setOpen(true); };
  const submit = () => {
    if (!form.type || !form.dossier) return toast.error("Type et dossier requis");
    if (editing) {
      Object.assign(editing, form);
      logAudit({ user: "Admin", action: "a modifié une anomalie", target: form.type, category: "modification" });
      toast.success("Anomalie modifiée");
    } else {
      store.anomalies.unshift({ id: uid(), ...form, timeline: [{ id: uid(), date: nowIso(), author: "Admin", action: "Anomalie créée" }] });
      logAudit({ user: "Admin", action: "a signalé une anomalie", target: form.type, category: "création" });
      toast.success("Anomalie créée");
    }
    notify();
    setOpen(false);
  };

  const resolve = (a: Anomaly) => {
    a.status = "résolue";
    a.timeline = [...(a.timeline || []), { id: uid(), date: nowIso(), author: "Admin", action: "Marquée résolue" }];
    logAudit({ user: "Admin", action: "a résolu une anomalie", target: a.type, category: "validation" });
    notify();
    toast.success("Anomalie résolue");
  };

  const addComment = () => {
    if (!detail || !comment.trim()) return;
    detail.comments = [...(detail.comments || []), { id: uid(), author: "Admin", text: comment, date: nowIso() }];
    detail.timeline = [...(detail.timeline || []), { id: uid(), date: nowIso(), author: "Admin", action: "Commentaire ajouté" }];
    notify();
    setComment("");
    toast.success("Commentaire ajouté");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Suivi des anomalies</h2>
          <p className="text-sm text-muted-foreground">Catégorisez, suivez et résolvez les anomalies par mission et gravité.</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ajouter anomalie</Button>
      </div>

      {criticalOpen > 0 && (
        <Alert className="border-destructive/40 bg-destructive/5">
          <Bell className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Alertes intelligentes</AlertTitle>
          <AlertDescription>
            {criticalOpen} anomalie(s) critique(s) non résolue(s) — action immédiate recommandée.
          </AlertDescription>
        </Alert>
      )}

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
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher anomalie, client, dossier…" className="pl-9" />
            </div>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-40" />
            <Select value={region} onValueChange={(v) => { setRegion(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Région" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={project} onValueChange={(v) => { setProject(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Projet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous projets</SelectItem>
                {projects.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={user} onValueChange={(v) => { setUser(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Utilisateur" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous utilisateurs</SelectItem>
                {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Catégorie" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="comptable">Comptable</SelectItem>
                <SelectItem value="fiscal">Fiscal</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="juridique">Juridique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Gravité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes gravités</SelectItem>
                <SelectItem value="critique">Critique</SelectItem>
                <SelectItem value="moyen">Moyen</SelectItem>
                <SelectItem value="faible">Faible</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Statut" /></SelectTrigger>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Mission</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Gravité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((a) => (
                  <TableRow key={a.id} className="hover:bg-secondary/40">
                    <TableCell>
                      <div className="font-medium">{a.type}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[260px]">{a.description}</div>
                    </TableCell>
                    <TableCell className="text-xs">{a.mission || "—"}</TableCell>
                    <TableCell className="text-xs">{a.client || "—"}</TableCell>
                    <TableCell className="text-xs">{a.startDate ? format(new Date(a.startDate), "dd MMM", { locale: fr }) : "—"}</TableCell>
                    <TableCell className="text-xs">{a.endDate ? format(new Date(a.endDate), "dd MMM", { locale: fr }) : "—"}</TableCell>
                    <TableCell><StatusBadge tone={sevTone(a.severity)} dot>{a.severity}</StatusBadge></TableCell>
                    <TableCell>
                      <StatusBadge tone={a.status === "résolue" ? "success" : a.status === "en cours" ? "info" : "warning"} dot>{a.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setDetail(a)}><Eye className="h-3.5 w-3.5 mr-1" />Voir plus</Button>
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

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'anomalie" : "Nouvelle anomalie"}</DialogTitle>
            <DialogDescription>Décrivez la nature et la gravité.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid gap-1.5"><Label>Type / Titre</Label><Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Dossier</Label><Input value={form.dossier} onChange={(e) => setForm({ ...form, dossier: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Client</Label><Input value={form.client || ""} onChange={(e) => setForm({ ...form, client: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5"><Label>Mission</Label><Input value={form.mission || ""} onChange={(e) => setForm({ ...form, mission: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Date début</Label><Input type="date" value={form.startDate?.slice(0,10) || ""} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Date fin</Label><Input type="date" value={form.endDate?.slice(0,10) || ""} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
            </div>
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

      {/* Detail Sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={sevTone(detail.severity)} dot>{detail.severity}</StatusBadge>
                  <StatusBadge tone={detail.status === "résolue" ? "success" : detail.status === "en cours" ? "info" : "warning"} dot>{detail.status}</StatusBadge>
                </div>
                <SheetTitle className="mt-2">{detail.type}</SheetTitle>
                <SheetDescription>{detail.mission} · {detail.client}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 mt-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Dossier</div><div className="font-medium">{detail.dossier}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Région</div><div className="font-medium">{detail.region}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Début</div><div className="font-medium">{detail.startDate ? format(new Date(detail.startDate), "dd MMM yyyy", { locale: fr }) : "—"}</div></div>
                  <div className="rounded-lg border border-border p-3"><div className="text-xs text-muted-foreground">Fin</div><div className="font-medium">{detail.endDate ? format(new Date(detail.endDate), "dd MMM yyyy", { locale: fr }) : "—"}</div></div>
                  <div className="rounded-lg border border-border p-3 col-span-2"><div className="text-xs text-muted-foreground">Assigné à</div><div className="font-medium">{detail.assignedTo}</div></div>
                </div>

                <div className="rounded-lg bg-secondary/60 p-3 text-sm">{detail.description}</div>

                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"><Paperclip className="h-4 w-4" />Pièces jointes ({detail.attachments?.length || 0})</div>
                  <div className="space-y-1.5">
                    {(detail.attachments || []).map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                        <span className="truncate">{f.name}</span>
                        <span className="text-xs text-muted-foreground">{f.size}</span>
                      </div>
                    ))}
                    {(!detail.attachments || detail.attachments.length === 0) && <div className="text-xs text-muted-foreground">Aucune pièce jointe</div>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"><Clock className="h-4 w-4" />Timeline</div>
                  <div className="relative pl-4 border-l border-border space-y-3">
                    {(detail.timeline || []).map((t) => (
                      <div key={t.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <div className="text-sm font-medium">{t.action}</div>
                        <div className="text-xs text-muted-foreground">{t.author} · {format(new Date(t.date), "dd MMM HH:mm", { locale: fr })}</div>
                      </div>
                    ))}
                    {(!detail.timeline || detail.timeline.length === 0) && <div className="text-xs text-muted-foreground">Aucune activité</div>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"><MessageSquare className="h-4 w-4" />Commentaires ({detail.comments?.length || 0})</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(detail.comments || []).map((c) => (
                      <div key={c.id} className="rounded-lg bg-secondary/60 p-2.5">
                        <div className="flex items-baseline justify-between">
                          <div className="text-xs font-semibold">{c.author}</div>
                          <div className="text-[10px] text-muted-foreground">{format(new Date(c.date), "dd MMM HH:mm", { locale: fr })}</div>
                        </div>
                        <div className="text-sm mt-0.5">{c.text}</div>
                      </div>
                    ))}
                    {(!detail.comments || detail.comments.length === 0) && <div className="text-xs text-muted-foreground">Aucun commentaire</div>}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Ajouter un commentaire…" />
                    <Button onClick={addComment}>Envoyer</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
