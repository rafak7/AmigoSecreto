"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { GiftIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

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
}

const joinSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha do grupo é obrigatória"),
  giftHints: z.string().optional(),
});

type JoinFormData = z.infer<typeof joinSchema>;

const getUserGroupsKey = (userId: string) => `groups-${userId}`;

export function JoinForm({ code }: { code: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinFormData) => {
    try {
      // Verifica se o usuário está logado
      if (!user) {
        toast({
          title: "Erro ao participar",
          description: "Você precisa estar logado para participar de um grupo. Por favor, faça login primeiro.",
          variant: "destructive",
        });
        router.push('/login');
        return;
      }

      console.log('Tentando participar do grupo com código:', code);
      
      // Verifica todas as chaves no localStorage
      console.log('Todas as chaves no localStorage:', Object.keys(localStorage));
      
      // Procura por grupos em todas as chaves que começam com 'groups-'
      const allGroups: Group[] = [];
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('groups-')) {
          try {
            const groupsData = localStorage.getItem(key);
            if (groupsData) {
              const parsed = JSON.parse(groupsData);
              if (Array.isArray(parsed)) {
                allGroups.push(...parsed);
              }
            }
          } catch (error) {
            console.error(`Erro ao parsear grupos da chave ${key}:`, error);
          }
        }
      });
      
      console.log('Todos os grupos encontrados:', allGroups);
      
      if (allGroups.length === 0) {
        throw new Error("Não foi possível encontrar nenhum grupo ativo. O grupo pode ter sido excluído ou você está usando um link inválido. Por favor, peça ao organizador um novo link de convite.");
      }

      // Encontra o grupo com o código de convite
      const groupIndex = allGroups.findIndex(g => g.inviteCode === code);
      console.log('Índice do grupo encontrado:', groupIndex);
      
      if (groupIndex === -1) {
        throw new Error(`Não foi possível encontrar o grupo com o código ${code}. O grupo pode ter sido excluído ou você está usando um link desatualizado. Por favor, peça ao organizador um novo link de convite.`);
      }

      const group = allGroups[groupIndex];
      console.log('Grupo antes da atualização:', group);

      if (group.invitePassword !== data.password) {
        throw new Error("Senha do grupo incorreta. Por favor, verifique a senha fornecida.");
      }

      // Verifica se o email já está cadastrado no grupo
      if (group.participants.some(p => p.email === data.email)) {
        throw new Error("Este email já está cadastrado no grupo. Use outro email ou entre em contato com o organizador.");
      }

      // Cria novo participante
      const newParticipant: Participant = {
        id: Math.random().toString(36).substring(2, 9),
        name: data.name,
        email: data.email,
        giftHints: data.giftHints,
      };

      console.log('Novo participante:', newParticipant);

      // Adiciona o participante ao grupo
      group.participants.push(newParticipant);
      allGroups[groupIndex] = group;

      console.log('Grupo após adicionar participante:', group);
      console.log('Todos os grupos após atualização:', allGroups);

      // Atualiza o localStorage
      try {
        const userGroupsKey = getUserGroupsKey(user.id);
        localStorage.setItem(userGroupsKey, JSON.stringify(allGroups));
        console.log('localStorage atualizado com sucesso');
        
        // Verifica se foi salvo corretamente
        const verificacao = localStorage.getItem(userGroupsKey);
        console.log('Verificação do localStorage após salvar:', verificacao);
        
        // Força uma atualização em todas as abas
        window.dispatchEvent(new StorageEvent('storage', {
          key: userGroupsKey,
          newValue: JSON.stringify(allGroups),
          url: window.location.href
        }));
        
        console.log('Evento storage disparado');
        
        // Adiciona um pequeno delay antes do redirecionamento para garantir que os dados foram salvos
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);

        toast({
          title: "Participação confirmada!",
          description: "Você foi adicionado ao grupo com sucesso. Redirecionando para o dashboard...",
        });
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        throw new Error("Houve um problema ao salvar suas informações. Por favor, tente novamente. Se o problema persistir, verifique se seu navegador não está no modo privado ou se tem espaço suficiente no armazenamento local.");
      }

      // Redireciona para o dashboard após sucesso
    } catch (error) {
      console.error('Erro ao participar:', error);
      toast({
        title: "Erro ao participar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar participar do grupo. Por favor, tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 flex flex-col items-center">
        <GiftIcon className="w-12 h-12 text-red-500 mb-2" />
        <CardTitle className="text-2xl font-bold">Participar do Amigo Secreto</CardTitle>
        <CardDescription>
          Preencha seus dados para participar do grupo
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              placeholder="Seu nome"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha do grupo</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite a senha fornecida"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="giftHints">Dicas de presentes (opcional)</Label>
            <Input
              id="giftHints"
              placeholder="Dicas de presentes que você gostaria de receber"
              {...register("giftHints")}
            />
            {errors.giftHints && (
              <p className="text-sm text-red-500">{errors.giftHints.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-red-500 hover:bg-red-600">
            Participar do Grupo
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
