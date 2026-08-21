"use client";

import { ClinicMapThumb } from "@/components/maps/ClinicMapThumb";
import { DoctorAvatar } from "@/components/shared/DoctorAvatar";
import { VerifiedBadge } from "@/components/shared/VerifiedBadge";
import { formatSlot, openSlots } from "@/lib/availability";
import { calculateDistance, clinicPoint, formatDistanceKm, readPatientCoords, savePatientCoords } from "@/lib/geo";
import { doctorPricing, formatInr } from "@/lib/pricing";
import { averageRating } from "@/lib/reviews";
import { useStore } from "@/lib/store";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function PatientDoctors() {
  const { state } = useStore();
  const [here, setHere] = useState<{ latitude: number; longitude: number } | null>(null);
  const [geoNote, setGeoNote] = useState("Allow location to sort doctors by distance.");
  const doctors = state.users.filter((u) => u.role === "physio");

  useEffect(() => {
    const cached = readPatientCoords();
    if (cached) {
      setHere(cached);
      setGeoNote("Sorted by distance from you.");
    }
    if (!navigator.geolocation) {
      setGeoNote("Location is not available in this browser. Doctors are listed without distance.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        savePatientCoords(coords);
        setHere(coords);
        setGeoNote("Sorted by distance from you.");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNote("Location permission denied. Enable it under the lock icon in the address bar to see nearest clinics.");
          return;
        }
        setGeoNote("Could not read GPS. Doctors are listed without sorting by distance.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  }, []);

  const ranked = useMemo(() => {
    return doctors
      .map((d) => {
        const profile = state.doctors.find((p) => p.userId === d.id);
        const pin = clinicPoint(profile);
        const km =
          here && pin ? calculateDistance(here.latitude, here.longitude, pin.latitude, pin.longitude) : null;
        return { d, profile, pin, km };
      })
      .sort((a, b) => {
        if (a.km == null && b.km == null) return a.d.name.localeCompare(b.d.name);
        if (a.km == null) return 1;
        if (b.km == null) return -1;
        return a.km - b.km;
      });
  }, [doctors, here, state.doctors]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold">Find a doctor</h1>
        <p className="text-muted">See specialties, distance, and the next open slots. Book yourself — nobody at a desk needs to approve it.</p>
        <p className="mt-2 text-sm text-muted">{geoNote}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {ranked.map(({ d, profile, pin, km }) => {
          const next = openSlots(d.id, state, 8).slice(0, 3);
          const stars = averageRating(state.reviews ?? [], d.id);
          const pricing = doctorPricing(d.id, { consultationFee: profile?.consultationFee, pricing: profile?.pricing });
          return (
            <article key={d.id} className="card p-5">
              <div className="flex gap-3">
                <DoctorAvatar name={d.name} photoUrl={profile?.photoUrl || d.profileImageUrl} size={72} />
                <div>
                  <p className="chip">{profile?.clinicId ?? d.id}</p>
                  <h2 className="mt-2 flex flex-wrap items-center gap-2 text-xl font-semibold">
                    {d.name} <VerifiedBadge verified={profile?.isVerified} />
                  </h2>
                  <p className="text-muted">{profile?.specialty ?? "General physiotherapy"}</p>
                  {km != null && <p className="chip mt-2">{formatDistanceKm(km)}</p>}
                  <p className="mt-2 text-sm font-medium">
                    Online {formatInr(pricing.onlineFee)} · Clinic {formatInr(pricing.offlineFee)}
                  </p>
                  {stars.count > 0 && (
                    <p className="text-sm text-muted">
                      {stars.avg} / 5 · {stars.count} review{stars.count === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              </div>
              <p className="mt-2">{profile?.bio}</p>
              {pin && <ClinicMapThumb location={pin} name={d.name} />}
              <p className="mt-3 text-sm font-medium">Next availability</p>
              {next.length === 0 ? (
                <p className="text-muted">No open slots in the next few days.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-muted">
                  {next.map((iso) => (
                    <li key={iso}>{formatSlot(iso)}</li>
                  ))}
                </ul>
              )}
              <Link href={`/patient/doctors/${d.id}`} className="btn btn-primary mt-4">
                View and book
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
