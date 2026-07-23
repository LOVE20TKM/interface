"use client";

import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import Header from "@/src/components/Header";
import { useTheme } from "@/src/hooks/useTheme";
import { THEMES } from "@/src/lib/theme";

export default function ThemePage() {
  const { theme, selectTheme } = useTheme();

  return (
    <>
      <Header title="主题" showBackButton={true} />
      <main className="flex-grow">
        <div className="mx-auto w-full max-w-2xl px-4 pb-24 pt-3 sm:pt-6">
          <section>
            <div className="grid grid-cols-2 gap-1 rounded-md bg-greyscale-100 p-1" role="radiogroup" aria-label="主题">
              {THEMES.map((item) => {
                const Icon = item.id === "dark" ? Moon : Sun;
                const selected = item.id === theme;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => selectTheme(item.id)}
                    className={cn(
                      "flex h-11 items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors",
                      selected
                        ? "bg-background text-foreground shadow-sm"
                        : "text-greyscale-500 hover:bg-greyscale-200 hover:text-greyscale-900",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
