"use client";

import { VideoCall } from "@/components/VideoCall";
import { useParams } from "next/navigation";

export default function PatientSessionPage() {
  const { id } = useParams<{ id: string }>();
  return <VideoCall consultId={id} />;
}
