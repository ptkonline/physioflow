"use client";

import { BookingDetail } from "@/components/BookingDetail";
import { useParams } from "next/navigation";

export default function DoctorBookingDetailPage() {
  const params = useParams<{ id: string }>();
  return <BookingDetail bookingId={params.id} />;
}
