import { redirect } from 'next/navigation';

// This screen now lives inside each case; old links and bookmarks land on the caseload.
export default function Page() {
  redirect('/officer/caseload');
}
