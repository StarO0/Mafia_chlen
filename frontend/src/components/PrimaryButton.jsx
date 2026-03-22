export default function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full rounded-xl bg-red-700 p-4 text-base font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-900/70 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
