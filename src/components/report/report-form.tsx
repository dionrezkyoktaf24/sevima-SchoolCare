"use client";

import React, { useState } from "react";
import Link from "next/link";
import { REPORT_CATEGORIES } from "@/lib/validation/report";
import { Button } from "@/components/ui/button";
import { LockIcon } from "@/components/ui/icons";
import { ReportSuccess } from "./report-success";

interface ReportFormProps {
  initialSchoolId?: string;
}

export function ReportForm({ initialSchoolId = "SMK-TELKOM-SBY" }: ReportFormProps) {
  // Form fields
  const [schoolId, setSchoolId] = useState(initialSchoolId);
  const [category, setCategory] = useState<string>("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    token: string;
    reportId: string;
    category: string;
    schoolId: string;
  } | null>(null);

  // Available seeded schools
  const availableSchools = [
    { id: "SMK-TELKOM-SBY", name: "SMK Telkom Surabaya" },
    { id: "SMKN1-SBY", name: "SMK Negeri 1 Surabaya" },
  ];

  // Client validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!schoolId || schoolId.trim() === "") {
      newErrors.school_id = "Pilih sekolah tempat kejadian terjadi.";
    }

    if (!category || category.trim() === "") {
      newErrors.category = "Pilih salah satu kategori laporan.";
    }

    if (!incidentLocation || incidentLocation.trim() === "") {
      newErrors.incident_location = "Lokasi kejadian wajib diisi.";
    } else if (incidentLocation.length > 150) {
      newErrors.incident_location = "Lokasi kejadian maksimal 150 karakter.";
    }

    if (incidentTime && incidentTime.length > 100) {
      newErrors.incident_time = "Perkiraan waktu maksimal 100 karakter.";
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      newErrors.description = "Deskripsi kejadian wajib diisi.";
    } else if (trimmedDesc.length < 20) {
      newErrors.description = `Deskripsi terlalu pendek (minimal 20 karakter, saat ini ${trimmedDesc.length} karakter).`;
    } else if (trimmedDesc.length > 2000) {
      newErrors.description = "Deskripsi kejadian maksimal 2000 karakter.";
    }

    if (evidenceUrl && evidenceUrl.trim() !== "") {
      try {
        const parsed = new URL(evidenceUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          newErrors.evidence_url = "URL bukti harus menggunakan protokol http atau https.";
        }
      } catch {
        newErrors.evidence_url = "Format tautan bukti tidak valid (contoh: https://drive.google.com/...).";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (isSubmitting) return;

    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        school_id: schoolId.trim(),
        category: category.trim(),
        incident_location: incidentLocation.trim(),
        incident_time: incidentTime.trim() ? incidentTime.trim() : null,
        description: description.trim(),
        evidence_url: evidenceUrl.trim() ? evidenceUrl.trim() : null,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg =
          data?.error?.message ||
          "Laporan belum berhasil dikirim. Periksa kembali informasi yang diisi.";
        setServerError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      // Safe local storage backup of the received secret ticket token
      const token = data.data.secret_token;
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("schoolcare_tracking_token", token);
          localStorage.setItem("schoolcare_last_token", token);
        }
      } catch {
        // Non-blocking storage access failure
      }

      setSubmittedData({
        token,
        reportId: data.data.report_id,
        category: category.trim(),
        schoolId: schoolId.trim(),
      });
    } catch {
      setServerError(
        "Laporan belum berhasil dikirim. Periksa koneksi internet Anda lalu coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCategory("");
    setIncidentLocation("");
    setIncidentTime("");
    setDescription("");
    setEvidenceUrl("");
    setErrors({});
    setServerError(null);
    setSubmittedData(null);
  };

  // If successfully submitted, render ReportSuccess view
  if (submittedData) {
    return (
      <ReportSuccess
        token={submittedData.token}
        reportId={submittedData.reportId}
        category={submittedData.category}
        schoolId={submittedData.schoolId}
        onReset={handleReset}
      />
    );
  }

  const descLength = description.trim().length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs">
      {/* Form Navigation Header */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 rounded-xs"
        >
          <span>← Kembali ke Beranda</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Buat Laporan Baru
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Ceritakan kejadian yang ingin kamu sampaikan. Kamu tidak perlu membuat akun, dan data
          pribadi dikumpulkan seminimal mungkin untuk menjamin rasa aman pelapor.
        </p>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-start gap-3"
        >
          <span className="font-bold shrink-0">!</span>
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Field 1: Sekolah */}
        <div>
          <label htmlFor="school_id" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Sekolah Terkait <span className="text-rose-600">*</span>
          </label>
          <select
            id="school_id"
            value={schoolId}
            onChange={(e) => {
              setSchoolId(e.target.value);
              if (errors.school_id) {
                setErrors((prev) => ({ ...prev, school_id: "" }));
              }
            }}
            aria-invalid={!!errors.school_id}
            aria-describedby={errors.school_id ? "school_id-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors"
          >
            {availableSchools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name} ({school.id})
              </option>
            ))}
          </select>
          {errors.school_id && (
            <p id="school_id-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.school_id}
            </p>
          )}
        </div>

        {/* Field 2: Kategori Laporan */}
        <div>
          <fieldset>
            <legend className="text-sm font-semibold text-slate-900 mb-2">
              Kategori Kejadian <span className="text-rose-600">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REPORT_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-150 text-sm select-none ${
                      isSelected
                        ? "border-sky-600 bg-sky-50/70 text-sky-950 font-semibold shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat}
                      checked={isSelected}
                      onChange={() => {
                        setCategory(cat);
                        if (errors.category) {
                          setErrors((prev) => ({ ...prev, category: "" }));
                        }
                      }}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-600 border-slate-300"
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {errors.category && (
            <p id="category-error" className="mt-1.5 text-xs text-rose-600 font-medium">
              {errors.category}
            </p>
          )}
        </div>

        {/* Field 3: Lokasi Kejadian */}
        <div>
          <label
            htmlFor="incident_location"
            className="block text-sm font-semibold text-slate-900 mb-1.5"
          >
            Lokasi Kejadian <span className="text-rose-600">*</span>
          </label>
          <input
            id="incident_location"
            type="text"
            value={incidentLocation}
            maxLength={150}
            placeholder="Contoh: Toilet lantai 2, lorong kelas XII, kantin belakang"
            onChange={(e) => {
              setIncidentLocation(e.target.value);
              if (errors.incident_location) {
                setErrors((prev) => ({ ...prev, incident_location: "" }));
              }
            }}
            aria-invalid={!!errors.incident_location}
            aria-describedby={errors.incident_location ? "incident_location-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors"
          />
          {errors.incident_location ? (
            <p id="incident_location-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.incident_location}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Sebutkan area atau ruangan tempat peristiwa terjadi (maksimal 150 karakter).
            </p>
          )}
        </div>

        {/* Field 4: Perkiraan Waktu Kejadian */}
        <div>
          <label htmlFor="incident_time" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Perkiraan Waktu Kejadian <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <input
            id="incident_time"
            type="text"
            value={incidentTime}
            maxLength={100}
            placeholder="Contoh: Kemarin jam istirahat pertama, atau 26 September 2026 pukul 10.00"
            onChange={(e) => {
              setIncidentTime(e.target.value);
              if (errors.incident_time) {
                setErrors((prev) => ({ ...prev, incident_time: "" }));
              }
            }}
            aria-invalid={!!errors.incident_time}
            aria-describedby={errors.incident_time ? "incident_time-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors"
          />
          {errors.incident_time && (
            <p id="incident_time-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.incident_time}
            </p>
          )}
        </div>

        {/* Field 5: Deskripsi Kejadian / Kronologi */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="description" className="block text-sm font-semibold text-slate-900">
              Ceritakan Apa yang Terjadi <span className="text-rose-600">*</span>
            </label>
            <span
              className={`text-xs font-mono ${
                descLength >= 20 ? "text-emerald-700 font-medium" : "text-slate-400"
              }`}
            >
              {descLength} / min. 20 karakter
            </span>
          </div>
          <textarea
            id="description"
            rows={5}
            maxLength={2000}
            value={description}
            placeholder="Jelaskan kronologi kejadian berdasarkan apa yang kamu lihat, alami, atau ketahui secara objektif..."
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: "" }));
              }
            }}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "description-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors leading-relaxed"
          />
          {errors.description ? (
            <p id="description-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.description}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Tidak perlu menambahkan informasi yang tidak kamu yakini kebenarannya.
            </p>
          )}
        </div>

        {/* Field 6: Tautan Bukti (Opsional) */}
        <div>
          <label htmlFor="evidence_url" className="block text-sm font-semibold text-slate-900 mb-1.5">
            Tautan Bukti Pendukung <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <input
            id="evidence_url"
            type="url"
            value={evidenceUrl}
            placeholder="https://drive.google.com/... (foto, rekaman, atau tangkapan layar)"
            onChange={(e) => {
              setEvidenceUrl(e.target.value);
              if (errors.evidence_url) {
                setErrors((prev) => ({ ...prev, evidence_url: "" }));
              }
            }}
            aria-invalid={!!errors.evidence_url}
            aria-describedby={errors.evidence_url ? "evidence_url-error" : undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:border-sky-600 transition-colors"
          />
          {errors.evidence_url ? (
            <p id="evidence_url-error" className="mt-1 text-xs text-rose-600 font-medium">
              {errors.evidence_url}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-500">
              Pastikan tautan dapat dibuka (pengaturan akses terbuka bagi tim penilai).
            </p>
          )}
        </div>

        {/* Privacy & Responsibility Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
          <LockIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p>
            Dengan mengirim laporan ini, kamu memahami bahwa informasi yang kamu berikan akan
            digunakan untuk membantu proses penanganan oleh pihak Bimbingan Konseling (BK) dan Tim
            Pencegahan dan Penanganan Kekerasan (TPPK) sekolah.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            className="w-full justify-center text-base"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Mengirim Laporan...</span>
              </span>
            ) : (
              <span>Kirim Laporan</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
