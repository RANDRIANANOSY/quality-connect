import { useState } from "react";
import {
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Building2,
  RefreshCcw,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { store, REGIONS, Region } from "@/data/store";
import { useStore } from "@/data/useStore";
import { Progress } from "@/components/ui/progress";

const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const dossiersTrend = months.map((m, i) => ({
  month: m,
  dossiers: 80 + Math.round(Math.sin(i / 1.7) * 25 + i * 4),
  validés: 60 + Math.round(Math.sin(i / 1.5) * 20 + i * 3),
}));

const COLORS = ["hsl(243 75% 59%)", "hsl(250 90% 70%)", "hsl(199 89% 48%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)"];

export default function Overview() {
  useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [detailRegion, setDetailRegion] = useState<Region | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const totalDossiers = store.agencies.reduce((s, a) => s + a.dossiers, 0);
  const anomaliesOuvertes = store.anomalies.filter((a) => a.status !== "résolue").length;
  const validationsAttente = store.validations.filter((v) => v.status === "en attente").length;
  const agencesActives = store.agencies.filter((a) => a.status === "actif").length;

  const perRegion = REGIONS.map((r) => {
    const ags = store.agencies.filter((a) => a.region === r);
    const dossiers = ags.reduce((s, a) => s + a.dossiers, 0);
    const clients = ags.reduce((s, a) => s + a.clients.length, 0);
    const projects = ags.reduce((s, a) => s + a.projects.length, 0);
    const anomalies = store.anomalies.filter((a) => a.region === r).length;
    const validations = store.validations.filter((v) => v.region === r).length;
    const score = Math.max(0, 100 - anomalies * 8);
    return { region: r, agencies: ags.length, dossiers, clients, projects, anomalies, validations, score };
  });

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("Données actualisées", { description: "Toutes les métriques sont à jour." });
    }, 700);
  };

  const stats = [
    {
      label: "Dossiers partagés",
      value: store.dossiers.length,
      total: totalDossiers,
      trend: "+12%",
      trendUp: true,
      icon: FolderKanban,
      tone: "from-primary to-primary-glow",
    },
    {
      label: "Anomalies en cours",
      value: anomaliesOuvertes,
      trend: "-3",
      trendUp: false,
      icon: AlertTriangle,
      tone: "from-orange-500 to-red-500",
    },
    {
      label: "Validations en attente",
      value: validationsAttente,
      trend: "+2",
      trendUp: true,
      icon: CheckCircle2,
      tone: "from-emerald-500 to-teal-500",
    },
    {
      label: "Agences actives",
      value: agencesActives,
      total: store.agencies.length,
      trend: "stable",
      trendUp: true,
      icon: Building2,
      tone: "from-sky-500 to-indigo-500",
    },
  ];

  const detail = detailRegion
    ? perRegion.find((p) => p.region === detailRegion)
    : null;
  const detailAgencies = detailRegion
    ? store.agencies.filter((a) => a.region === detailRegion)
    : [];
  const detailProjects = detailAgencies.flatMap((a) =>
    a.projects.map((p) => ({ ...p, agency: a.name, manager: a.manager }))
  );

  return (
    <div className="space-y-6">
      {/* Top actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Tableau de bord</h2>
          <p className="text-sm text-muted-foreground">Synthèse de l'activité multi-agences en temps réel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button onClick={() => { setDetailRegion(REGIONS[0]); setDetailsOpen(true); }}>
            <Eye className="h-4 w-4 mr-2" />
            Voir détails
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="overflow-hidden relative group hover:shadow-elegant transition-shadow">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.tone}`} />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{s.label}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-3xl font-display font-bold">{s.value}</div>
                    {s.total !== undefined && (
                      <div className="text-sm text-muted-foreground">/ {s.total}</div>
                    )}
                  </div>
                  <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${s.trendUp ? "text-success" : "text-destructive"}`}>
                    {s.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {s.trend}
                  </div>
                </div>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${s.tone} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des dossiers</CardTitle>
            <CardDescription>Dossiers traités vs validés sur 12 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dossiersTrend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(243 75% 59%)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="dossiers" stroke="hsl(243 75% 59%)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="validés" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par région</CardTitle>
            <CardDescription>Dossiers gérés</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={perRegion.filter((r) => r.dossiers > 0)}
                  dataKey="dossiers"
                  nameKey="region"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {perRegion.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {perRegion.filter((r) => r.dossiers > 0).map((r, i) => (
                <div key={r.region} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="flex-1">{r.region}</span>
                  <span className="font-medium">{r.dossiers}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance par région */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Performance générale par région</CardTitle>
            <CardDescription>Score qualité, charge de travail et indicateurs clés</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Région</TableHead>
                  <TableHead className="text-right">Agences</TableHead>
                  <TableHead className="text-right">Clients</TableHead>
                  <TableHead className="text-right">Dossiers</TableHead>
                  <TableHead className="text-right">Projets</TableHead>
                  <TableHead className="text-right">Anomalies</TableHead>
                  <TableHead className="w-48">Score qualité</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perRegion.map((r) => (
                  <TableRow key={r.region} className="hover:bg-secondary/40">
                    <TableCell className="font-medium">{r.region}</TableCell>
                    <TableCell className="text-right">{r.agencies}</TableCell>
                    <TableCell className="text-right">{r.clients}</TableCell>
                    <TableCell className="text-right">{r.dossiers}</TableCell>
                    <TableCell className="text-right">{r.projects}</TableCell>
                    <TableCell className="text-right">
                      {r.anomalies > 0 ? (
                        <StatusBadge tone={r.anomalies > 2 ? "danger" : "warning"}>{r.anomalies}</StatusBadge>
                      ) : (
                        <StatusBadge tone="success">0</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.score} className="h-1.5" />
                        <span className="text-xs font-medium w-9 text-right">{r.score}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setDetailRegion(r.region); setDetailsOpen(true); }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="region" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="dossiers" fill="hsl(243 75% 59%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="clients" fill="hsl(199 89% 48%)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="projects" fill="hsl(38 92% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>Détails — Région {detailRegion}</DialogTitle>
            <DialogDescription>
              Vue complète des indicateurs et projets de la région.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Agences", value: detail.agencies },
                  { label: "Clients", value: detail.clients },
                  { label: "Dossiers", value: detail.dossiers },
                  { label: "Score qualité", value: `${detail.score}%` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-border p-3 bg-secondary/40">
                    <div className="text-[11px] uppercase text-muted-foreground">{s.label}</div>
                    <div className="text-xl font-display font-bold mt-1">{s.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Liste des projets</h4>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projet</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead className="w-32">Avancement</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailProjects.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                            Aucun projet
                          </TableCell>
                        </TableRow>
                      )}
                      {detailProjects.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.client}</TableCell>
                          <TableCell>{p.manager}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={p.progress} className="h-1.5" />
                              <span className="text-xs w-9 text-right">{p.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              tone={p.status === "terminé" ? "success" : p.status === "retard" ? "danger" : "info"}
                              dot
                            >
                              {p.status}
                            </StatusBadge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Agences de la région</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {detailAgencies.map((a) => (
                    <div key={a.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-sm">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.location}</div>
                        </div>
                        <StatusBadge tone={a.status === "actif" ? "success" : "neutral"} dot>
                          {a.status}
                        </StatusBadge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Responsable : <span className="text-foreground font-medium">{a.manager}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {a.dossiers} dossiers · {a.members.length} membres · {a.clients.length} clients
                      </div>
                    </div>
                  ))}
                  {detailAgencies.length === 0 && (
                    <div className="text-sm text-muted-foreground">Aucune agence dans cette région.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
