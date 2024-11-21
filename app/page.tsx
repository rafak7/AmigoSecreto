import { GiftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SnowAnimation } from '@/components/snow-animation';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1c2e] to-[#2c1c2e] relative overflow-hidden">
      <SnowAnimation />
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <GiftIcon className="w-24 h-24 text-red-500 animate-bounce" />
          <h1 className="text-6xl font-bold text-white tracking-tight">
            Bem-Vindo ao
            <span className="block text-red-500 mt-2">Amigo Secreto</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Organize seu amigo secreto de forma mágica e especial neste Natal.
            Crie grupos, convide amigos e espalhe a alegria natalina!
          </p>
          <div className="flex gap-4 mt-8">
            <Button asChild size="lg" className="bg-red-500 hover:bg-red-600">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              <Link href="/register">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}