export default function DotGrid() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.04]"
      style={{
        backgroundImage: "radial-gradient(#242422 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    />
  );
}
