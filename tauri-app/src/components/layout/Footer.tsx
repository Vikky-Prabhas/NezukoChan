import { Send, Gamepad2, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-12 px-8 md:px-16">
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-[1920px] mx-auto text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <span className="text-white/80 font-serif font-black tracking-wider text-sm">NEZUKOCHAN.COM</span>
          <div className="flex flex-wrap justify-center gap-6 text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-colors">Terms &amp; Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contacts</a>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="text-white/40 text-[11px] font-medium tracking-wide">
          Built with <span className="text-white mx-0.5 animate-pulse">🍜</span> by{' '}
          <a
            href="https://nullgravity.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors font-bold"
          >
            Vikky Prabhas
          </a>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-4">
          {[
            { Icon: Send, url: "https://discord.gg/657ZJJUkkH", label: "Telegram" },
            { Icon: Gamepad2, url: "https://discord.gg/657ZJJUkkH", label: "Discord" },
            { Icon: Twitter, url: "https://x.com/Nullgravitydevs", label: "X / Twitter" },
            { Icon: Instagram, url: "https://discord.gg/657ZJJUkkH", label: "Instagram" },
          ].map(({ Icon, url, label }, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all duration-500 border border-white/5 hover:border-white/20 active:scale-95 translate-y-0 hover:-translate-y-1 shadow-lg hover:shadow-white/5"
            >
              <Icon className="w-4.5 h-4.5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
