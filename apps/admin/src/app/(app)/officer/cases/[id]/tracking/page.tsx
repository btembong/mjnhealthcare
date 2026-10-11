import { redirect } from 'next/navigation';

// Submissions are recorded inside the case; old links land on its Submissions tab.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/officer/cases/${id}?tab=submissions`);
}
