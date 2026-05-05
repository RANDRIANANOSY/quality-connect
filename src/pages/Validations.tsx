import { useState } from "react";
import { Check, X, Eye, MessageSquare, Lock, Search, Bell, History, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { store, REGIONS, Validation, uid, nowIso, notify, logAudit } from "@/data/store";
import { useStore } from "@/data/useStore";

type ActionType = "validé" | "rejeté" | "clôturé";

const actionLabel: Record<ActionType, string> = {
  validé: "Valider",
  rejeté: "Rejeter",
  clôturé: "Clôturer",
};

const scoreTone = (s?: number) => (s == null ? "neutral" : s >= 85 ? "success" : s >= 70 ? "warning" : "danger");

export default function Validations() {
  useStore();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [type, setType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [detail, setDetail] = useState<Validation | null>(null);
  const [comment, setComment] = useState("");
  const [actionTarget, setActionTarget] = useState<{ v: Validation; action: ActionType } | null>(null);
  const [motif, setMotif] = useState("");
  const [notifyUser, setNotifyUser] = useState(true);

  const filtered = store.validations.filter((v) => {
    if (region !== "all" && v.region !== region) return false;
    if (type !== "all" && v.type !== type) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search && !`${v.dossier} ${v.sentBy}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const lowQualityPending = store.validations.filter((v) => v.status === "en attente" && (v.qualityScore ?? 100) < 70).length;

  const askAction = (v: Validation, action: ActionType) => {
    setActionTarget({ v, action });
    setMotif("");
    setNotifyUser(true);
  };

  const confirmAction = () => {
    if (!actionTarget) return;
    if (!motif.trim()) {
      toast.error("Le motif est obligatoire");
      return;
    }
    const { v, action } = actionTarget;
    v.status = action;
    v.history = [
      ...(v.history || []),
      { id: uid(), action: actionLabel[action] + (action === "validé" ? "" : ""), author: "Admin", motif, notified: notifyUser, date: nowIso() },
    ];
    logAudit({ user: "Admin", action: `a ${action} la validation`, target: v.dossier, category: "validation" });
    if (notifyUser) toast.success(`${v.sentBy} a été notifié`);
    notify();
    toast.success(`Validation ${action}`);
    setActionTarget(null);
    if (detail && detail.id === v.id) setDetail({ ...v });
  };

  const addComment = () => {
    if (!detail || !comment.trim()) return;
    detail.comments.push({ id: uid(), author: "Admin", text: comment, date: nowIso() });
    notify();
    setComment("");
    toast.success("Commentaire ajouté");
  };

  const counts = {
    attente: store.validations.filter((v) => v.status === "en attente").length,
    validé: store.validations.filter((v) => v.status === "validé").length,
    rejeté: store.validations.filter((v) => v.status === "rejeté").length,
    clôturé: store.validations.filter((v) => v.status === "clôturé").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Validation centralisée</h2>
        <p className="text-sm text-muted-foreground">Approuvez, rejetez ou clôturez avec motif obligatoire et traçabilité complète.</p>
      </div>

      {lowQualityPending > 0 && (
        <Alert className="border-warning/40 bg-warning/5">
          <Sparkles className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Alerte qualité</AlertTitle>
          <AlertDescription>
            {lowQualityPending} dossier(s) en attente avec un score qualité &lt; 70 — vérification approfondie recommandée.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "En attente", value: counts.attente, tone: "warning" as const },
          { label: "Validés", value: counts.validé, tone: "success" as const },
          { label: "Rejetés", value: counts.rejeté, tone: "danger" as const },
          { label: "Clôturés", value: counts.clôturé, tone: "neutral" as const },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="flex items-baseline gap-2 mt-1">
                <div className="text-2xl font-display font-bold">{s.value}</div>
                <StatusBadge tone={s.tone} dot>{s.tone === "warning" ? "À traiter" : "Total"}</StatusBadge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File des validations</CardTitle>
          <CardDescription>{filtered.length} demandes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher dossier ou auteur…" className="pl-9" />
            </div>
            <Select value={region} onValueChange={(v) => { setRegion(v); setPage(1); }}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="écriture">Écriture</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="TVA">TVA</SelectItem>
                <SelectItem value="bilan">Bilan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="en attente">En attente</SelectItem>
                <SelectItem value="validé">Validé</SelectItem>
                <SelectItem value="rejeté">Rejeté</SelectItem>
                <SelectItem value="clôturé">Clôturé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Dossier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Envoyé par</TableHead>
                  <TableHead>Score qualité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slice.map((v) => (
                  <TableRow key={v.id} className="hover:bg-secondary/40">
                    <TableCell className="font-medium">{v.dossier}</TableCell>
                    <TableCell><StatusBadge tone="primary">{v.type}</StatusBadge></TableCell>
                    <TableCell><StatusBadge tone="info">{v.region}</StatusBadge></TableCell>
                    <TableCell>{v.sentBy}</TableCell>
                    <TableCell>
                      <StatusBadge tone={scoreTone(v.qualityScore)} dot>{v.qualityScore ?? "—"}{v.qualityScore != null ? "/100" : ""}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-xs">{format(new Date(v.date), "dd MMM", { locale: fr })}</TableCell>
                    <TableCell>
                      <StatusBadge tone={v.status === "validé" ? "success" : v.status === "rejeté" ? "danger" : v.status === "clôturé" ? "neutral" : "warning"} dot>{v.status}</StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetail(v)} title="Voir"><Eye className="h-4 w-4" /></Button>
                        {v.status === "en attente" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => askAction(v, "validé")} title="Valider"><Check className="h-4 w-4 text-success" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => askAction(v, "rejeté")} title="Rejeter"><X className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                        {(v.status === "validé" || v.status === "rejeté") && (
                          <Button variant="ghost" size="icon" onClick={() => askAction(v, "clôturé")} title="Clôturer"><Lock className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {slice.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">Aucune validation</TableCell></TableRow>}
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

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detail?.dossier}</DialogTitle>
            <DialogDescription>{detail?.type} · {detail?.region} · envoyé par {detail?.sentBy}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Statut</div>
                  <StatusBadge tone={detail.status === "validé" ? "success" : detail.status === "rejeté" ? "danger" : detail.status === "clôturé" ? "neutral" : "warning"} dot>{detail.status}</StatusBadge>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Score qualité</div>
                  <StatusBadge tone={scoreTone(detail.qualityScore)} dot>{detail.qualityScore ?? "—"}</StatusBadge>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Montant</div>
                  <div className="font-mono font-medium text-sm">{detail.amount?.toLocaleString("fr-FR") || "—"}</div>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Date</div>
                  <div className="text-sm">{format(new Date(detail.date), "dd MMM yyyy", { locale: fr })}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                  <History className="h-4 w-4" /> Historique des validations ({detail.history?.length || 0})
                </div>
                <div className="relative pl-4 border-l border-border space-y-3">
                  {(detail.history || []).map((h) => (
                    <div key={h.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{h.action}</span>
                        {h.notified && <StatusBadge tone="info"><Bell className="h-3 w-3 mr-1" />Notifié</StatusBadge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{h.author} · {format(new Date(h.date), "dd MMM yyyy HH:mm", { locale: fr })}</div>
                      {h.motif && <div className="text-xs mt-1 italic text-muted-foreground">« {h.motif} »</div>}
                    </div>
                  ))}
                  {(!detail.history || detail.history.length === 0) && <div className="text-xs text-muted-foreground">Aucun historique</div>}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-2">
                  <MessageSquare className="h-4 w-4" /> Commentaires ({detail.comments.length})
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detail.comments.map((c) => (
                    <div key={c.id} className="rounded-lg bg-secondary/60 p-2.5">
                      <div className="flex items-baseline justify-between">
                        <div className="text-xs font-semibold">{c.author}</div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(c.date), "dd MMM HH:mm", { locale: fr })}</div>
                      </div>
                      <div className="text-sm mt-0.5">{c.text}</div>
                    </div>
                  ))}
                  {detail.comments.length === 0 && <div className="text-xs text-muted-foreground">Aucun commentaire</div>}
                </div>
                <div className="mt-2 flex gap-2">
                  <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Ajouter un commentaire…" />
                  <Button onClick={addComment}>Envoyer</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {detail?.status === "en attente" && (
              <>
                <Button variant="outline" onClick={() => askAction(detail, "rejeté")}><X className="h-4 w-4 mr-2" />Rejeter</Button>
                <Button onClick={() => askAction(detail, "validé")}><Check className="h-4 w-4 mr-2" />Valider</Button>
              </>
            )}
            {detail && (detail.status === "validé" || detail.status === "rejeté") && (
              <Button variant="outline" onClick={() => askAction(detail, "clôturé")}>
                <Lock className="h-4 w-4 mr-2" />Clôturer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Motif modal */}
      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget && actionLabel[actionTarget.action]} — {actionTarget?.v.dossier}
            </DialogTitle>
            <DialogDescription>
              Indiquez un motif (obligatoire) pour assurer la traçabilité de cette action.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Motif <span className="text-destructive">*</span></Label>
              <Textarea
                rows={4}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Ex: Bilan conforme aux normes IFRS, écritures équilibrées…"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-1.5"><Bell className="h-4 w-4" />Notifier le collaborateur</div>
                <div className="text-xs text-muted-foreground">{actionTarget?.v.sentBy} recevra une notification.</div>
              </div>
              <Switch checked={notifyUser} onCheckedChange={setNotifyUser} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionTarget(null)}>Annuler</Button>
            <Button onClick={confirmAction} disabled={!motif.trim()}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
