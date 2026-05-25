'use client';

export default function DeleteAccountButton() {
  const handleDelete = () => {
    alert('Please contact support to delete your account.');
  };

  return (
    <button 
      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 rounded-md text-sm sm:text-base font-semibold border border-red-500 text-red-500 hover:bg-red-50 transition-all duration-200" 
      onClick={handleDelete}
    >
      Delete My Account
    </button>
  );
}
