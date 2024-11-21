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

const joinSchema = z.object({
  name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "A senha do grupo é obrigatória"),
});

type JoinFormData = z.infer<typeof joinSchema>;

export default function JoinGroup({ params }: { params: { code: string } }) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<JoinFormData>({
    resolver: zodResolver(joinSchema),
  });

  const onSubmit = async (data: JoinFormData) => {
    try {
      // Implementar lógica para juntar-se ao grupo
      toast({
        title: "Participação confirmada!",
        description: "Você foi adicionado ao grupo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao participar",
        description: "Verifique a senha do grupo e tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1c2e] to-[#2c1c2e] flex items-center justify-center p-4">
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
    </main>
  );
}