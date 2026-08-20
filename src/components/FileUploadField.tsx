"use client";

import { ACCEPTED_DOC_TYPES } from "@/lib/doctor-register-schema";
import { FileText, Upload } from "lucide-react";
import { useRef, type DragEvent } from "react";
import type { Control, FieldPath } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { DoctorRegisterValues } from "@/lib/doctor-register-schema";

const ACCEPT = [...ACCEPTED_DOC_TYPES, ".pdf"].join(",");

export function FileUploadField({
  name,
  label,
  hint,
  control,
  accept = ACCEPT,
  emptyLabel = "Drop a PDF or image, or browse",
}: {
  name: FieldPath<DoctorRegisterValues>;
  label: string;
  hint: string;
  control: Control<DoctorRegisterValues>;
  accept?: string;
  emptyLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const file = field.value instanceof File ? field.value : null;
        function take(next: File | undefined) {
          if (!next) return;
          field.onChange(next);
        }
        function onDrop(event: DragEvent<HTMLDivElement>) {
          event.preventDefault();
          take(event.dataTransfer.files[0]);
        }
        return (
          <div className="space-y-1">
            <span className="block font-medium">{label}</span>
            <p className="text-sm text-muted">{hint}</p>
            <div
              role="button"
              tabIndex={0}
              className="rounded-2xl border border-dashed border-line bg-white px-4 py-5"
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            >
              <input
                ref={inputRef}
                className="sr-only"
                type="file"
                accept={accept}
                onChange={(e) => take(e.target.files?.[0])}
              />
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-sage text-teal-dark">
                  {file ? <FileText size={22} /> : <Upload size={22} />}
                </span>
                <div>
                  <p className="font-medium">{file ? file.name : emptyLabel}</p>
                  <p className="text-sm text-muted">{file ? `${Math.ceil(file.size / 1024)} KB` : "Max 8 MB"}</p>
                </div>
              </div>
            </div>
            {fieldState.error && <p className="text-rose">{fieldState.error.message}</p>}
          </div>
        );
      }}
    />
  );
}
