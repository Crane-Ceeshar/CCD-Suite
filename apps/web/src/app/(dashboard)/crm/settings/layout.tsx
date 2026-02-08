import { redirect } from 'next/navigation';

export default function CRMSettingsLayout({ children }: { children: React.ReactNode }) {
  redirect('/crm');
}
