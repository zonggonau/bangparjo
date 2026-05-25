export default function LoadingStore() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <i className="fas fa-circle-notch fa-spin text-4xl text-[#FF6B00]"></i>
        <p className="text-gray-500 font-medium">Loading store...</p>
      </div>
    </div>
  );
}
