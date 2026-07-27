export default function LoginScreen({ users, onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-4 py-8 fade-in">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary-600/[0.07] blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-500/[0.07] blur-[100px]" />
      </div>

      <div className="w-full max-w-sm fade-in flex flex-col items-center">
        {/* Zookiepookie Heading */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface-700/50 shadow-2xl mb-4 bg-surface-800 flex items-center justify-center">
            <img 
              src="/group.jpg" 
              alt="Zookiepookie" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-surface-400 tracking-tight">
            Zookiepookie
          </h1>
          <p className="text-surface-400 mt-2 font-medium">Select your profile to continue</p>
        </div>

        <div className="w-full bg-surface-800/40 p-4 rounded-3xl border border-surface-700/50 shadow-xl backdrop-blur-md space-y-3">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full bg-surface-800 hover:bg-surface-700/80 p-4 rounded-2xl transition-all duration-200 flex justify-between items-center group border border-surface-700/50"
            >
              <div className="flex items-center gap-4">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover bg-surface-700" />
                <span className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{user.name}</span>
              </div>
              <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-center text-surface-600 text-xs mt-8">
          Flat expense tracking made simple
        </p>
      </div>
    </div>
  );
}
