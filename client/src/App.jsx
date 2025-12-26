import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ProjectView from './pages/ProjectView';
import { ThemeProvider } from './context/ThemeContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/auth" />;
    return children;
};

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Toaster position="top-right" />
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
                    <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/" element={<ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>} />
                        <Route path="/project/:id" element={<ProtectedRoute>
                            <ProjectView />
                        </ProtectedRoute>} />
                    </Routes>
                </div>
            </Router>
        </ThemeProvider>
    );
}

export default App;
