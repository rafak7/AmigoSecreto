"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Copy, Link as LinkIcon, Users, Gift, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "./ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  email: string;
  giftHints?: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  date: Date;
  priceRange: number;
  inviteCode: string;
  invitePassword: string;
  participants: Participant[];
  ownerId: string;
  drawResult?: { giver: Participant; receiver: Participant }[];
  drawDate?: string;
}

interface InviteParticipantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  onUpdateGroup: (group: Group) => void;
}

export function InviteParticipantsModal({
  open,
  onOpenChange,
  group,
  onUpdateGroup,
}: InviteParticipantsModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("invite");
  const inviteLink = `${window.location.origin}/join/${group.inviteCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copiado com sucesso! ",
        description: "O link foi copiado para sua área de transferência.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleStartDraw = async () => {
    if (group.participants.length < 3) {
      toast({
        title: "Participantes insuficientes ",
        description: "São necessários pelo menos 3 participantes para realizar o sorteio.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Cria uma cópia dos participantes para embaralhar
      let participants = [...group.participants];
      let receivers = [...group.participants];
      let pairs: { giver: Participant; receiver: Participant }[] = [];
      let attempts = 0;
      const maxAttempts = 100;

      // Função para embaralhar array
      const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      // Tenta realizar o sorteio até conseguir um resultado válido
      while (attempts < maxAttempts) {
        pairs = [];
        receivers = shuffle([...participants]);
        let isValid = true;

        for (let i = 0; i < participants.length; i++) {
          // Se alguém tirou a si mesmo, invalida o sorteio
          if (participants[i].id === receivers[i].id) {
            isValid = false;
            break;
          }
          pairs.push({
            giver: participants[i],
            receiver: receivers[i],
          });
        }

        if (isValid) {
          // Atualiza o grupo com os pares sorteados
          const updatedGroup = {
            ...group,
            drawResult: pairs,
            drawDate: new Date().toISOString(),
          };

          // Atualiza o localStorage
          const storedGroups = localStorage.getItem(`groups-${group.ownerId}`);
          if (storedGroups) {
            const groups = JSON.parse(storedGroups);
            const groupIndex = groups.findIndex((g: any) => g.id === group.id);
            if (groupIndex !== -1) {
              groups[groupIndex] = updatedGroup;
              localStorage.setItem(`groups-${group.ownerId}`, JSON.stringify(groups));

              // Atualiza o estado do grupo
              onUpdateGroup(updatedGroup);

              // Notifica o sucesso
              toast({
                title: "Sorteio realizado com sucesso!",
                description: "Os resultados foram salvos e podem ser visualizados agora.",
              });

              // Força atualização em outras abas
              window.dispatchEvent(new StorageEvent('storage', {
                key: `groups-${group.ownerId}`,
                newValue: JSON.stringify(groups),
                url: window.location.href
              }));

              return;
            }
          }
        }

        attempts++;
      }

      throw new Error("Não foi possível realizar o sorteio após várias tentativas. Tente novamente.");
    } catch (error) {
      console.error('Erro ao realizar sorteio:', error);
      toast({
        title: "Erro no sorteio ",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao realizar o sorteio. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [expandedParticipants, setExpandedParticipants] = useState<string[]>([]);

  const toggleParticipant = (participantId: string) => {
    setExpandedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    );
  };

  const isParticipantExpanded = (participantId: string) => {
    return expandedParticipants.includes(participantId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DialogHeader className="pb-2">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DialogTitle className="text-xl font-semibold">
              {group.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Gerencie seu grupo de amigo secreto
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="invite" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <LinkIcon className="h-4 w-4" />
              Convite
            </TabsTrigger>
            <TabsTrigger 
              value="participants" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span>Participantes ({group.participants.length})</span>
            </TabsTrigger>
            {group.drawResult && (
              <TabsTrigger 
                value="results" 
                className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
              >
                <Gift className="h-4 w-4" />
                Resultados
              </TabsTrigger>
            )}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <TabsContent value="invite" className="flex-1 mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link de convite</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        readOnly
                        value={inviteLink}
                        className="h-10 text-sm bg-muted/50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                        onClick={() => copyToClipboard(inviteLink)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Compartilhe este link com os participantes que você deseja convidar
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Senha do grupo</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        readOnly
                        value={group.invitePassword}
                        className="h-10 text-sm bg-muted/50 font-mono"
                        type="password"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                        onClick={() => copyToClipboard(group.invitePassword)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Os participantes precisarão desta senha para entrar no grupo
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="participants" className="mt-0 flex-1">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {group.participants.map((participant) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-muted/50 p-4 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{participant.name}</h4>
                              <p className="text-sm text-muted-foreground">{participant.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8"
                            onClick={() => toggleParticipant(participant.id)}
                          >
                            {isParticipantExpanded(participant.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <AnimatePresence>
                          {isParticipantExpanded(participant.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="pt-2"
                            >
                              <div className="text-sm space-y-2">
                                <p className="font-medium">Dicas de presente:</p>
                                <p className="text-muted-foreground">
                                  {participant.giftHints || "Nenhuma dica fornecida"}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {!group.drawResult && group.participants.length >= 3 && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      onClick={handleStartDraw}
                      className="w-full sm:w-auto"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Realizando sorteio...
                        </>
                      ) : (
                        <>
                          <Gift className="mr-2 h-4 w-4" />
                          Realizar Sorteio
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {group.drawResult && (
                <TabsContent value="results" className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {group.drawResult.map((pair, index) => (
                        <motion.div
                          key={pair.giver.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-muted/50 p-4 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{pair.giver.name}</p>
                              <p className="text-xs text-muted-foreground">presenteia</p>
                              <p className="text-sm font-medium mt-1">{pair.receiver.name}</p>
                            </div>
                            <Gift className="h-5 w-5 text-primary" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}