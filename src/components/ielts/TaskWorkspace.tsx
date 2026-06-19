import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TaskWorkspaceProps {
  activeTask: 1 | 2;
  heading: string;
  subtitle: string;
  wordCount: number;
  minWords: number;
  onSwitchTask: (task: 1 | 2) => void;
  onDownloadPDF: () => void;
  onAlternateAction?: ReactNode;
  leftContent: ReactNode;
  rightContent: ReactNode;
  topNotice?: string;
}

export function TaskWorkspace({
  activeTask,
  wordCount,
  minWords,
  onSwitchTask,
  onDownloadPDF,
  onAlternateAction,
  leftContent,
  rightContent,
}: TaskWorkspaceProps) {
  return (
    <section className="px-4 py-6 space-y-8 sm:px-6 lg:px-8">
      <div className="">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex flex-wrap items-center gap-3 ml-auto">
            {[1, 2].map((task) => (
              <Button
                key={task}
                variant={activeTask === task ? "default" : "outline"}
                size="lg"
                className={cn(
                  "min-w-[120px] px-4",
                  activeTask === task
                    ? "bg-primary-1 text-primary-foreground shadow-sm shadow-primary-1/30"
                    : "text-foreground/70 hover:bg-secondary",
                )}
                onClick={() => onSwitchTask(task as 1 | 2)}
              >
                Task {task}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mt-3">
          <div className="rounded-[2rem] border col-span-2 border-border bg-card p-6 shadow-sm shadow-slate-200">
            {leftContent}
          </div>
          <div className="rounded-[2rem] col-span-2 border border-border bg-card p-6 shadow-sm shadow-slate-200">
            {rightContent}
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-border bg-secondary p-5 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm ">Word count</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {wordCount} / {minWords}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {onAlternateAction}
            <Button
              size="lg"
              className="min-w-[170px] bg-primary-1 text-primary-foreground shadow-sm shadow-primary-1/30"
              onClick={onDownloadPDF}
            >
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
