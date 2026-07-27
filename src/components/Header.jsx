export default function Header({ user, onLogout, onOpenSettings, onOpenMembers, memberCount }) {
  return (
    <header className="px-4 py-4 flex items-center justify-between border-b border-surface-800/50 bg-surface-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          className="relative group focus:outline-none"
          title="Settings"
          id="settings-avatar-btn"
        >
          <img
            src={user.avatar}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border border-surface-700/50 shadow-sm group-hover:border-primary-500/60 transition-all"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-surface-900 rounded-full flex items-center justify-center border border-surface-700 group-hover:border-primary-500/60 transition-all">
            <svg className="w-2 h-2 text-surface-400 group-hover:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white leading-tight">Zookiepookie</h1>
            <button
              onClick={onOpenMembers}
              className="text-xs font-semibold uppercase tracking-wide text-surface-100 bg-surface-800 border border-surface-600 rounded-full px-3 py-1 hover:border-primary-500/60 hover:text-white transition-all"
              id="members-btn"
            >
              Members ({memberCount})
            </button>
          </div>
          <p className="text-xs font-semibold text-emerald-400 tracking-wide uppercase mt-0.5">Dashboard</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="text-sm text-surface-400 hover:text-danger-400 transition-colors flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-surface-800/50"
        id="logout-btn"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        Sign out
      </button>
    </header>
  );
}
