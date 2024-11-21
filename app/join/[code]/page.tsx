import { JoinForm } from "./join-form";

export default function JoinGroup({ params }: { params: { code: string } }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#1a1c2e] to-[#2c1c2e] flex items-center justify-center p-4">
      <JoinForm code={params.code} />
    </main>
  );
}