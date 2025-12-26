// ============================================================================
// AUTH.JSX - Authentication Page Component
// ============================================================================
// This page handles both user login and registration.
// It's a single component that toggles between login and register modes.

// ----------------------------------------------------------------------------
// STEP 1: Import React Hooks
// ----------------------------------------------------------------------------
// useState: Manages component state (form data, mode, errors)
import { useState } from 'react';

// ----------------------------------------------------------------------------
// STEP 2: Import External Libraries
// ----------------------------------------------------------------------------
// axios: Makes HTTP requests to our backend API
import axios from 'axios';

// useNavigate: Allows us to programmatically navigate to other pages
import { useNavigate } from 'react-router-dom';

// toast: Shows success/error notifications to the user
import toast from 'react-hot-toast';

// ============================================================================
// MAIN COMPONENT: Auth
// ============================================================================
export default function Auth() {
    // ------------------------------------------------------------------------
    // STEP 3: Set Up API URL and Navigation
    // ------------------------------------------------------------------------
    // Get the backend API URL from environment variables
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // Get the navigate function for redirecting users
    const navigate = useNavigate();

    // ------------------------------------------------------------------------
    // STEP 4: Define Component State
    // ------------------------------------------------------------------------
    // isLogin: true = login mode, false = register mode
    const [isLogin, setIsLogin] = useState(true);

    // email: The user's email address
    const [email, setEmail] = useState('');

    // password: The user's password
    const [password, setPassword] = useState('');

    // error: Any error message to display to the user
    const [error, setError] = useState('');

    // ========================================================================
    // FUNCTION: Handle Form Submission
    // ========================================================================
    // This function is called when the user submits the login/register form
    const handleSubmit = async (e) => {
        // ----------------------------------------------------------------
        // Step 1: Prevent default form submission
        // ----------------------------------------------------------------
        // By default, forms reload the page. We don't want that.
        e.preventDefault();

        // ----------------------------------------------------------------
        // Step 2: Clear any previous errors
        // ----------------------------------------------------------------
        setError('');

        // ----------------------------------------------------------------
        // Step 3: Determine which endpoint to use
        // ----------------------------------------------------------------
        // If we're in login mode, use /api/auth/login
        // If we're in register mode, use /api/auth/register
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            // ------------------------------------------------------------
            // Step 4: Send POST request to backend
            // ------------------------------------------------------------
            // Send the email and password to the appropriate endpoint
            const res = await axios.post(`${API_URL}${endpoint}`, {
                email,
                password
            });

            // ------------------------------------------------------------
            // Step 5: Handle successful response
            // ------------------------------------------------------------
            // The response should contain either:
            // - A token (for login)
            // - An id (for registration)

            if (res.data.token || (!isLogin && res.data.id)) {
                // --------------------------------------------------------
                // Step 5a: Save token to localStorage (if provided)
                // --------------------------------------------------------
                // The token is used for authentication in future requests
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }

                // --------------------------------------------------------
                // Step 5b: Handle login success
                // --------------------------------------------------------
                if (isLogin) {
                    // Navigate to the dashboard
                    navigate('/');
                    // Show success message
                    toast.success('Signed in successfully!');
                }
                // --------------------------------------------------------
                // Step 5c: Handle registration success
                // --------------------------------------------------------
                else {
                    // Switch to login mode
                    setIsLogin(true);
                    // Clear the form
                    setEmail('');
                    setPassword('');
                    // Show success message
                    toast.success('Registration successful! Please login.');
                }
            }

        } catch (err) {
            // ------------------------------------------------------------
            // Step 6: Handle errors
            // ------------------------------------------------------------
            // If the request fails, show the error message from the backend
            // If no specific message, show a generic error
            setError(err.response?.data || 'An error occurred');
        }
    };

    // ========================================================================
    // RENDER: The JSX that defines what the component looks like
    // ========================================================================
    return (
        // Full-screen container: centered, with background color
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">

            {/* ============================================================
                AUTH CARD
                The white/dark card containing the form
            ============================================================ */}
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 transition-colors">

                {/* --------------------------------------------------------
                    LOGO
                    App logo displayed at the top
                -------------------------------------------------------- */}
                <div className="flex justify-center mb-6">
                    <img
                        src="/icon.png"
                        alt="FrameAI Logo"
                        className="w-16 h-16 rounded-xl shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/30"
                    />
                </div>

                {/* --------------------------------------------------------
                    TITLE
                    Changes based on login/register mode
                -------------------------------------------------------- */}
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white transition-colors">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {/* --------------------------------------------------------
                    ERROR MESSAGE
                    Only shown if there's an error
                -------------------------------------------------------- */}
                {error && (
                    <div className="mb-4 text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {error}
                    </div>
                )}

                {/* --------------------------------------------------------
                    FORM
                    Email and password inputs + submit button
                -------------------------------------------------------- */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="block w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required  // HTML5 validation: field must be filled
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            className="block w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required  // HTML5 validation: field must be filled
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                        {/* Button text changes based on mode */}
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                {/* --------------------------------------------------------
                    MODE TOGGLE
                    Button to switch between login and register
                -------------------------------------------------------- */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)}  // Toggle the mode
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                        {/* Text changes based on current mode */}
                        {isLogin
                            ? 'Need an account? Register'
                            : 'Already have an account? Login'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
