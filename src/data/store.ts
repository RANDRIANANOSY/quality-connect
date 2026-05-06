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
  projects: Project[];
}

export interface Project {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "en cours" | "terminé" | "retard";
  dossiers: {
    total: number;
    toUse: string[];
    received: string[];
    pending: string[];
    late: string[];
    missing: string[]; // after 5 days
  };
  tasks: {
    id: string;
    name: string;
    assignedTo: string;
    status: "à faire" | "en cours" | "terminé";
    dueDate: string;
  }[];
  anomalies: string[]; // anomaly ids
  attachments: { id: string; name: string; type: string; size: string }[];
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
        {
          id: "p1",
          name: "Bilan annuel 2025",
          client: "SARL Océan Indien",
          startDate: daysAgo(60),
          endDate: daysAgo(-12),
          progress: 78,
          status: "en cours",
          dossiers: {
            total: 15,
            toUse: ["Dossier 1", "Dossier 2"],
            received: ["Dossier 3", "Dossier 4"],
            pending: ["Dossier 5"],
            late: ["Dossier 6"],
            missing: []
          },
          tasks: [
            { id: "t1", name: "Collecte documents", assignedTo: "Hery Rasolofo", status: "terminé", dueDate: daysAgo(50) },
            { id: "t2", name: "Analyse comptable", assignedTo: "Voahangy R.", status: "en cours", dueDate: daysAgo(-5) },
            { id: "t3", name: "Validation bilan", assignedTo: "Jean Rakoto", status: "à faire", dueDate: daysAgo(-10) }
          ],
          anomalies: ["an1"],
          attachments: [
            { id: "att1", name: "Bilan_2025.pdf", type: "pdf", size: "2.5 MB" },
            { id: "att2", name: "Annexes.xlsx", type: "xlsx", size: "1.2 MB" }
          ]
        },
        {
          id: "p2",
          name: "Audit fiscal",
          client: "Port Toamasina SA",
          startDate: daysAgo(90),
          endDate: daysAgo(-30),
          progress: 45,
          status: "en cours",
          dossiers: {
            total: 22,
            toUse: ["Audit Doc 1"],
            received: ["Audit Doc 2", "Audit Doc 3"],
            pending: ["Audit Doc 4", "Audit Doc 5"],
            late: [],
            missing: ["Audit Doc 6"]
          },
          tasks: [
            { id: "t4", name: "Révision fiscale", assignedTo: "Hery Rasolofo", status: "en cours", dueDate: daysAgo(-15) },
            { id: "t5", name: "Contrôle TVA", assignedTo: "Voahangy R.", status: "terminé", dueDate: daysAgo(10) }
          ],
          anomalies: [],
          attachments: [
            { id: "att3", name: "Rapport_Audit.pdf", type: "pdf", size: "5.1 MB" }
          ]
        },
        {
          id: "p3",
          name: "Déclaration TVA T4",
          client: "Vanille Export",
          startDate: daysAgo(30),
          endDate: daysAgo(8),
          progress: 100,
          status: "terminé",
          dossiers: {
            total: 8,
            toUse: [],
            received: ["TVA Q4"],
            pending: [],
            late: [],
            missing: []
          },
          tasks: [
            { id: "t6", name: "Saisie TVA", assignedTo: "Mamy A.", status: "terminé", dueDate: daysAgo(15) },
            { id: "t7", name: "Validation", assignedTo: "Jean Rakoto", status: "terminé", dueDate: daysAgo(10) }
          ],
          anomalies: [],
          attachments: [
            { id: "att4", name: "Declaration_TVA.pdf", type: "pdf", size: "0.8 MB" }
          ]
        },
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
        {
          id: "p4",
          name: "Consolidation Telma",
          client: "Telma Group",
          startDate: daysAgo(45),
          endDate: daysAgo(-20),
          progress: 62,
          status: "en cours",
          dossiers: {
            total: 35,
            toUse: ["Cons Doc 1", "Cons Doc 2"],
            received: ["Cons Doc 3", "Cons Doc 4", "Cons Doc 5"],
            pending: ["Cons Doc 6"],
            late: ["Cons Doc 7"],
            missing: []
          },
          tasks: [
            { id: "t8", name: "Collecte filiales", assignedTo: "Tojo Ramanantsoa", status: "terminé", dueDate: daysAgo(30) },
            { id: "t9", name: "Consolidation comptes", assignedTo: "Naina B.", status: "en cours", dueDate: daysAgo(-10) },
            { id: "t10", name: "Rapport final", assignedTo: "Marie Andria", status: "à faire", dueDate: daysAgo(-15) }
          ],
          anomalies: ["an2"],
          attachments: [
            { id: "att5", name: "Consolidation_2025.xlsx", type: "xlsx", size: "8.3 MB" },
            { id: "att6", name: "Rapport_Cons.pdf", type: "pdf", size: "3.2 MB" }
          ]
        },
        {
          id: "p5",
          name: "Paie mensuelle",
          client: "Hôtel Colbert",
          startDate: daysAgo(10),
          endDate: daysAgo(2),
          progress: 90,
          status: "retard",
          dossiers: {
            total: 12,
            toUse: ["Paie Jan"],
            received: ["Paie Feb", "Paie Mar"],
            pending: [],
            late: ["Paie Apr"],
            missing: ["Paie May"]
          },
          tasks: [
            { id: "t11", name: "Saisie paie", assignedTo: "Fanja R.", status: "terminé", dueDate: daysAgo(5) },
            { id: "t12", name: "Validation DSN", assignedTo: "Patrick H.", status: "en cours", dueDate: daysAgo(1) }
          ],
          anomalies: ["an3", "an4"],
          attachments: [
            { id: "att7", name: "Bulletin_Paie.pdf", type: "pdf", size: "1.5 MB" }
          ]
        },
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
        {
          id: "p6",
          name: "Bilan 2025",
          client: "Pêcheries du Nord-Ouest",
          startDate: daysAgo(75),
          endDate: daysAgo(-45),
          progress: 30,
          status: "en cours",
          dossiers: {
            total: 18,
            toUse: ["Bilan Doc 1"],
            received: ["Bilan Doc 2"],
            pending: ["Bilan Doc 3", "Bilan Doc 4"],
            late: [],
            missing: ["Bilan Doc 5"]
          },
          tasks: [
            { id: "t13", name: "Collecte pièces", assignedTo: "Lala R.", status: "en cours", dueDate: daysAgo(-20) },
            { id: "t14", name: "Établissement bilan", assignedTo: "Hery Razafy", status: "à faire", dueDate: daysAgo(-30) }
          ],
          anomalies: [],
          attachments: [
            { id: "att8", name: "Pieces_Comptables.zip", type: "zip", size: "4.7 MB" }
          ]
        },
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
        {
          id: "p7",
          name: "Audit coop",
          client: "Coopérative Vignoble",
          startDate: daysAgo(90),
          endDate: daysAgo(-60),
          progress: 10,
          status: "en cours",
          dossiers: {
            total: 25,
            toUse: ["Audit Coop 1", "Audit Coop 2"],
            received: [],
            pending: ["Audit Coop 3", "Audit Coop 4", "Audit Coop 5"],
            late: ["Audit Coop 6"],
            missing: ["Audit Coop 7", "Audit Coop 8"]
          },
          tasks: [
            { id: "t15", name: "Plan d'audit", assignedTo: "Soa Rabe", status: "à faire", dueDate: daysAgo(-40) }
          ],
          anomalies: [],
          attachments: []
        },
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
    { id: "v1", dossier: "Bilan 2025 - Océan Indien", type: "bilan", sentBy: "Hery Rasolofo", region: "Tamatave", status: "en attente", date: daysAgo(2), amount: 1250000, qualityScore: 86, comments: [], history: [{ id: "h1", action: "Soumis pour validation", author: "Hery Rasolofo", date: daysAgo(2) }] },
    { id: "v2", dossier: "TVA Q4 - Vanille", type: "TVA", sentBy: "Mamy A.", region: "Tamatave", status: "en attente", date: daysAgo(1), amount: 84000, qualityScore: 72, comments: [{ id: "co1", author: "Jean Rakoto", text: "Vérifier la ligne export.", date: daysAgo(0) }], history: [{ id: "h2", action: "Soumis pour validation", author: "Mamy A.", date: daysAgo(1) }] },
    { id: "v3", dossier: "Audit Telma 2025", type: "audit", sentBy: "Tojo Ramanantsoa", region: "Antananarivo", status: "validé", date: daysAgo(6), amount: 12500000, qualityScore: 94, comments: [], history: [{ id: "h3", action: "Soumis", author: "Tojo Ramanantsoa", date: daysAgo(7) }, { id: "h3b", action: "Validé", author: "Marie Andria", motif: "Conforme aux normes IFRS", notified: true, date: daysAgo(6) }] },
    { id: "v4", dossier: "Paie Hôtel Colbert", type: "écriture", sentBy: "Naina B.", region: "Antananarivo", status: "rejeté", date: daysAgo(4), amount: 320000, qualityScore: 58, comments: [{ id: "co2", author: "Marie Andria", text: "Charges sociales incomplètes.", date: daysAgo(3) }], history: [{ id: "h4", action: "Soumis", author: "Naina B.", date: daysAgo(5) }, { id: "h4b", action: "Rejeté", author: "Marie Andria", motif: "Charges sociales incomplètes", notified: true, date: daysAgo(4) }] },
    { id: "v5", dossier: "Bilan Pêcheries", type: "bilan", sentBy: "Lala R.", region: "Mahajanga", status: "en attente", date: daysAgo(0), amount: 980000, qualityScore: 81, comments: [], history: [{ id: "h5", action: "Soumis", author: "Lala R.", date: daysAgo(0) }] },
    { id: "v6", dossier: "Audit coop vignoble", type: "audit", sentBy: "Soa Rabe", region: "Fianarantsoa", status: "clôturé", date: daysAgo(40), amount: 450000, qualityScore: 90, comments: [], history: [{ id: "h6", action: "Soumis", author: "Soa Rabe", date: daysAgo(42) }, { id: "h6b", action: "Validé", author: "Admin", motif: "OK", date: daysAgo(41) }, { id: "h6c", action: "Clôturé", author: "Admin", motif: "Exercice fermé", date: daysAgo(40) }] },
  ],

  anomalies: [
    { id: "an1", type: "TVA non déclarée", category: "fiscal", dossier: "TVA Q4 - Vanille", client: "Vanille Export", mission: "Déclaration TVA Q4 2025", region: "Tamatave", severity: "critique", status: "ouverte", assignedTo: "Jean Rakoto", date: daysAgo(2), startDate: daysAgo(2), endDate: daysAgo(-7), description: "Une période de TVA semble manquante au T3.", attachments: [{ id: "f1", name: "extrait_tva.pdf", size: "240 KB" }], timeline: [{ id: "t1", date: daysAgo(2), author: "Mamy A.", action: "Anomalie signalée" }, { id: "t2", date: daysAgo(1), author: "Jean Rakoto", action: "Pris en charge" }], comments: [{ id: "c1", author: "Jean Rakoto", text: "Je contacte le client.", date: daysAgo(1) }] },
    { id: "an2", type: "Écriture déséquilibrée", category: "comptable", dossier: "Bilan 2025 - Océan Indien", client: "SARL Océan Indien", mission: "Bilan annuel 2025", region: "Tamatave", severity: "moyen", status: "en cours", assignedTo: "Hery Rasolofo", date: daysAgo(5), startDate: daysAgo(5), endDate: daysAgo(-3), description: "Différence de 12 400 Ar sur compte 401.", attachments: [], timeline: [{ id: "t3", date: daysAgo(5), author: "Système", action: "Détection automatique" }], comments: [] },
    { id: "an3", type: "Charges sociales", category: "social", dossier: "Paie Hôtel Colbert", client: "Hôtel Colbert", mission: "Paie mensuelle décembre", region: "Antananarivo", severity: "critique", status: "ouverte", assignedTo: "Marie Andria", date: daysAgo(3), startDate: daysAgo(3), endDate: daysAgo(-2), description: "DSN incomplète pour décembre.", attachments: [{ id: "f2", name: "DSN_dec.xml", size: "84 KB" }], timeline: [{ id: "t4", date: daysAgo(3), author: "Naina B.", action: "Anomalie signalée" }], comments: [] },
    { id: "an4", type: "Justificatif manquant", category: "comptable", dossier: "Audit Telma 2025", client: "Telma Group", mission: "Consolidation Telma", region: "Antananarivo", severity: "faible", status: "résolue", assignedTo: "Tojo Ramanantsoa", date: daysAgo(10), startDate: daysAgo(10), endDate: daysAgo(8), description: "Facture #2087 manquante - retrouvée.", attachments: [], timeline: [{ id: "t5", date: daysAgo(10), author: "Tojo R.", action: "Signalée" }, { id: "t6", date: daysAgo(8), author: "Tojo R.", action: "Résolue" }], comments: [] },
    { id: "an5", type: "Statuts non à jour", category: "juridique", dossier: "Bilan Pêcheries", client: "Pêcheries du Nord-Ouest", mission: "Bilan 2025", region: "Mahajanga", severity: "moyen", status: "ouverte", assignedTo: "Hery Razafy", date: daysAgo(8), startDate: daysAgo(8), endDate: daysAgo(-15), description: "Statuts non mis à jour depuis 2022.", attachments: [], timeline: [], comments: [] },
    { id: "an6", type: "Doublon écriture", category: "comptable", dossier: "Audit coop vignoble", client: "Coopérative Vignoble", mission: "Audit coop", region: "Fianarantsoa", severity: "faible", status: "résolue", assignedTo: "Soa Rabe", date: daysAgo(30), startDate: daysAgo(30), endDate: daysAgo(28), description: "Doublon corrigé.", attachments: [], timeline: [], comments: [] },
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
