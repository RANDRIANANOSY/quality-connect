// Centralized mock data store for Collaboration & Qualité module.
// Uses a tiny pub/sub so multiple components react to mutations.

export type Region =
  | "Tamatave"
  | "Antananarivo"
  | "Mahajanga"
  | "Fianarantsoa"
  | "Toliara";

export const REGIONS: Region[] = [
  "Tamatave",
  "Antananarivo",
  "Mahajanga",
  "Fianarantsoa",
  "Toliara",
];

export type AgencyStatus = "actif" | "inactif";

export interface Agency {
  id: string;
  name: string;
  region: Region;
  location: string;
  dossiers: number;
  status: AgencyStatus;
  manager: string;
  email: string;
  phone: string;
  createdAt: string;
  members: { id: string; name: string; role: string; avatar?: string }[];
  clients: { id: string; name: string; siret: string; status: "actif" | "prospect"; revenue: number }[];
  projects: { id: string; name: string; client: string; progress: number; deadline: string; status: "en cours" | "terminé" | "retard" }[];
}

export interface Dossier {
  id: string;
  name: string;
  client: string;
  region: Region;
  agencies: string[];
  sharedAt: string;
  status: "partagé" | "privé" | "archivé";
  size: string;
  owner: string;
}

export interface Validation {
  id: string;
  dossier: string;
  type: "écriture" | "audit" | "TVA" | "bilan";
  sentBy: string;
  region: Region;
  status: "en attente" | "validé" | "rejeté" | "clôturé";
  date: string;
  amount?: number;
  qualityScore?: number;
  comments: { id: string; author: string; text: string; date: string }[];
  history: { id: string; action: string; author: string; motif?: string; notified?: boolean; date: string }[];
}

export type Severity = "faible" | "moyen" | "critique";

export interface Anomaly {
  id: string;
  type: string;
  category: "comptable" | "fiscal" | "social" | "juridique";
  dossier: string;
  client?: string;
  mission?: string;
  region: Region;
  severity: Severity;
  status: "ouverte" | "en cours" | "résolue";
  assignedTo: string;
  date: string;
  startDate?: string;
  endDate?: string;
  description: string;
  attachments?: { id: string; name: string; size: string }[];
  timeline?: { id: string; date: string; author: string; action: string }[];
  comments?: { id: string; author: string; text: string; date: string }[];
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  date: string;
  category: "validation" | "modification" | "suppression" | "création" | "partage";
}

export interface Conversation {
  id: string;
  name: string;
  type: "direct" | "group" | "channel";
  participants: string[];
  unread: number;
  lastMessage: string;
  lastDate: string;
  notifications: boolean;
  messages: { id: string; author: string; text: string; date: string; mine?: boolean }[];
}

export interface QualityCheck {
  id: string;
  region: Region;
  items: { id: string; label: string; checked: boolean }[];
}

interface Store {
  agencies: Agency[];
  dossiers: Dossier[];
  validations: Validation[];
  anomalies: Anomaly[];
  auditLogs: AuditLog[];
  conversations: Conversation[];
  qualityChecks: QualityCheck[];
  settings: {
    autoValidationThreshold: number;
    anomalyAlertEmail: boolean;
    requireDoubleApproval: boolean;
    retentionDays: number;
  };
}

const today = new Date();
const daysAgo = (n: number) =>
  new Date(today.getTime() - n * 86400000).toISOString();

