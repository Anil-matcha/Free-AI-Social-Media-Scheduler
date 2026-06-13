import { prisma } from "@/lib/prisma";
import { CardVisitorView } from "./CardVisitorView";
import Link from "next/link";
import { FaIdCard } from "react-icons/fa";

export default async function CardPage({ params }) {
  const resolvedParams = await params;
  const { hash } = resolvedParams;

  const card = await prisma.businessCard.findUnique({
    where: { urlHash: hash }
  });

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans text-center">
        <FaIdCard className="text-violet-500 text-5xl mb-4 animate-pulse" />
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Card Not Found</h1>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          The digital business card you are trying to view does not exist or has been removed by the owner.
        </p>
        <Link href="/" className="bg-violet-600 hover:bg-violet-750 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-violet-500/10 active:scale-95 transition-all">
          Create Your Own Card
        </Link>
      </div>
    );
  }

  // Convert dates and other complex fields before passing to Client Component
  const serializableCard = {
    ...card,
    createTime: card.createTime.toISOString(),
    updateTime: card.updateTime.toISOString()
  };

  return <CardVisitorView card={serializableCard} />;
}
