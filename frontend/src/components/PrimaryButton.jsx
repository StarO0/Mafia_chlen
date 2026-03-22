export default function PrimaryButton({ children, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`ios-press w-full rounded-2xl bg-gradient-to-b from-red-600 to-red-800 p-4 text-base font-semibold text-white shadow-lg shadow-red-950/40 ring-1 ring-red-500/30 transition duration-200 hover:from-red-500 hover:to-red-700 hover:shadow-red-900/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
