export default function PageLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-[#d4a843]/30 border-t-[#d4a843] rounded-full animate-spin" />
    </div>
  );
}
