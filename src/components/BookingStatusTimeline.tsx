"use client";

import { Check, Clock, X } from "lucide-react";
import { useTranslation } from "./LanguageProvider";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired";

// A compact horizontal progress indicator for a booking's lifecycle.
// Happy path: Requested -> Confirmed -> Completed.
// Terminal states (cancelled / expired) collapse the remaining steps into a
// single red/grey end node so the user always sees where the booking stopped.
export default function BookingStatusTimeline({
  status,
}: {
  status: BookingStatus;
}) {
  const { t } = useTranslation();

  const isTerminalBad = status === "cancelled" || status === "expired";

  // Index of the furthest reached step on the happy path.
  const reachedIndex =
    status === "completed" ? 2 : status === "confirmed" ? 1 : 0;

  const steps = [
    { key: "requested", label: t("timeline.requested") },
    { key: "confirmed", label: t("timeline.confirmed") },
    { key: "completed", label: t("timeline.completed") },
  ];

  if (isTerminalBad) {
    const badLabel =
      status === "cancelled" ? t("timeline.cancelled") : t("timeline.expired");
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <StepNode state="done" icon={<Check className="w-4 h-4" />} />
        <span className="text-sm font-medium text-gray-700">
          {t("timeline.requested")}
        </span>
        <div className="h-px w-8 bg-gray-200" />
        <StepNode state="bad" icon={<X className="w-4 h-4" />} />
        <span className="text-sm font-medium text-red-600">{badLabel}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-1 py-2">
      {steps.map((step, i) => {
        const done = i < reachedIndex;
        const current = i === reachedIndex;
        const state: NodeState = done
          ? "done"
          : current
          ? "current"
          : "upcoming";
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <StepNode
                state={state}
                icon={
                  done ? (
                    <Check className="w-4 h-4" />
                  ) : current ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )
                }
              />
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  state === "upcoming" ? "text-gray-400" : "text-gray-700"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-2 -mt-5 ${
                  i < reachedIndex ? "bg-brand-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type NodeState = "done" | "current" | "upcoming" | "bad";

function StepNode({
  state,
  icon,
}: {
  state: NodeState;
  icon: React.ReactNode;
}) {
  const styles: Record<NodeState, string> = {
    done: "bg-brand-500 text-white border-brand-500",
    current: "bg-white text-brand-600 border-brand-500",
    upcoming: "bg-white text-gray-400 border-gray-200",
    bad: "bg-red-500 text-white border-red-500",
  };
  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${styles[state]}`}
    >
      {icon}
    </div>
  );
}
