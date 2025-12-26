// ============================================================================
// APP.JSX - Main Application Component
// ============================================================================
// This is the root component of the React application. It sets up:
// - Routing (which page to show based on the URL)
// - Theme management (dark/light mode)
// - Toast notifications (success/error messages)
// - Protected routes (pages that require login)

// ----------------------------------------------------------------------------
// STEP 1: Import React Router Components
// ----------------------------------------------------------------------------
// BrowserRouter (as Router): Enables client-side routing
// Routes: Container for all route definitions
// Route: Defines a single route (URL -> Component mapping)
// Navigate: Programmatically redirects to another page
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ----------------------------------------------------------------------------
// STEP 2: Import Toast Notification System
// ----------------------------------------------------------------------------
// Toaster: Component that displays toast notifications
import { Toaster } from 'react-hot-toast';

// ----------------------------------------------------------------------------
// STEP 3: Import Page Components
// ----------------------------------------------------------------------------
// Auth: Login/Register page
import Auth from './pages/Auth';

// Dashboard: Main page showing all projects
import Dashboard from './pages/Dashboard';

// ProjectView: Individual project/storyboard view
import ProjectView from './pages/ProjectView';

// ----------------------------------------------------------------------------
// STEP 4: Import Theme Context Provider
// ----------------------------------------------------------------------------
// ThemeProvider: Wraps the app to provide dark/light mode functionality
import { ThemeProvider } from './context/ThemeContext';

// ============================================================================
// COMPONENT: ProtectedRoute
// ============================================================================
// This component wraps pages that require authentication.
// If the user is not logged in (no token), it redirects them to /auth.
// If they are logged in, it renders the page (children).
//
// How it works:
// 1. Check if there's a token in localStorage
// 2. If no token -> redirect to login page
// 3. If token exists -> show the protected page

const ProtectedRoute = ({ children }) => {
    // Check if user has an authentication token
    const token = localStorage.getItem('token');

    // If no token, redirect to the auth page
    if (!token) {
        return <Navigate to="/auth" />;
    }

    // If token exists, render the protected page
    return children;
};

// ============================================================================
// COMPONENT: App
// ============================================================================
// This is the main application component that sets up the entire app structure.

function App() {
    return (
        // ====================================================================
        // LAYER 1: Theme Provider
        // ====================================================================
        // Wraps the entire app to provide dark/light mode functionality
        // Any component inside can use useTheme() to access the current theme
        <ThemeProvider>

            {/* ============================================================
                LAYER 2: Router
                Enables client-side routing (changing pages without reload)
            ============================================================ */}
            <Router>

                {/* ========================================================
                    Toast Notification Container
                    Displays success/error messages in the top-right corner
                ======================================================== */}
                <Toaster position="top-right" />

                {/* ========================================================
                    Main App Container
                    - min-h-screen: Full viewport height
                    - bg-gray-50: Light mode background
                    - dark:bg-gray-900: Dark mode background
                    - transition-colors: Smooth color transitions
                ======================================================== */}
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">

                    {/* ================================================
                        Routes Container
                        Defines all the pages in the app
                    ================================================ */}
                    <Routes>
                        {/* --------------------------------------------
                            PUBLIC ROUTE: Authentication Page
                            URL: /auth
                            Component: Auth (Login/Register)
                            No protection needed
                        -------------------------------------------- */}
                        <Route path="/auth" element={<Auth />} />

                        {/* --------------------------------------------
                            PROTECTED ROUTE: Dashboard (Home)
                            URL: /
                            Component: Dashboard
                            Requires login (wrapped in ProtectedRoute)
                        -------------------------------------------- */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* --------------------------------------------
                            PROTECTED ROUTE: Project View
                            URL: /project/:id (e.g., /project/123)
                            Component: ProjectView
                            Requires login (wrapped in ProtectedRoute)
                            :id is a URL parameter (the project ID)
                        -------------------------------------------- */}
                        <Route
                            path="/project/:id"
                            element={
                                <ProtectedRoute>
                                    <ProjectView />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </ThemeProvider>
    );
}

// ============================================================================
// EXPORT
// ============================================================================
// Make this component available to other files
// main.jsx imports this and renders it to the DOM
export default App;
