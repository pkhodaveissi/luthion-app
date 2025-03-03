import GlobalHeader from "@/components/GlobalHeader";
import EntryPrompt from "./components/EntryPrompt";
import EntryActions from "./components/EntryActions";

export default function EntryPage() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-dvh bg-background text-foreground p-6">
      <GlobalHeader />
      <EntryPrompt goal="Send an email to my organization, initiating my notice period." />
      <EntryActions />
    </div>
  );
}
