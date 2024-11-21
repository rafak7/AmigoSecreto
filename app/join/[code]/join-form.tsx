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

const joinSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha do grupo é obrigatória"),
});

type JoinFormData = z.infer<typeof joinSchema>;

export function JoinForm({ code }: { code: string }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinFormData) => {
    try {
      console.log('Iniciando processo de participação...');
      console.log('Código do convite:', code);
      
      // Recupera os grupos do localStorage
      const storedGroups = localStorage.getItem('groups');
      console.log('Grupos armazenados (raw):', storedGroups);
      
      if (!storedGroups) {
        throw new Error("Nenhum grupo encontrado no localStorage");
      }

      let groups: Group[];
      try {
        groups = JSON.parse(storedGroups);
        console.log('Grupos parseados:', groups);
      } catch (error) {
        console.error('Erro ao fazer parse dos grupos:', error);
        throw new Error("Erro ao ler os grupos armazenados");
      }
      
      // Encontra o grupo com o código de convite
      const groupIndex = groups.findIndex(g => g.inviteCode === code);
      console.log('Índice do grupo encontrado:', groupIndex);
      
      if (groupIndex === -1) {
        throw new Error("Grupo não encontrado com o código: " + code);
      }

      const group = groups[groupIndex];
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
      };

      console.log('Novo participante:', newParticipant);

      // Adiciona o participante ao grupo
      group.participants.push(newParticipant);
      groups[groupIndex] = group;

      console.log('Grupo após adicionar participante:', group);
      console.log('Todos os grupos após atualização:', groups);

      // Atualiza o localStorage
      try {
        localStorage.setItem('groups', JSON.stringify(groups));
        console.log('localStorage atualizado com sucesso');
        
        // Verifica se foi salvo corretamente
        const verificacao = localStorage.getItem('groups');
        console.log('Verificação do localStorage após salvar:', verificacao);
        
        // Força uma atualização em todas as abas
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'groups',
          newValue: JSON.stringify(groups),
          url: window.location.href
        }));
        
        console.log('Evento storage disparado');
      } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        throw new Error("Erro ao salvar as alterações");
      }

      toast({
        title: "Participação confirmada!",
        description: "Você foi adicionado ao grupo com sucesso.",
      });

      // Redireciona para o dashboard após sucesso
      router.push("/dashboard");
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
