// ============================================================================
// DASHBOARD.JSX - Main Dashboard Page Component
// ============================================================================
// This is the main page users see after logging in. It displays all their
// storyboard projects and allows them to create new ones.

// ----------------------------------------------------------------------------
// STEP 1: Import React Hooks
// ----------------------------------------------------------------------------
// useEffect: Runs code when the component first loads (like fetching data)
// useState: Manages component state (data that can change)
import { useEffect, useState } from 'react';

// ----------------------------------------------------------------------------
// STEP 2: Import External Libraries
// ----------------------------------------------------------------------------
// axios: Makes HTTP requests to our backend API
import axios from 'axios';

// React Router hooks for navigation
import { Link, useNavigate } from 'react-router-dom';

// Lucide React: Icon library (PlusCircle, Film, Trash2 icons)
import { PlusCircle, Film, Trash2 } from 'lucide-react';

// Toast notifications: Shows success/error messages to the user
import toast from 'react-hot-toast';

// ----------------------------------------------------------------------------
// STEP 3: Import Our Custom Components
// ----------------------------------------------------------------------------
// ThemeToggle: The dark/light mode toggle button
import ThemeToggle from '../components/ThemeToggle';

// ============================================================================
// MAIN COMPONENT: Dashboard
// ============================================================================
export default function Dashboard() {
    // ------------------------------------------------------------------------
    // STEP 4: Set Up API URL
    // ------------------------------------------------------------------------
    // Get the backend API URL from environment variables
    // If not set, default to localhost:5000 for local development
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // ------------------------------------------------------------------------
    // STEP 5: Set Up Navigation
    // ------------------------------------------------------------------------
    // useNavigate gives us a function to programmatically navigate to other pages
    const navigate = useNavigate();

    // ------------------------------------------------------------------------
    // STEP 6: Define Component State
    // ------------------------------------------------------------------------
    // State is data that can change and will cause the component to re-render

    // projects: Array of all user's projects (starts empty)
    const [projects, setProjects] = useState([]);

    // newProjectInput: The text the user types when creating a new project
    const [newProjectInput, setNewProjectInput] = useState('');

    // isCreating: Whether we're currently creating a project (shows loading state)
    const [isCreating, setIsCreating] = useState(false);

    // ------------------------------------------------------------------------
    // STEP 7: Fetch Projects When Component Loads
    // ------------------------------------------------------------------------
    // useEffect runs code when the component first mounts
    // The empty array [] means "only run once when component loads"
    useEffect(() => {
        fetchProjects();
    }, []);

    // ========================================================================
    // FUNCTION 1: Fetch All Projects
    // ========================================================================
    // This function gets all projects for the logged-in user from the backend
    const fetchProjects = async () => {
        try {
            // ----------------------------------------------------------------
            // Step 1.1: Get the authentication token
            // ----------------------------------------------------------------
            // The token proves we're logged in and identifies who we are
            const token = localStorage.getItem('token');

            // ----------------------------------------------------------------
            // Step 1.2: Make GET request to backend
            // ----------------------------------------------------------------
            // Send a GET request to /api/projects with our auth token
            const res = await axios.get(`${API_URL}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // ----------------------------------------------------------------
            // Step 1.3: Update state with the projects
            // ----------------------------------------------------------------
            // res.data contains the array of projects from the backend
            // setProjects updates our state and causes a re-render
            setProjects(res.data);

        } catch (err) {
            // ----------------------------------------------------------------
            // Step 1.4: Handle errors
            // ----------------------------------------------------------------
            console.error(err);

            // If we get a 401 Unauthorized error, the token is invalid
            // Redirect to the login page
            if (err.response?.status === 401) {
                navigate('/auth');
            }
        }
    };

    // ========================================================================
    // FUNCTION 2: Create New Project
    // ========================================================================
    // This function is called when the user submits the create project form
    const handleCreate = async (e) => {
        // ----------------------------------------------------------------
        // Step 2.1: Prevent default form submission
        // ----------------------------------------------------------------
        // By default, forms reload the page. We don't want that.
        e.preventDefault();

        // ----------------------------------------------------------------
        // Step 2.2: Validate input
        // ----------------------------------------------------------------
        // If the input is empty or only whitespace, do nothing
        if (!newProjectInput.trim()) return;

        // ----------------------------------------------------------------
        // Step 2.3: Set loading state
        // ----------------------------------------------------------------
        // This disables the button and shows "Generating..." text
        setIsCreating(true);

        try {
            // ------------------------------------------------------------
            // Step 2.4: Get authentication token
            // ------------------------------------------------------------
            const token = localStorage.getItem('token');

            // ------------------------------------------------------------
            // Step 2.5: Create the title
            // ------------------------------------------------------------
            // If the input is longer than 30 characters, truncate it and add "..."
            const title = newProjectInput.substring(0, 30) +
                (newProjectInput.length > 30 ? '...' : '');

            // ------------------------------------------------------------
            // Step 2.6: Send POST request to create project
            // ------------------------------------------------------------
            // This sends the user's idea to the backend
            // The backend will:
            // 1. Create the project in the database
            // 2. Use AI to generate a script
            // 3. Save the scenes
            // 4. Return the project and scenes
            const res = await axios.post(
                `${API_URL}/api/projects/`,
                {
                    title: title,           // Truncated title
                    input: newProjectInput  // Full user input
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // ------------------------------------------------------------
            // Step 2.7: Show success message
            // ------------------------------------------------------------
            toast.success('Project created!');

            // ------------------------------------------------------------
            // Step 2.8: Navigate to the new project page
            // ------------------------------------------------------------
            // res.data.project.id is the ID of the newly created project
            navigate(`/project/${res.data.project.id}`);

        } catch (err) {
            // ------------------------------------------------------------
            // Step 2.9: Handle errors
            // ------------------------------------------------------------
            console.error(err);
            toast.error('Failed to create project');

        } finally {
            // ------------------------------------------------------------
            // Step 2.10: Reset loading state
            // ------------------------------------------------------------
            // This runs whether the request succeeded or failed
            // It re-enables the button
            setIsCreating(false);
        }
    };

    // ========================================================================
    // FUNCTION 3: Delete Project
    // ========================================================================
    // This function is called when the user clicks the trash icon on a project
    const handleDelete = async (e, id) => {
        // ----------------------------------------------------------------
        // Step 3.1: Prevent event bubbling
        // ----------------------------------------------------------------
        // The delete button is inside a clickable card
        // We need to stop the click from also triggering the card's onClick
        e.preventDefault();
        e.stopPropagation();

        // ----------------------------------------------------------------
        // Step 3.2: Ask for confirmation
        // ----------------------------------------------------------------
        // Show a browser confirmation dialog
        // If the user clicks "Cancel", return early and do nothing
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            // ------------------------------------------------------------
            // Step 3.3: Get authentication token
            // ------------------------------------------------------------
            const token = localStorage.getItem('token');

            // ------------------------------------------------------------
            // Step 3.4: Send DELETE request to backend
            // ------------------------------------------------------------
            // This tells the backend to delete the project and all its scenes
            await axios.delete(`${API_URL}/api/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // ------------------------------------------------------------
            // Step 3.5: Update local state
            // ------------------------------------------------------------
            // Remove the deleted project from our projects array
            // filter() creates a new array without the deleted project
            setProjects(projects.filter(p => p.id !== id));

            // ------------------------------------------------------------
            // Step 3.6: Show success message
            // ------------------------------------------------------------
            toast.success('Project deleted');

        } catch (err) {
            // ------------------------------------------------------------
            // Step 3.7: Handle errors
            // ------------------------------------------------------------
            console.error(err);
            toast.error('Failed to delete project');
        }
    };

    // ========================================================================
    // RENDER: The JSX that defines what the component looks like
    // ========================================================================
    return (
        // Main container: centered, max width, padding
        <div className="container mx-auto p-6 max-w-5xl">

            {/* ============================================================
                HEADER SECTION
                Shows app name, logo, theme toggle, and logout button
            ============================================================ */}
            <div className="flex justify-between items-center mb-8">
                {/* Left side: Logo and app name */}
                <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white transition-colors"
                    style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <img src="/logo.png" alt="FrameAI Logo" className="w-10 h-10 rounded-lg shadow-sm" />
                    Sketcha
                </h1>

                {/* Right side: Theme toggle and logout */}
                <div className="flex items-center gap-4">
                    {/* Dark/Light mode toggle button */}
                    <ThemeToggle />

                    {/* Logout button */}
                    <button
                        onClick={() => {
                            // Remove the auth token from localStorage
                            localStorage.removeItem('token');
                            // Navigate to the login page
                            navigate('/auth');
                        }}
                        className="text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* ============================================================
                CREATE NEW PROJECT SECTION
                Form where users enter their movie idea
            ============================================================ */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-10 border border-blue-100 dark:border-gray-700 transition-colors">
                <h2 className="text-xl font-semibold mb-4 dark:text-white transition-colors">
                    Create New Storyboard
                </h2>

                {/* Form for creating a new project */}
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
                    {/* Text input for movie idea */}
                    <input
                        type="text"
                        className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Describe your movie idea... (e.g., 'A robot discovers a flower in a wasteland')"
                        value={newProjectInput}
                        onChange={(e) => setNewProjectInput(e.target.value)}
                        disabled={isCreating}  // Disable while creating
                    />

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={isCreating}  // Disable while creating
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                    >
                        {/* Show different text/icon based on loading state */}
                        {isCreating ? 'Generating...' : <><PlusCircle size={20} /> Create</>}
                    </button>
                </form>
            </div>

            {/* ============================================================
                PROJECTS GRID
                Displays all user's projects in a responsive grid
            ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Loop through each project and render a card */}
                {projects.map((project) => (
                    <div
                        key={project.id}  // Unique key for React's rendering
                        className="block group relative cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)}  // Click to view project
                    >
                        {/* Project card */}
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                            {/* Card header: title and delete button */}
                            <div className="flex justify-between items-start mb-2">
                                {/* Project title */}
                                <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 dark:text-gray-100 transition-colors line-clamp-1">
                                    {project.title || "Untitled Project"}
                                </h3>

                                {/* Delete button (trash icon) */}
                                <button
                                    onClick={(e) => handleDelete(e, project.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors z-10"
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Project description (original user input) */}
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 flex-1 transition-colors">
                                {project.original_input}
                            </p>

                            {/* Card footer: creation date */}
                            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 transition-colors border-t dark:border-gray-700 pt-3 flex justify-between">
                                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ============================================================
                EMPTY STATE
                Shows when user has no projects yet
            ============================================================ */}
            {projects.length === 0 && (
                <div className="text-center py-20">
                    {/* Icon */}
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Film className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    {/* Message */}
                    <p className="text-gray-500 dark:text-gray-400">
                        No projects yet. Create one above!
                    </p>
                </div>
            )}
        </div>
    );
}
