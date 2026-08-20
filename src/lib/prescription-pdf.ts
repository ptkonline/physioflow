import type { PrescriptionMedicine } from "@/lib/care-types";
import { jsPDF } from "jspdf";

export async function generatePrescriptionPdf(input: {
  clinicName: string;
  clinicAddress: string;
  doctorName: string;
  doctorId: string;
  patientName: string;
  title: string;
  medicines: PrescriptionMedicine[];
  notes: string;
}) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("PhysioFlow prescription", 20, 22);
  doc.setFontSize(11);
  doc.text(input.clinicName, 20, 32);
  doc.text(input.clinicAddress, 20, 38);
  doc.text(`Doctor: ${input.doctorName} (${input.doctorId})`, 20, 48);
  doc.text(`Patient: ${input.patientName}`, 20, 54);
  doc.text(input.title, 20, 66);
  let y = 80;
  doc.setFont("helvetica", "bold");
  doc.text("Medicines", 20, y);
  doc.setFont("helvetica", "normal");
  y += 8;
  for (const med of input.medicines.filter((m) => m.name.trim())) {
    const line = `${med.name} — ${med.dosage}, ${med.frequency}, ${med.duration}`;
    doc.text(line, 20, y);
    y += 8;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }
  if (input.notes.trim()) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 20, y);
    doc.setFont("helvetica", "normal");
    y += 8;
    const wrapped = doc.splitTextToSize(input.notes, 170);
    doc.text(wrapped, 20, y);
  }
  return doc.output("datauristring");
}