export const store: Store = {
  agencies: [
    {
      id: "a1",
      name: "Cabinet Tamatave Centre",
      region: "Tamatave",
      location: "Tamatave, Madagascar",
      dossiers: 42,
      status: "actif",
      manager: "Jean Rakoto",
      email: "tamatave@cabinet.mg",
      phone: "+261 34 12 345 67",
      createdAt: daysAgo(420),
      members: [
        { id: "m1", name: "Jean Rakoto", role: "Manager" },
        { id: "m2", name: "Hery Rasolofo", role: "Comptable senior" },
        { id: "m3", name: "Voahangy R.", role: "Auditrice" },
        { id: "m4", name: "Mamy A.", role: "Assistant" },
      ],
      clients: [
        { id: "c1", name: "SARL Océan Indien", siret: "MG-001-2021", status: "actif", revenue: 1250000 },
        { id: "c2", name: "Port Toamasina SA", siret: "MG-002-2019", status: "actif", revenue: 8400000 },
        { id: "c3", name: "Vanille Export", siret: "MG-003-2022", status: "prospect", revenue: 320000 },
      ],
      projects: [
        { id: "p1", name: "Bilan annuel 2025", client: "SARL Océan Indien", progress: 78, deadline: daysAgo(-12), status: "en cours" },
        { id: "p2", name: "Audit fiscal", client: "Port Toamasina SA", progress: 45, deadline: daysAgo(-30), status: "en cours" },
        { id: "p3", name: "Déclaration TVA T4", client: "Vanille Export", progress: 100, deadline: daysAgo(8), status: "terminé" },
      ],
    },
    {
      id: "a2",
      name: "Cabinet Antananarivo",
      region: "Antananarivo",
      location: "Antananarivo, Madagascar",
      dossiers: 67,
      status: "actif",
      manager: "Marie Andria",
      email: "tana@cabinet.mg",
      phone: "+261 32 45 678 90",
      createdAt: daysAgo(890),
      members: [
        { id: "m5", name: "Marie Andria", role: "Manager" },
        { id: "m6", name: "Tojo Ramanantsoa", role: "Expert-comptable" },
        { id: "m7", name: "Naina B.", role: "Comptable" },
        { id: "m8", name: "Fanja R.", role: "Comptable" },
        { id: "m9", name: "Patrick H.", role: "Stagiaire" },
      ],
      clients: [
        { id: "c4", name: "Tana Tech SAS", siret: "MG-101-2020", status: "actif", revenue: 5200000 },
        { id: "c5", name: "Hôtel Colbert", siret: "MG-102-2018", status: "actif", revenue: 3100000 },
        { id: "c6", name: "Telma Group", siret: "MG-103-2015", status: "actif", revenue: 12500000 },
      ],
      projects: [
        { id: "p4", name: "Consolidation Telma", client: "Telma Group", progress: 62, deadline: daysAgo(-20), status: "en cours" },
        { id: "p5", name: "Paie mensuelle", client: "Hôtel Colbert", progress: 90, deadline: daysAgo(2), status: "retard" },
      ],
    },
    {
      id: "a3",
      name: "Cabinet Mahajanga",
      region: "Mahajanga",
      location: "Mahajanga, Madagascar",
      dossiers: 28,
      status: "actif",
      manager: "Hery Razafy",
      email: "mahajanga@cabinet.mg",
      phone: "+261 33 22 111 00",
      createdAt: daysAgo(310),
      members: [
        { id: "m10", name: "Hery Razafy", role: "Manager" },
        { id: "m11", name: "Lala R.", role: "Comptable" },
      ],
      clients: [
        { id: "c7", name: "Pêcheries du Nord-Ouest", siret: "MG-201-2021", status: "actif", revenue: 980000 },
      ],
      projects: [
        { id: "p6", name: "Bilan 2025", client: "Pêcheries du Nord-Ouest", progress: 30, deadline: daysAgo(-45), status: "en cours" },
      ],
    },
    {
      id: "a4",
      name: "Cabinet Fianarantsoa",
      region: "Fianarantsoa",
      location: "Fianarantsoa, Madagascar",
      dossiers: 19,
      status: "inactif",
      manager: "Soa Rabe",
      email: "fianar@cabinet.mg",
      phone: "+261 34 88 444 22",
      createdAt: daysAgo(180),
      members: [
        { id: "m12", name: "Soa Rabe", role: "Manager" },
      ],
      clients: [
        { id: "c8", name: "Coopérative Vignoble", siret: "MG-301-2022", status: "actif", revenue: 450000 },
      ],
      projects: [
        { id: "p7", name: "Audit coop", client: "Coopérative Vignoble", progress: 10, deadline: daysAgo(-60), status: "en cours" },
      ],
    },
  ],

  dossiers: [
    { id: "d1", name: "Bilan 2025 - Océan Indien", client: "SARL Océan Indien", region: "Tamatave", agencies: ["a1", "a2"], sharedAt: daysAgo(3), status: "partagé", size: "12.4 MB", owner: "Jean Rakoto" },
    { id: "d2", name: "Audit Telma 2025", client: "Telma Group", region: "Antananarivo", agencies: ["a2"], sharedAt: daysAgo(8), status: "partagé", size: "48.1 MB", owner: "Marie Andria" },
    { id: "d3", name: "TVA Q4 - Vanille", client: "Vanille Export", region: "Tamatave", agencies: ["a1"], sharedAt: daysAgo(14), status: "archivé", size: "3.2 MB", owner: "Hery Rasolofo" },
    { id: "d4", name: "Paie Hôtel Colbert", client: "Hôtel Colbert", region: "Antananarivo", agencies: ["a2", "a1"], sharedAt: daysAgo(1), status: "partagé", size: "1.8 MB", owner: "Tojo Ramanantsoa" },
    { id: "d5", name: "Bilan Pêcheries", client: "Pêcheries du Nord-Ouest", region: "Mahajanga", agencies: ["a3"], sharedAt: daysAgo(20), status: "privé", size: "8.7 MB", owner: "Hery Razafy" },
    { id: "d6", name: "Audit coop vignoble", client: "Coopérative Vignoble", region: "Fianarantsoa", agencies: ["a4"], sharedAt: daysAgo(35), status: "privé", size: "5.5 MB", owner: "Soa Rabe" },
    { id: "d7", name: "Consolidation Telma", client: "Telma Group", region: "Antananarivo", agencies: ["a2", "a3"], sharedAt: daysAgo(5), status: "partagé", size: "22.0 MB", owner: "Marie Andria" },
  ],

  validations: [
    { id: "v1", dossier: "Bilan 2025 - Océan Indien", type: "bilan", sentBy: "Hery Rasolofo", region: "Tamatave", status: "en attente", date: daysAgo(2), amount: 1250000, comments: [] },
    { id: "v2", dossier: "TVA Q4 - Vanille", type: "TVA", sentBy: "Mamy A.", region: "Tamatave", status: "en attente", date: daysAgo(1), amount: 84000, comments: [{ id: "co1", author: "Jean Rakoto", text: "Vérifier la ligne export.", date: daysAgo(0) }] },
    { id: "v3", dossier: "Audit Telma 2025", type: "audit", sentBy: "Tojo Ramanantsoa", region: "Antananarivo", status: "validé", date: daysAgo(6), amount: 12500000, comments: [] },
    { id: "v4", dossier: "Paie Hôtel Colbert", type: "écriture", sentBy: "Naina B.", region: "Antananarivo", status: "rejeté", date: daysAgo(4), amount: 320000, comments: [{ id: "co2", author: "Marie Andria", text: "Charges sociales incomplètes.", date: daysAgo(3) }] },
    { id: "v5", dossier: "Bilan Pêcheries", type: "bilan", sentBy: "Lala R.", region: "Mahajanga", status: "en attente", date: daysAgo(0), amount: 980000, comments: [] },
    { id: "v6", dossier: "Audit coop vignoble", type: "audit", sentBy: "Soa Rabe", region: "Fianarantsoa", status: "clôturé", date: daysAgo(40), amount: 450000, comments: [] },
  ],

  anomalies: [
    { id: "an1", type: "TVA non déclarée", category: "fiscal", dossier: "TVA Q4 - Vanille", region: "Tamatave", severity: "critique", status: "ouverte", assignedTo: "Jean Rakoto", date: daysAgo(2), description: "Une période de TVA semble manquante au T3." },
    { id: "an2", type: "Écriture déséquilibrée", category: "comptable", dossier: "Bilan 2025 - Océan Indien", region: "Tamatave", severity: "moyen", status: "en cours", assignedTo: "Hery Rasolofo", date: daysAgo(5), description: "Différence de 12 400 Ar sur compte 401." },
    { id: "an3", type: "Charges sociales", category: "social", dossier: "Paie Hôtel Colbert", region: "Antananarivo", severity: "critique", status: "ouverte", assignedTo: "Marie Andria", date: daysAgo(3), description: "DSN incomplète pour décembre." },
    { id: "an4", type: "Justificatif manquant", category: "comptable", dossier: "Audit Telma 2025", region: "Antananarivo", severity: "faible", status: "résolue", assignedTo: "Tojo Ramanantsoa", date: daysAgo(10), description: "Facture #2087 manquante - retrouvée." },
    { id: "an5", type: "Statuts non à jour", category: "juridique", dossier: "Bilan Pêcheries", region: "Mahajanga", severity: "moyen", status: "ouverte", assignedTo: "Hery Razafy", date: daysAgo(8), description: "Statuts non mis à jour depuis 2022." },
    { id: "an6", type: "Doublon écriture", category: "comptable", dossier: "Audit coop vignoble", region: "Fianarantsoa", severity: "faible", status: "résolue", assignedTo: "Soa Rabe", date: daysAgo(30), description: "Doublon corrigé." },
  ],

  auditLogs: [
    { id: "l1", user: "Jean Rakoto", action: "a validé une écriture", target: "Bilan 2025 - Océan Indien", date: daysAgo(0), category: "validation" },
    { id: "l2", user: "Marie Andria", action: "a modifié un dossier", target: "Audit Telma 2025", date: daysAgo(1), category: "modification" },
    { id: "l3", user: "Admin", action: "a supprimé un document", target: "Brouillon TVA T2", date: daysAgo(1), category: "suppression" },
    { id: "l4", user: "Hery Rasolofo", action: "a partagé un dossier", target: "TVA Q4 - Vanille", date: daysAgo(2), category: "partage" },
    { id: "l5", user: "Tojo Ramanantsoa", action: "a créé un dossier", target: "Consolidation Telma", date: daysAgo(5), category: "création" },
    { id: "l6", user: "Hery Razafy", action: "a validé un audit", target: "Bilan Pêcheries", date: daysAgo(8), category: "validation" },
    { id: "l7", user: "Mamy A.", action: "a signalé une anomalie", target: "TVA Q4 - Vanille", date: daysAgo(2), category: "création" },
    { id: "l8", user: "Soa Rabe", action: "a clôturé un dossier", target: "Audit coop vignoble", date: daysAgo(40), category: "validation" },
  ],

  conversations: [
    {
      id: "conv1",
      name: "Équipe Tamatave",
      type: "channel",
      participants: ["Jean Rakoto", "Hery Rasolofo", "Voahangy R.", "Mamy A."],
      unread: 2,
      lastMessage: "Le bilan est prêt à être validé.",
      lastDate: daysAgo(0),
      notifications: true,
      messages: [
        { id: "m1", author: "Hery Rasolofo", text: "Salut, j'ai terminé l'écriture du bilan.", date: daysAgo(0) },
        { id: "m2", author: "Jean Rakoto", text: "Super, je regarde ça aujourd'hui.", date: daysAgo(0) },
        { id: "m3", author: "Hery Rasolofo", text: "Le bilan est prêt à être validé.", date: daysAgo(0) },
      ],
    },
    {
      id: "conv2",
      name: "Marie Andria",
      type: "direct",
      participants: ["Marie Andria"],
      unread: 0,
      lastMessage: "Merci, je te tiens au courant.",
      lastDate: daysAgo(1),
      notifications: true,
      messages: [
        { id: "m4", author: "Marie Andria", text: "As-tu validé le rapport Telma ?", date: daysAgo(1) },
        { id: "m5", author: "Moi", text: "Oui c'est fait.", date: daysAgo(1), mine: true },
        { id: "m6", author: "Marie Andria", text: "Merci, je te tiens au courant.", date: daysAgo(1) },
      ],
    },
    {
      id: "conv3",
      name: "Qualité & Audit",
      type: "channel",
      participants: ["Admins"],
      unread: 5,
      lastMessage: "Nouvelle anomalie critique signalée.",
      lastDate: daysAgo(2),
      notifications: false,
      messages: [
        { id: "m7", author: "Système", text: "Nouvelle anomalie critique signalée.", date: daysAgo(2) },
      ],
    },
    {
      id: "conv4",
      name: "Hery Razafy",
      type: "direct",
      participants: ["Hery Razafy"],
      unread: 0,
      lastMessage: "Bonjour, peux-tu m'envoyer le modèle ?",
      lastDate: daysAgo(4),
      notifications: true,
      messages: [
        { id: "m8", author: "Hery Razafy", text: "Bonjour, peux-tu m'envoyer le modèle ?", date: daysAgo(4) },
      ],
    },
  ],

  qualityChecks: REGIONS.map((r, i) => ({
    id: `q-${r}`,
    region: r,
    items: [
      { id: `${r}-1`, label: "TVA vérifiée", checked: i % 2 === 0 },
      { id: `${r}-2`, label: "Écritures validées", checked: i !== 1 },
      { id: `${r}-3`, label: "Documents complets", checked: i < 3 },
      { id: `${r}-4`, label: "Normes IFRS respectées", checked: i === 0 },
      { id: `${r}-5`, label: "Bilan signé", checked: i < 2 },
    ],
  })),

  settings: {
    autoValidationThreshold: 1000000,
    anomalyAlertEmail: true,
    requireDoubleApproval: false,
    retentionDays: 365,
  },
};

// --- Pub/sub ---
type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const notify = () => listeners.forEach((l) => l());

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function nowIso() {
  return new Date().toISOString();
}

export function logAudit(entry: Omit<AuditLog, "id" | "date">) {
  store.auditLogs.unshift({ id: uid(), date: nowIso(), ...entry });
  notify();
}
