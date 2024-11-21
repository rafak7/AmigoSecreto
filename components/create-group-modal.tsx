"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input as InputPrice } from "@/components/ui/input-currency";

const groupSchema = z.object({
  name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter no mínimo 10 caracteres"),
  priceRange: z.number().min(1, "O valor mínimo deve ser maior que 0"),
});

type GroupFormData = z.infer<typeof groupSchema>;

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (group: { name: string; description: string; date: Date; priceRange: number }) => void;
}

export function CreateGroupModal({ open, onOpenChange, onCreateGroup }: CreateGroupModalProps) {
  const [date, setDate] = useState<Date>();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      priceRange: 0,
    }
  });

  const onSubmit = async (data: GroupFormData) => {
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione a data do sorteio",
        variant: "destructive",
      });
      return;
    }

    try {
      onCreateGroup({
        name: data.name,
        description: data.description,
        date,
        priceRange: data.priceRange,
      });
      
      toast({
        title: "Grupo criado com sucesso!",
        description: "Você já pode começar a convidar seus amigos.",
      });
      
      reset();
      setDate(undefined);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao criar grupo",
        description: "Ocorreu um erro ao criar o grupo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Preencha as informações do seu grupo de amigo secreto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do grupo</Label>
              <Input
                id="name"
                placeholder="Ex: Amigo Secreto da Família"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Detalhes e regras do amigo secreto..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Data do Sorteio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Valor Sugerido</Label>
              <Controller
                name="priceRange"
                control={control}
                render={({ field }) => (
                  <InputPrice
                    id="priceRange"
                    placeholder="R$ 0,00"
                    name={field.name}
                    control={control}
                  />
                )}
              />
              {errors.priceRange && (
                <p className="text-sm text-red-500">{errors.priceRange.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-red-500 hover:bg-red-600">Criar Grupo</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}