import { redirect } from 'next/navigation';

// Escalating is a dialog on the case; old links open the case with that dialog.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/officer/cases/${id}?action=escalate`);
}
