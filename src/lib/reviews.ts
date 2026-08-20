export function averageRating(reviews: { doctorId: string; rating: number }[], doctorId: string) {
  const mine = reviews.filter((r) => r.doctorId === doctorId);
  if (!mine.length) return { avg: 0, count: 0 };
  const avg = mine.reduce((sum, r) => sum + r.rating, 0) / mine.length;
  return { avg: Math.round(avg * 10) / 10, count: mine.length };
}
