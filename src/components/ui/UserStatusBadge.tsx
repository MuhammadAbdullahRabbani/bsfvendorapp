import { useAuthStore } from "@/stores/authStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function UserStatusBadge() {
  const user = useAuthStore((s) => s.user);
  const online = useOnlineStatus();

  const name = user?.displayName || user?.email || "Guest";
  const status = user ? (online ? "Active" : "Offline") : "Offline";

  const dotClass =
    status === "Active"
      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
      : "bg-zinc-500";

  return (
    <div
      className={`
        flex items-center gap-2 rounded-full border px-3 py-1 text-sm
        transition-colors
        bg-white/60 border-zinc-300 text-zinc-800
        dark:bg-zinc-900/70 dark:border-zinc-700 dark:text-zinc-200
      `}
      title={`${name} · ${status}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <span>{name}</span>
      <span className="opacity-70">· {status}</span>
    </div>
  );
}
