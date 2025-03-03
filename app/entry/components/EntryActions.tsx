"use client";
import { Circle, Pen } from "lucide-react"; // Using Lucide Icons for the edit button
import { useRouter } from "next/navigation";

export default function EntryActions() {
  const router = useRouter();
  
  return (
    <div className="flex w-full max-w-md justify-between items-center gap-x-4">
      <button
        onClick={() => router.push("/entry/editing")}
        className="btn btn-wide flex items-center justify-center">
        <Circle size={32} className="mr-2" />
        Commit
      </button>
      <button className="btn">
        <Pen size={32} />
      </button>
    </div>
  );
}
