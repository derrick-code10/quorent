interface SectionLabelProps {
  color: string;
  children: string;
}

export default function SectionLabel({ color, children }: SectionLabelProps) {
  return (
    <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold border-b-2 border-text-primary pb-2 mb-4 flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${color} inline-block shrink-0`} />
      {children}
    </h3>
  );
}
