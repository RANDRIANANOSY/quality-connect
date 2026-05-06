import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MapPin, Users, Briefcase, FolderKanban, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/StatusBadge";
import { store, uid, notify } from "@/data/store";
import { useStore } from "@/data/useStore";
import { toast } from "sonner";

export default function AgencyDetail() {
  useStore();
  const { id } = useParams();
  const nav = useNavigate();
  const a = store.agencies.find((x) => x.id === id);

  if (!a) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Agence introuvable.</p>
        <Button asChild className="mt-4"><Link to="/agencies">Retour</Link></Button>
      </div>
    );
  }

  const addClient = () => {
    a.clients.push({
      id: uid(),
      name: `Nouveau client ${a.clients.length + 1}`,
      siret: `MG-${Math.floor(Math.random() * 999)}-2025`,
      status: "prospect",
      revenue: Math.floor(Math.random() * 1000000),
    });
    notify();
    toast.success("Client ajouté");
  };

  const addMember = () => {
    a.members.push({ id: uid(), name: `Nouveau membre`, role: "Comptable" });
    notify();
    toast.success("Membre ajouté");
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => nav("/agencies")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux agences
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="h-24 gradient-primary" />
          <CardContent className="-mt-10">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 rounded-xl bg-card border-4 border-card shadow-elegant flex items-center justify-center text-2xl font-display font-bold gradient-primary text-white">
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="pb-1">
                  <h2 className="text-xl font-display font-bold">{a.name}</h2>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {a.location}
                  </div>
                </div>
              </div>
              <StatusBadge tone={a.status === "actif" ? "success" : "neutral"} dot>{a.status}</StatusBadge>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground">Responsable</div>
                <div className="font-medium text-sm">{a.manager}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />Email</div>
                <div className="font-medium text-sm truncate">{a.email}</div>
              </div>
              <div className="rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Téléphone</div>
                <div className="font-medium text-sm">{a.phone}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Indicateurs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: FolderKanban, label: "Dossiers", value: a.dossiers },
              { icon: Users, label: "Membres", value: a.members.length },
              { icon: Briefcase, label: "Clients", value: a.clients.length },
              { icon: Briefcase, label: "Projets actifs", value: a.projects.filter((p) => p.status !== "terminé").length },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/60">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 text-sm">{s.label}</div>
                <div className="font-display font-semibold">{s.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients">Clients en cours</TabsTrigger>
          <TabsTrigger value="projects">Projets</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Tous les clients</CardTitle>
                <CardDescription>Portefeuille clients de l'agence</CardDescription>
              </div>
              <Button size="sm" onClick={addClient}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>SIRET</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">CA (Ar)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {a.clients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.siret}</TableCell>
                      <TableCell><StatusBadge tone={c.status === "actif" ? "success" : "info"} dot>{c.status}</StatusBadge></TableCell>
                      <TableCell className="text-right font-mono">{c.revenue.toLocaleString("fr-FR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <div className="space-y-4">
            {a.projects.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <CardDescription>{p.client}</CardDescription>
                    </div>
                    <StatusBadge tone={p.status === "terminé" ? "success" : p.status === "retard" ? "danger" : "info"} dot>
                      {p.status}
                    </StatusBadge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Début:</span> {new Date(p.startDate).toLocaleDateString("fr-FR")}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Fin:</span> {new Date(p.endDate).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">Progression</span>
                      <span className="text-sm font-mono">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} className="h-2" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Dossiers */}
                  <div>
                    <h4 className="font-medium mb-3">Dossiers ({p.dossiers.total})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">À utiliser</div>
                        <div className="text-sm font-medium">{p.dossiers.toUse.length}</div>
                        {p.dossiers.toUse.length > 0 && (
                          <ul className="text-xs mt-1 space-y-1">
                            {p.dossiers.toUse.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">• {d}</li>
                            ))}
                            {p.dossiers.toUse.length > 3 && <li className="text-muted-foreground">+{p.dossiers.toUse.length - 3} autres</li>}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Reçus</div>
                        <div className="text-sm font-medium text-green-600">{p.dossiers.received.length}</div>
                        {p.dossiers.received.length > 0 && (
                          <ul className="text-xs mt-1 space-y-1">
                            {p.dossiers.received.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">• {d}</li>
                            ))}
                            {p.dossiers.received.length > 3 && <li className="text-muted-foreground">+{p.dossiers.received.length - 3} autres</li>}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">En attente</div>
                        <div className="text-sm font-medium text-yellow-600">{p.dossiers.pending.length}</div>
                        {p.dossiers.pending.length > 0 && (
                          <ul className="text-xs mt-1 space-y-1">
                            {p.dossiers.pending.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">• {d}</li>
                            ))}
                            {p.dossiers.pending.length > 3 && <li className="text-muted-foreground">+{p.dossiers.pending.length - 3} autres</li>}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">En retard</div>
                        <div className="text-sm font-medium text-orange-600">{p.dossiers.late.length}</div>
                        {p.dossiers.late.length > 0 && (
                          <ul className="text-xs mt-1 space-y-1">
                            {p.dossiers.late.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">• {d}</li>
                            ))}
                            {p.dossiers.late.length > 3 && <li className="text-muted-foreground">+{p.dossiers.late.length - 3} autres</li>}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Manquants</div>
                        <div className="text-sm font-medium text-red-600">{p.dossiers.missing.length}</div>
                        {p.dossiers.missing.length > 0 && (
                          <ul className="text-xs mt-1 space-y-1">
                            {p.dossiers.missing.slice(0, 3).map((d, i) => (
                              <li key={i} className="truncate">• {d}</li>
                            ))}
                            {p.dossiers.missing.length > 3 && <li className="text-muted-foreground">+{p.dossiers.missing.length - 3} autres</li>}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tâches */}
                  <div>
                    <h4 className="font-medium mb-3">Tâches</h4>
                    <div className="space-y-2">
                      {p.tasks.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded-md border border-border">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{t.name}</div>
                            <div className="text-xs text-muted-foreground">Assigné à: {t.assignedTo}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge tone={
                              t.status === "terminé" ? "success" :
                              t.status === "en cours" ? "info" : "neutral"
                            } dot>
                              {t.status}
                            </StatusBadge>
                            <div className="text-xs text-muted-foreground">
                              Échéance: {new Date(t.dueDate).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anomalies */}
                  {p.anomalies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Anomalies ({p.anomalies.length})</h4>
                      <div className="text-sm text-muted-foreground">
                        Voir la section Anomalies pour plus de détails
                      </div>
                    </div>
                  )}

                  {/* Pièces jointes */}
                  {p.attachments.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Pièces jointes</h4>
                      <div className="space-y-2">
                        {p.attachments.map((att) => (
                          <div key={att.id} className="flex items-center justify-between p-2 rounded-md border border-border">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{att.name}</div>
                              <div className="text-xs text-muted-foreground uppercase">{att.type}</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{att.size}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Équipe de l'agence</CardTitle>
                <CardDescription>{a.members.length} membres</CardDescription>
              </div>
              <Button size="sm" onClick={addMember}><Plus className="h-4 w-4 mr-1.5" />Ajouter</Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-3">
                {a.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:shadow-sm transition">
                    <Avatar><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium text-sm">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
