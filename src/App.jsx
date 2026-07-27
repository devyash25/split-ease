import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import PinModal from './components/PinModal';
import Dashboard from './components/Dashboard';
import { getUsers, seedUsers } from './db';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState([]);
  const [showPin, setShowPin] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const loadUsers = async () => {
    try {
      const dbUsers = await getUsers();
      if (dbUsers.length === 0) {
        // First run — seed the database with our group's data
        await seedUsers();
        const seeded = await getUsers();
        setUsers(seeded);
      } else {
        setUsers(dbUsers);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Keep currentUser in sync when users list updates (e.g., after avatar change)
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const fresh = users.find(u => u.id === currentUser.id);
      if (fresh) {
        const updated = { ...currentUser, ...fresh };
        setCurrentUser(updated);
        sessionStorage.setItem('currentUser', JSON.stringify(updated));
      }
    }
  }, [users]);

  const handleLogin = (user) => {
    // Merge with latest DB data
    const dbUser = users.find(u => u.id === user.id) || user;
    setCurrentUser(dbUser);
    sessionStorage.setItem('currentUser', JSON.stringify(dbUser));
    setShowPin(false);
    setSelectedUser(null);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowPin(true);
  };

  const handleUserUpdate = (updatedUser) => {
    // Update both the session and the users list
    setCurrentUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginScreen users={users} onSelect={handleUserSelect} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            currentUser ? (
              <Dashboard
                currentUser={currentUser}
                users={users}
                onLogout={handleLogout}
                onUserUpdate={handleUserUpdate}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      {showPin && selectedUser && (
        <PinModal
          user={selectedUser}
          onSuccess={handleLogin}
          onClose={() => {
            setShowPin(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}
