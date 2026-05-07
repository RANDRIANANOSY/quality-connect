import { Check, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/StatusBadge";
import { store, notify, logAudit, uid, nowIso, Region } from "@/data/store";
import { useStore } from "@/data/useStore";

export default function Quality() {
  useStore();

  const toggle = (regionId: string, itemId: string) => {
    const q = store.qualityChecks.find((x) => x.id === regionId);
    if (!q) return;
    const item = q.items.find((i) => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      logAudit({ user: "Admin", action: item.checked ? "a coché un contrôle" : "a décoché un contrôle", target: `${q.region} — ${item.label}`, category: "modification" });
      notify();
    }
  };

  const validateAll = (regionId: string) => {
    const q = store.qualityChecks.find((x) => x.id === regionId);
    if (!q) return;
    q.items.forEach((i) => (i.checked = true));
    logAudit({ user: "Admin", action: "a validé le contrôle qualité", target: q.region, category: "validation" });
    notify();
    toast.success(`Contrôle qualité validé pour ${q.region}`);
  };

  const reportIssue = (region: Region) => {
    store.anomalies.unshift({
      id: uid(),
      type: `Problème contrôle qualité`,
      category: "comptable",
      dossier: `Contrôle qualité ${region}`,
      client: "—",
      mission: `Contrôle qualité ${region}`,
      region,
      severity: "moyen",
      status: "ouverte",
      assignedTo: "Admin",
      date: nowIso(),
      startDate: nowIso(),
      description: `Problème signalé depuis le contrôle qualité de la région ${region}.`,
      attachments: [],
      timeline: [{ id: uid(), date: nowIso(), author: "Admin", action: "Anomalie créée depuis Contrôle qualité" }],
      comments: [],
    });
    logAudit({ user: "Admin", action: "a signalé un problème qualité", target: region, category: "création" });
    notify();
    toast.warning(`Problème signalé`, { description: `Une anomalie a été créée pour ${region}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Contrôle qualité</h2>
        <p className="text-sm text-muted-foreground">Checklist par région — assurez la conformité avant clôture.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {store.qualityChecks.map((q) => {
          const done = q.items.filter((i) => i.checked).length;
          const total = q.items.length;
          const pct = Math.round((done / total) * 100);
          return (
            <Card key={q.id} className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{q.region}</CardTitle>
                  <StatusBadge tone={pct === 100 ? "success" : pct >= 60 ? "info" : "warning"} dot>
                    {pct}%
                  </StatusBadge>
                </div>
                <CardDescription>{done} / {total} contrôles validés</CardDescription>
                <Progress value={pct} className="h-1.5" />
              </CardHeader>
              <CardContent className="space-y-2">
                {q.items.map((item) => (
                  <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
                    <Checkbox checked={item.checked} onCheckedChange={() => toggle(q.id, item.id)} />
                    <span className={`text-sm flex-1 ${item.checked ? "text-muted-foreground line-through" : ""}`}>{item.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      title="Voir justificatif"
                      onClick={(e) => { e.preventDefault(); toast.info(`Justificatif — ${item.label}`); }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  </label>
                ))}
                <div className="flex gap-2 pt-2 border-t border-border mt-3">
                  <Button size="sm" className="flex-1" onClick={() => validateAll(q.id)}>
                    <Check className="h-3.5 w-3.5 mr-1.5" />Valider tout
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reportIssue(q.region)}>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />Signaler
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
