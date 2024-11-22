"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { CreateGroupModal } from "@/components/create-group-modal";
import { InviteParticipantsModal } from "@/components/invite-participants-modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnowAnimation } from "@/components/snow-animation";
import { useToast } from "@/components/ui/use-toast";
import { GiftIcon, PlusCircle, Users, Calendar, DollarSign, UserPlus, BellRing } from "lucide-react";

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
  ownerId: string;
}

const getUserGroupsKey = (userId: string) => `groups-${userId}`;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Carregar grupos do localStorage quando o componente montar
  useEffect(() => {
    const loadGroups = () => {
      if (!user) {
        console.log('Usuário não está logado, não carregando grupos');
        setGroups([]);
        return;
      }

      console.log('Carregando grupos para o usuário:', user.id);
      const key = getUserGroupsKey(user.id);
      const storedGroups = localStorage.getItem(key);
      console.log('Grupos armazenados (raw):', storedGroups);
      
      if (storedGroups) {
        try {
          const parsedGroups = JSON.parse(storedGroups);
          
          // Validar se o valor parseado é um array
          if (!Array.isArray(parsedGroups)) {
            console.error('Dados armazenados não são um array:', parsedGroups);
            setGroups([]);
            return;
          }

          // Validar cada grupo no array
          const validGroups = parsedGroups.filter(group => {
            return (
              group &&
              typeof group === 'object' &&
              typeof group.id === 'string' &&
              typeof group.name === 'string' &&
              Array.isArray(group.participants) &&
              group.ownerId === user.id // Garante que só carregamos grupos do usuário atual
            );
          });

          console.log('Grupos válidos:', validGroups);
          setGroups(validGroups);
          
          // Atualiza o grupo selecionado se necessário
          if (selectedGroup) {
            const updatedSelectedGroup = validGroups.find(g => g.id === selectedGroup.id);
            console.log('Grupo selecionado atualizado:', updatedSelectedGroup);
            if (updatedSelectedGroup) {
              setSelectedGroup(updatedSelectedGroup);
            } else {
              setSelectedGroup(null); // Limpa a seleção se o grupo não existe mais
            }
          }
        } catch (error) {
          console.error('Erro ao carregar grupos:', error);
          setGroups([]);
          setSelectedGroup(null);
        }
      } else {
        console.log('Nenhum grupo encontrado para o usuário:', user.id);
        setGroups([]);
      }
    };

    // Carrega os grupos inicialmente
    loadGroups();

    // Adiciona um listener para mudanças no localStorage
    const handleStorage = (e: StorageEvent) => {
      const key = getUserGroupsKey(user?.id || '');
      console.log('Evento storage detectado:', e);
      
      if (e.key === key) {
        console.log('Mudança detectada nos grupos do usuário atual');
        loadGroups();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [user, selectedGroup]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = (newGroup: Omit<Group, 'id' | 'inviteCode' | 'invitePassword' | 'participants' | 'ownerId'>) => {
    if (!user) {
      console.error('Tentativa de criar grupo sem usuário logado');
      toast({
        title: "Erro ao criar grupo",
        description: "Você precisa estar logado para criar um grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const inviteCode = generateInviteCode();
      const invitePassword = generateInviteCode();
      const groupWithId: Group = {
        ...newGroup,
        id: Date.now().toString(),
        inviteCode,
        invitePassword,
        participants: [],
        ownerId: user.id,
      };
      
      console.log('Criando novo grupo:', groupWithId);
      
      setGroups(prev => {
        const newGroups = [...prev, groupWithId];
        // Salva no localStorage quando um novo grupo é criado
        try {
          localStorage.setItem(getUserGroupsKey(user.id), JSON.stringify(newGroups));
          console.log('Grupo salvo com sucesso no localStorage');
        } catch (error) {
          console.error('Erro ao salvar grupo no localStorage:', error);
          throw error; // Propaga o erro para ser tratado no catch externo
        }
        return newGroups;
      });

      // Dispara evento storage para atualizar outras abas
      const storageEvent = new StorageEvent('storage', {
        key: getUserGroupsKey(user.id),
        newValue: JSON.stringify([...groups, groupWithId]),
        url: window.location.href
      });
      
      console.log('Disparando evento storage para novo grupo');
      window.dispatchEvent(storageEvent);

      // Feedback de sucesso
      toast({
        title: "Grupo criado",
        description: "O grupo foi criado com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      toast({
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleManageGroup = (group: Group) => {
    console.log('Gerenciando grupo:', group);
    setSelectedGroup(group);
    setIsInviteModalOpen(true);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    if (!user) {
      console.error('Tentativa de atualizar grupo sem usuário logado');
      toast({
        title: "Erro ao atualizar grupo",
        description: "Você precisa estar logado para atualizar um grupo.",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o grupo pertence ao usuário atual
    if (updatedGroup.ownerId !== user.id) {
      console.error('Tentativa de atualizar grupo de outro usuário');
      toast({
        title: "Erro ao atualizar grupo",
        description: "Você não tem permissão para atualizar este grupo.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Atualizando grupo:', updatedGroup);
      
      setGroups(prev => {
        const newGroups = prev.map(g => g.id === updatedGroup.id ? updatedGroup : g);
        
        try {
          // Salva no localStorage quando um grupo é atualizado
          localStorage.setItem(getUserGroupsKey(user.id), JSON.stringify(newGroups));
          console.log('Grupos após atualização:', newGroups);
        } catch (error) {
          console.error('Erro ao salvar no localStorage:', error);
          throw error; // Propaga o erro para ser tratado no catch externo
        }
        
        return newGroups;
      });

      setSelectedGroup(updatedGroup);

      // Notifica outras abas
      const storageEvent = new StorageEvent('storage', {
        key: getUserGroupsKey(user.id),
        newValue: JSON.stringify(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g)),
        url: window.location.href
      });
      
      console.log('Disparando evento storage para atualização');
      window.dispatchEvent(storageEvent);

      // Feedback de sucesso
      toast({
        title: "Grupo atualizado",
        description: "As alterações foram salvas com sucesso.",
      });

    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      toast({
        title: "Erro ao atualizar grupo",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen christmas-gradient relative">
      <SnowAnimation />
      <div className="max-w-7xl mx-auto p-6 relative z-10">
        <nav className="flex justify-between items-center mb-8 bg-card/50 backdrop-blur-lg rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <GiftIcon className="w-8 h-8 text-red-500 animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <h1 className="text-2xl font-bold text-white">Amigo Secreto</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:text-red-500"
            >
              <BellRing className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button
              variant="ghost"
              className="text-white hover:text-red-500"
              onClick={() => {
                logout();
                router.push('/login');
              }}
            >
              Sair
            </Button>
          </div>
        </nav>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo, {user.name}! 🎄</h2>
          <p className="text-gray-300">Organize seu amigo secreto e espalhe a magia do Natal</p>
        </div>

        <Card className="christmas-card p-6 mb-8 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              className="bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-red-500/20 transition-all duration-300"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Novo Grupo
            </Button>
          </div>
          <p className="text-sm text-gray-400">
            Crie um novo grupo de amigo secreto e comece a espalhar a alegria natalina!
          </p>
        </Card>

        {groups.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Meus Grupos
              </h3>
              <span className="text-sm text-gray-400">{groups.length} grupo(s)</span>
            </div>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groups.map((group) => (
                <Card key={group.id} className="christmas-card p-3 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="text-sm font-medium truncate flex-1">{group.name}</h4>
                    <span className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded-full shrink-0">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-2 line-clamp-1">{group.description}</p>
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center text-[10px] text-gray-300">
                      <Calendar className="w-3 h-3 mr-1 text-red-400 shrink-0" />
                      <span className="truncate">
                        {format(group.date, "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-300">
                      <DollarSign className="w-3 h-3 mr-1 text-green-400 shrink-0" />
                      <span className="truncate">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(group.priceRange)}
                      </span>
                    </div>
                    <div className="flex items-center text-[10px] text-gray-300">
                      <UserPlus className="w-3 h-3 mr-1 text-blue-400 shrink-0" />
                      <span className="truncate">
                        {group.participants.length} participante{group.participants.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full h-6 text-[10px] hover:bg-white/10 px-2"
                    onClick={() => handleManageGroup(group)}
                  >
                    Gerenciar
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 && (
          <Card className="christmas-card p-8 text-center">
            <GiftIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum grupo criado</h3>
            <p className="text-sm text-gray-400 mb-4">
              Crie seu primeiro grupo de amigo secreto e convide seus amigos!
            </p>
            <Button 
              className="bg-red-500 hover:bg-red-600"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Criar Primeiro Grupo
            </Button>
          </Card>
        )}
      </div>

      <CreateGroupModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen}
        onCreateGroup={handleCreateGroup}
      />

      {selectedGroup && (
        <InviteParticipantsModal
          open={isInviteModalOpen}
          onOpenChange={setIsInviteModalOpen}
          group={selectedGroup}
          onUpdateGroup={handleUpdateGroup}
        />
      )}
    </main>
  );
}