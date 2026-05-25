import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ProfileForm from './ProfileForm';

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
         <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-sm sm:text-base font-semibold border border-red-500 text-red-500 hover:bg-red-50 transition-all duration-200" onClick={() => alert('Please contact support to delete your account.')}>
           Delete My Account
         </button>
      </div>
    </>
  );
}
