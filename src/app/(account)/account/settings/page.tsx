import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ProfileForm from './ProfileForm';
import DeleteAccountButton from './DeleteAccountButton';

export const metadata = {
  title: 'Account Settings - My Dashboard',
};

export default async function AccountSettingsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-[#1A1A1A]">Account Settings</h2>
      
      <div className="bg-white rounded-[12px] p-5 sm:p-8 border border-gray-200 shadow-sm">
        <h3 className="text-base sm:text-lg font-bold mb-5 sm:mb-6 text-[#1A1A1A]">Personal Profile</h3>
        
        <ProfileForm 
          initialName={session.user.name || ''} 
          initialEmail={session.user.email || ''} 
        />
      </div>

      <div className="bg-white rounded-[12px] p-5 sm:p-8 border border-gray-200 mt-5 sm:mt-8 shadow-sm">
         <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-red-500">Danger Zone</h3>
         <p className="text-gray-500 text-xs sm:text-sm mb-5 sm:mb-6">Once you delete your account, there is no going back. Please be certain.</p>
         <DeleteAccountButton />
      </div>
    </>
  );
}
