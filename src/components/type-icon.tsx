import { Fan, Lightbulb, type LucideProps } from "lucide-react";

export function TypeIcon({
  typeKey,
  ...props
}: { typeKey: string } & LucideProps) {
  const Icon = typeKey === "fanled" ? Fan : Lightbulb;
  return <Icon aria-hidden {...props} />;
}
