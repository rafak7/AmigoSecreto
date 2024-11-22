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
  const inviteLink = `${window.location.origin}/join/${group.inviteCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Link copiado para a área de transferência.",
    });
  };

  const handleStartDraw = () => {
    if (group.participants.length < 3) {
      toast({
        title: "Participantes insuficientes",
        description: "É necessário ter pelo menos 3 participantes para realizar o sorteio.",
        variant: "destructive",
      });
      return;
    }

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
        title: "Erro ao realizar sorteio",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao realizar o sorteio. Por favor, tente novamente.",
        variant: "destructive",
      });
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Grupo: {group.name}</DialogTitle>
          <DialogDescription>
            Compartilhe o link do grupo ou gerencie os participantes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="invite" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mb-4">
            <TabsTrigger value="invite" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Convite
            </TabsTrigger>
            <TabsTrigger value="participants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes
            </TabsTrigger>
            {group.drawResult && (
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Resultados
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="invite" className="flex-1 mt-0">
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Link de convite</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      readOnly
                      value={inviteLink}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(inviteLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este link com as pessoas que você quer convidar para o grupo.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Senha do grupo</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      readOnly
                      value={group.invitePassword}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(group.invitePassword)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Os participantes precisarão desta senha para entrar no grupo.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="participants" className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {group.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex flex-col p-2 rounded-md bg-secondary"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {participant.email}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => toggleParticipant(participant.id)}
                          >
                            {isParticipantExpanded(participant.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {isParticipantExpanded(participant.id) && participant.giftHints && (
                          <div className="flex gap-2 mt-2">
                            <div className="h-4 w-0.5 bg-muted" />
                            <p className="text-sm text-muted-foreground flex-1">
                              <span className="font-medium">Dicas:</span> {participant.giftHints}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {group.participants.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum participante ainda
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {group.drawResult && (
            <TabsContent value="results" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {group.drawResult.map((pair, index) => (
                    <div
                      key={index}
                      className="flex flex-col p-2 rounded-md bg-secondary"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{pair.giver.name}</p>
                              <span className="text-sm text-muted-foreground">tirou</span>
                              <p className="font-medium text-red-500">{pair.receiver.name}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => toggleParticipant(`draw-${index}`)}
                            >
                              {isParticipantExpanded(`draw-${index}`) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {isParticipantExpanded(`draw-${index}`) && pair.receiver.giftHints && (
                            <div className="flex gap-2 mt-2">
                              <div className="h-4 w-0.5 bg-muted" />
                              <p className="text-sm text-muted-foreground flex-1">
                                <span className="font-medium">Dicas:</span> {pair.receiver.giftHints}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>

        <Button
          className="w-full bg-red-500 hover:bg-red-600"
          onClick={handleStartDraw}
          disabled={group.drawResult || group.participants.length < 3}
        >
          {group.drawResult ? "Sorteio já realizado" : "Realizar Sorteio"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}