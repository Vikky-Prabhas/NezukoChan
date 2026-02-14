import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function ScrollRow({ title, children, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    const amount = dir === "left" ? -ref.current.offsetWidth + 100 : ref.current.offsetWidth - 100;
    ref.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-serif font-bold text-white tracking-tight">{title}</h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all duration-300 border border-white/5 hover:border-white/20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white transition-all duration-300 border border-white/5 hover:border-white/20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 snap-x scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </section>
  );
}
