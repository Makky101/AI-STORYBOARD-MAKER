import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Film, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);

    const [newProjectInput, setNewProjectInput] = useState('');

    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/projects`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjects(res.data);

        } catch (err) {
            console.error(err);

            if (err.response?.status === 400) {
                navigate('/auth');
            }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newProjectInput.trim()) return;

        setIsCreating(true);

        try {
            const token = localStorage.getItem('token');

            const title = newProjectInput.substring(0, 30) +
                (newProjectInput.length > 30 ? '...' : '');

            const res = await axios.post(
                `${API_URL}/api/projects/`,
                {
                    title: title,           
                    input: newProjectInput  
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success('Project created!');

            navigate(`/project/${res.data.project.id}`);

        } catch (err) {
            console.error(err);
            toast.error('Failed to create project');

        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const token = localStorage.getItem('token');

            await axios.delete(`${API_URL}/api/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProjects(projects.filter(p => p.id !== id));

            toast.success('Project deleted');

        } catch (err) {
            console.error(err);
            toast.error('Failed to delete project');
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3 dark:text-white transition-colors"
                    style={{ fontFamily: "'Outfit', sans-serif" }}>
                    <img src="/logo.png" alt="Sketcha Logo" className="w-10 h-10 rounded-lg shadow-sm" />
                    Sketcha
                </h1>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/auth');
                        }}
                        className="text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-10 border border-blue-100 dark:border-gray-700 transition-colors">
                <h2 className="text-xl font-semibold mb-4 dark:text-white transition-colors">
                    Create New Storyboard
                </h2>
                <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                        placeholder="Describe your movie idea... (e.g., 'A robot discovers a flower in a wasteland')"
                        value={newProjectInput}
                        onChange={(e) => setNewProjectInput(e.target.value)}
                        disabled={isCreating}  
                    />

                    <button
                        type="submit"
                        disabled={isCreating}  
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
                    >
                        {isCreating ? 'Generating...' : <><PlusCircle size={20} /> Create</>}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div
                        key={project.id} 
                        className="block group relative cursor-pointer"
                        onClick={() => navigate(`/project/${project.id}`)} 
                    >
                        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 dark:text-gray-100 transition-colors line-clamp-1">
                                    {project.title || "Untitled Project"}
                                </h3>

                                <button
                                    onClick={(e) => handleDelete(e, project.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors z-10"
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-3 flex-1 transition-colors">
                                {project.original_input}
                            </p>
                            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500 transition-colors border-t dark:border-gray-700 pt-3 flex justify-between">
                                <span>{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {projects.length === 0 && (
                <div className="text-center py-20">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                        <Film className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                        No projects yet. Create one above!
                    </p>
                </div>
            )}
        </div>
    );
}
