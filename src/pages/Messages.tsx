import { useState } from "react";
import { Plus, Search, Send, Paperclip, Smile, Bell, BellOff, Hash, User } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { store, Conversation, uid, nowIso, notify } from "@/data/store";
import { useStore } from "@/data/useStore";

export default function Messages() {
  useStore();
  const [activeId, setActiveId] = useState<string>(store.conversations[0]?.id || "");
  const [filter, setFilter] = useState<"all" | "direct" | "channel" | "group">("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Conversation["type"]>("direct");

  const filtered = store.conversations.filter((c) => {
    if (filter !== "all" && c.type !== filter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const active = store.conversations.find((c) => c.id === activeId) || store.conversations[0];

  const send = () => {
    if (!draft.trim() || !active) return;
    active.messages.push({ id: uid(), author: "Moi", text: draft, date: nowIso(), mine: true });
    active.lastMessage = draft;
    active.lastDate = nowIso();
    notify();
    setDraft("");
  };

  const toggleNotif = () => {
    if (!active) return;
    active.notifications = !active.notifications;
    notify();
    toast.success(active.notifications ? "Notifications activées" : "Notifications désactivées");
  };

  const createConv = () => {
    if (!newName.trim()) return toast.error("Nom requis");
    const c: Conversation = {
      id: uid(),
      name: newName,
      type: newType,
      participants: [newName],
      unread: 0,
      lastMessage: "Conversation créée",
      lastDate: nowIso(),
      notifications: true,
      messages: [],
    };
    store.conversations.unshift(c);
    notify();
    setActiveId(c.id);
    setOpenNew(false);
    setNewName("");
    toast.success("Conversation créée");
  };

  const markRead = (id: string) => {
    const c = store.conversations.find((x) => x.id === id);
    if (c) { c.unread = 0; notify(); }
    setActiveId(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Communication interne</h2>
          <p className="text-sm text-muted-foreground">Messagerie centralisée entre agences et collaborateurs.</p>
        </div>
        <Button onClick={() => setOpenNew(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle conversation</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_280px] h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conv list */}
          <div className="border-r border-border flex flex-col">
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="pl-9 h-8" />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="direct">Directs</SelectItem>
                  <SelectItem value="channel">Canaux</SelectItem>
                  <SelectItem value="group">Groupes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => markRead(c.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 border-b border-border/50 transition flex items-start gap-2.5",
                    c.id === active?.id ? "bg-accent" : "hover:bg-secondary/50"
                  )}
                >
                  <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {c.type === "channel" ? <Hash className="h-4 w-4" /> : c.type === "group" ? <Hash className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(c.lastDate), { locale: fr, addSuffix: false })}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                  </div>
                  {c.unread > 0 && (
                    <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && <div className="text-center text-sm text-muted-foreground p-6">Aucune conversation</div>}
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col bg-gradient-subtle">
            {active ? (
              <>
                <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{active.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-semibold text-sm">{active.name}</div>
                      <div className="text-xs text-muted-foreground">{active.participants.length} participant{active.participants.length > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={toggleNotif} title="Notifications">
                    {active.notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                  {active.messages.map((m) => (
                    <div key={m.id} className={cn("flex gap-2", m.mine ? "flex-row-reverse" : "")}>
                      <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[10px] bg-secondary">{m.author.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div className={cn("max-w-[70%] rounded-2xl px-3.5 py-2 text-sm", m.mine ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm")}>
                        {!m.mine && <div className="text-[11px] font-semibold mb-0.5 opacity-80">{m.author}</div>}
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        <div className={cn("text-[10px] mt-1", m.mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                          {format(new Date(m.date), "HH:mm", { locale: fr })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {active.messages.length === 0 && <div className="text-center text-sm text-muted-foreground py-12">Aucun message — démarrez la conversation !</div>}
                </div>
                <div className="p-3 border-t border-border bg-card">
                  <div className="flex items-end gap-2">
                    <Button variant="ghost" size="icon" title="Joindre" onClick={() => toast.info("Pièce jointe (démo)")}><Paperclip className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Emoji" onClick={() => setDraft(draft + " 😊")}><Smile className="h-4 w-4" /></Button>
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      placeholder="Écrivez un message… (@mention)"
                    />
                    <Button onClick={send} disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Sélectionnez une conversation</div>
            )}
          </div>

          {/* Details */}
          <div className="hidden md:block border-l border-border bg-card overflow-y-auto scrollbar-thin">
            {active && (
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <Avatar className="h-16 w-16 mx-auto"><AvatarFallback className="text-lg gradient-primary text-white font-bold">{active.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="font-semibold mt-2">{active.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{active.type}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">Participants</div>
                  <div className="space-y-1.5">
                    {active.participants.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-secondary">{p.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3">
                  <div className="text-[11px] uppercase font-semibold text-muted-foreground mb-1">Notifications</div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{active.notifications ? "Activées" : "Désactivées"}</span>
                    <Button variant="outline" size="sm" onClick={toggleNotif}>{active.notifications ? "Désactiver" : "Activer"}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle conversation</DialogTitle>
            <DialogDescription>Démarrez un échange avec une personne ou une équipe.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label>Nom</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex. Équipe audit" />
            </div>
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as Conversation["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="channel">Canal</SelectItem>
                  <SelectItem value="group">Groupe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNew(false)}>Annuler</Button>
            <Button onClick={createConv}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
