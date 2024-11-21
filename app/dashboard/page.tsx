"use client";

import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GiftIcon, PlusCircle, Users, Calendar, DollarSign, UserPlus, BellRing } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { CreateGroupModal } from "@/components/create-group-modal";
import { InviteParticipantsModal } from "@/components/invite-participants-modal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnowAnimation } from "@/components/snow-animation";

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Carregar grupos do localStorage quando o componente montar
  useEffect(() => {
    const loadGroups = () => {
      console.log('Carregando grupos...');
      const storedGroups = localStorage.getItem('groups');
      console.log('Grupos armazenados (raw):', storedGroups);
      
      if (storedGroups) {
        try {
          const parsedGroups = JSON.parse(storedGroups);
          console.log('Grupos parseados:', parsedGroups);
          setGroups(parsedGroups);
          
          // Se há um grupo selecionado, atualize-o com os dados mais recentes
          if (selectedGroup) {
            const updatedSelectedGroup = parsedGroups.find(g => g.id === selectedGroup.id);
            console.log('Grupo selecionado atualizado:', updatedSelectedGroup);
            if (updatedSelectedGroup) {
              setSelectedGroup(updatedSelectedGroup);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar grupos:', error);
        }
      } else {
        console.log('Nenhum grupo encontrado no localStorage');
        setGroups([]);
      }
    };

    // Carrega os grupos inicialmente
    loadGroups();

    // Adiciona um listener para mudanças no localStorage
    const handleStorage = (e: StorageEvent) => {
      console.log('Evento storage detectado:', e);
      if (e.key === 'groups' && e.newValue !== null) {
        console.log('Mudança nos grupos detectada');
        try {
          const newGroups = JSON.parse(e.newValue);
          setGroups(newGroups);
          
          if (selectedGroup) {
            const updatedSelectedGroup = newGroups.find(g => g.id === selectedGroup.id);
            if (updatedSelectedGroup) {
              setSelectedGroup(updatedSelectedGroup);
            }
          }
        } catch (error) {
          console.error('Erro ao processar novos grupos:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [selectedGroup]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generatePassword = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = (newGroup: Omit<Group, 'id' | 'inviteCode' | 'invitePassword' | 'participants'>) => {
    const inviteCode = generateInviteCode();
    const invitePassword = generateInviteCode();
    const groupWithId: Group = {
      ...newGroup,
      id: Date.now().toString(),
      inviteCode,
      invitePassword,
      participants: [],
    };
    
    setGroups(prev => {
      const newGroups = [...prev, groupWithId];
      // Salva no localStorage quando um novo grupo é criado
      localStorage.setItem('groups', JSON.stringify(newGroups));
      return newGroups;
    });

    // Dispara evento storage para atualizar outras abas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'groups',
      newValue: JSON.stringify([...groups, groupWithId]),
      url: window.location.href
    }));
  };

  const handleManageGroup = (group: Group) => {
    console.log('Gerenciando grupo:', group);
    setSelectedGroup(group);
    setIsInviteModalOpen(true);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    console.log('Atualizando grupo:', updatedGroup);
    setGroups(prev => {
      const newGroups = prev.map(g => g.id === updatedGroup.id ? updatedGroup : g);
      // Salva no localStorage quando um grupo é atualizado
      localStorage.setItem('groups', JSON.stringify(newGroups));
      console.log('Grupos após atualização:', newGroups);
      return newGroups;
    });
    setSelectedGroup(updatedGroup);

    // Dispara evento storage para atualizar outras abas
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'groups',
      newValue: JSON.stringify(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g)),
      url: window.location.href
    }));
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <Card key={group.id} className="christmas-card p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-semibold">{group.name}</h4>
                    <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                      Ativo
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">{group.description}</p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-300">
                      <Calendar className="w-4 h-4 mr-2 text-red-400" />
                      {format(group.date, "PPP", { locale: ptBR })}
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(group.priceRange)}
                    </div>
                    <div className="flex items-center text-sm text-gray-300">
                      <UserPlus className="w-4 h-4 mr-2 text-blue-400" />
                      {group.participants.length} participante{group.participants.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full hover:bg-white/10"
                    onClick={() => handleManageGroup(group)}
                  >
                    Gerenciar Grupo
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