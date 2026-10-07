export default function FooterSection() {
  return (
    <footer className="bg-slate-950/80 border-t border-white/10 py-10 px-4 text-center mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} Prompt Architect. All rights reserved. Engineered for elite prompt output.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</a>
          <span className="text-zinc-600">|</span>
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</a>
          <span className="text-zinc-600">|</span>
          <a href="#" className="text-zinc-400 hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
}
