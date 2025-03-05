import Image from "next/image";

export default function GlobalHeader() {
  return (
    <header className="flex flex-col items-center mb-4">
      <Image src="/badges/steady.svg" alt="Rank Badge" width={60} height={60} />
    </header>
  );
}
