"use client";

import { Check, Clock, X, Ban } from "lucide-react";
import { useTranslation } from "./LanguageProvider";

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired";

// A compact horizontal progress indicator for a booking's lifecycle.
// Happy path: Requested -> Confirmed -> Completed.
// Terminal states end the line at a distinct node: cancelled = red (an action),
// expired = grey (a lapse). The reached steps always render as done (check);
// only the next, not-yet-reached step shows as current (clock).
export default function BookingStatusTimeline({
  status,
}: {
  status: BookingStatus;
}) {
  const { t } = useTranslation();

  const isTerminalBad = status === "cancelled" || status === "expired";

  // How many happy-path steps are fully completed. 'pending' already means the
  // request was made, so Requested is done (1) and Confirmed is the current step.
  const doneCount =
    status === "completed" ? 3 : status === "confirmed" ? 2 : 1;

  const steps = [
    { key: "requested", label: t("timeline.requested") },
    { key: "confirmed", label: t("timeline.confirmed") },
    { key: "completed", label: t("timeline.completed") },
  ];

  if (isTerminalBad) {
    const isCancelled = status === "cancelled";
    const badLabel = isCancelled
      ? t("timeline.cancelled")
      : t("timeline.expired");
    return (
      <div className="flex items-center justify-center gap-3 py-2">
        <StepNode state="done" icon={<Check className="w-4 h-4" />} />
        <span className="text-sm font-medium text-gray-700">
          {t("timeline.requested")}
        </span>
        <div className="h-px w-8 bg-gray-200" />
        <StepNode
          state={isCancelled ? "bad" : "ended"}
          icon={
            isCancelled ? (
              <X className="w-4 h-4" />
            ) : (
              <Ban className="w-4 h-4" />
            )
          }
        />
        <span
          className={`text-sm font-medium ${
            isCancelled ? "text-red-600" : "text-gray-500"
          }`}
        >
          {badLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-1 py-2">
      {steps.map((step, i) => {
        const done = i < doneCount;
        const current = i === doneCount; // next step awaiting action
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
                  i < doneCount - 1 ? "bg-brand-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

type NodeState = "done" | "current" | "upcoming" | "bad" | "ended";

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
    ended: "bg-gray-400 text-white border-gray-400",
  };
  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${styles[state]}`}
    >
      {icon}
    </div>
  );
}
