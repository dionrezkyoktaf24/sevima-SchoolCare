import React from "react";
import { CheckCircleIcon } from "@/components/ui/icons";

export type ReportStatusType = "RECEIVED" | "UNDER_REVIEW" | "ACTION_TAKEN" | "RESOLVED";

interface TrackingStepperProps {
  currentStatus: ReportStatusType;
}

interface StepItem {
  key: ReportStatusType;
  label: string;
  description: string;
}

const STEPS: StepItem[] = [
  {
    key: "RECEIVED",
    label: "Laporan Diterima",
    description: "Laporan berhasil masuk ke sistem dan tersimpan aman di database sekolah.",
  },
  {
    key: "UNDER_REVIEW",
    label: "Sedang Ditinjau",
    description: "Guru BK dan Tim TPPK sedang menelaah kronologi serta informasi yang diberikan.",
  },
  {
    key: "ACTION_TAKEN",
    label: "Tindakan Dilakukan",
    description: "Langkah penanganan, verifikasi, atau pembinaan sedang dilaksanakan oleh pihak sekolah.",
  },
  {
    key: "RESOLVED",
    label: "Penanganan Selesai",
    description: "Proses penanganan dan tindak lanjut laporan telah selesai dilaksanakan.",
  },
];

const STATUS_ORDER: Record<ReportStatusType, number> = {
  RECEIVED: 0,
  UNDER_REVIEW: 1,
  ACTION_TAKEN: 2,
  RESOLVED: 3,
};

export function TrackingStepper({ currentStatus }: TrackingStepperProps) {
  const currentIndex = STATUS_ORDER[currentStatus] ?? 0;

  return (
    <div className="w-full py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
        Perjalanan Penanganan Laporan
      </h3>

      <ol className="relative border-l-2 border-slate-200 ml-4 sm:ml-6 space-y-8" aria-label="Alur Status Laporan">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <li
              key={step.key}
              className="relative pl-6 sm:pl-8"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Step indicator node */}
              <span
                className={`absolute -left-[17px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                  isCompleted
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                    : isCurrent
                    ? "bg-sky-600 border-sky-600 text-white ring-4 ring-sky-100 shadow-xs"
                    : "bg-white border-slate-300 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : isCurrent ? (
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                ) : (
                  <span className="text-xs font-mono font-medium">{idx + 1}</span>
                )}
              </span>

              {/* Step content */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className={`text-sm sm:text-base font-bold ${
                      isCurrent
                        ? "text-sky-900"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <span className="inline-flex items-center rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                      Status Saat Ini
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center text-[11px] font-medium text-emerald-700">
                      Selesai
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isPending ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
