import { useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { store, notify } from "@/data/store";
import { useStore } from "@/data/useStore";

const defaults = {
  autoValidationThreshold: 1000000,
  anomalyAlertEmail: true,
  requireDoubleApproval: false,
  retentionDays: 365,
};

export default function Settings() {
  useStore();
  const [s, setS] = useState({ ...store.settings });

  const save = () => {
    store.settings = { ...s };
    notify();
    toast.success("Paramètres enregistrés");
  };
  const reset = () => {
    setS({ ...defaults });
    toast.info("Paramètres réinitialisés");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Paramètres qualité</h2>
        <p className="text-sm text-muted-foreground">Définissez les règles de validation, seuils et notifications.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Règles de validation</CardTitle>
            <CardDescription>Conditions de déclenchement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Seuil de validation automatique (Ar)</Label>
              <Input type="number" value={s.autoValidationThreshold} onChange={(e) => setS({ ...s, autoValidationThreshold: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground">En dessous de ce seuil, les écritures sont validées automatiquement.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="font-medium text-sm">Double approbation</div>
                <div className="text-xs text-muted-foreground">Requiert deux validateurs pour les bilans.</div>
              </div>
              <Switch checked={s.requireDoubleApproval} onCheckedChange={(v) => setS({ ...s, requireDoubleApproval: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomalies & Notifications</CardTitle>
            <CardDescription>Alertes automatiques</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <div className="font-medium text-sm">Alertes email</div>
                <div className="text-xs text-muted-foreground">Envoyer un email pour chaque anomalie critique.</div>
              </div>
              <Switch checked={s.anomalyAlertEmail} onCheckedChange={(v) => setS({ ...s, anomalyAlertEmail: v })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Rétention des logs (jours)</Label>
              <Input type="number" value={s.retentionDays} onChange={(e) => setS({ ...s, retentionDays: Number(e.target.value) })} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4 mr-2" />Réinitialiser</Button>
        <Button onClick={save}><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
      </div>
    </div>
  );
}
