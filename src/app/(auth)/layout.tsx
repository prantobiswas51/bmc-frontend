import { Fan, Lightbulb } from "lucide-react";
import Image from "next/image";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-100 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-xl md:grid-cols-[1fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-brand-600 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-lg font-bold">
              B
            </span>
            <span className="font-medium">BongoMaker Control</span>
          </div>
          <div>
            <p className="text-2xl leading-snug font-medium">
              Your fans and lights, from anywhere.
            </p>
            <p className="mt-3 text-sm text-white">
              Control BongoMaker devices across every home and office, share
              access by role, and see what each device is doing.
            </p>
          </div>
          <div className="flex gap-3" aria-hidden>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
              <Fan className="h-6 w-6" />
            </span>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-600">
              <Lightbulb className="h-6 w-6" />
            </span>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <Image
            src="/bongomaker.png"
            alt="BongoMaker"
            width={188}
            height={32}
            priority
            className="mb-8 h-8 w-auto"
          />
          {children}
        </div>
      </div>
    </main>
  );
}
