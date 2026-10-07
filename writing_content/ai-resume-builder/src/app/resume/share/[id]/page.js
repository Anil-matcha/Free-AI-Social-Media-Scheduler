import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Shared Resume - AI Resume Builder",
  description: "View my professionally crafted resume created with AI.",
};

export default async function SharePage({ params }) {
  const { id } = params;

  const resume = await prisma.resume.findUnique({
    where: { id }
  });

  if (!resume || resume.status !== "completed") {
    notFound();
  }

  return (
    <div className="fixed inset-0 h-screen w-screen bg-slate-50">
      <iframe
        srcDoc={resume.htmlContent}
        className="h-full w-full border-none"
        title={resume.title}
        sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
      />
    </div>
  );
}
