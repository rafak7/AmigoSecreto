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
import { Copy, Link as LinkIcon, Users } from "lucide-react";
import { Input } from "./ui/input";

interface Participant {
  id: string;
  name: string;
  email: string;
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

    // Implementar lógica do sorteio aqui
    toast({
      title: "Sorteio realizado!",
      description: "Os participantes receberão seus amigos secretos por e-mail.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gerenciar Grupo: {group.name}</DialogTitle>
          <DialogDescription>
            Compartilhe o link e a senha com os participantes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Link de convite</h4>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="flex-1"
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

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Senha do grupo</h4>
            <div className="flex gap-2">
              <Input
                readOnly
                value={group.invitePassword}
                className="flex-1"
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({group.participants.length})
              </h4>
            </div>
            <div className="space-y-2">
              {group.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-2 rounded-md bg-secondary"
                >
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {participant.email}
                    </p>
                  </div>
                </div>
              ))}
              {group.participants.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum participante ainda
                </p>
              )}
            </div>
          </div>

          <Button
            className="w-full bg-red-500 hover:bg-red-600"
            onClick={handleStartDraw}
            disabled={group.participants.length < 3}
          >
            Realizar Sorteio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}