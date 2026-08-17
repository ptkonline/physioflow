"use client";

import { AuthGate } from "@/components/AuthGate";
import { VideoCall } from "@/components/VideoCall";
import { useParams } from "next/navigation";

export default function ConsultPage() {
  const params = useParams<{ id: string }>();
  return (
    <AuthGate>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <VideoCall consultId={params.id} />
      </div>
    </AuthGate>
  );
}
