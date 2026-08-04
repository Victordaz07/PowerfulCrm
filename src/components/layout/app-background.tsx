/**
 * Fondo global "Nimbus": gradiente radial + 3 blobs de color animados y
 * desenfocados. Fijo detrás de todo el contenido (-z-10), sin capturar
 * eventos. Los colores/gradiente salen de tokens CSS, así que cambian
 * con el tema automáticamente.
 */
export function AppBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "var(--bg-grad)" }}
    >
      <div
        className="absolute rounded-full"
        style={{
          top: -120,
          left: "8%",
          width: 420,
          height: 420,
          background: "var(--blob-1)",
          filter: "blur(90px)",
          animation: "floatBlob 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: -140,
          right: "6%",
          width: 480,
          height: 480,
          background: "var(--blob-2)",
          filter: "blur(100px)",
          animation: "floatBlob 20s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "40%",
          left: "45%",
          width: 300,
          height: 300,
          background: "var(--blob-3)",
          filter: "blur(90px)",
          animation: "floatBlob 24s ease-in-out infinite",
        }}
      />
    </div>
  );
}
