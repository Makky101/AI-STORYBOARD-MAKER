import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Image as ImageIcon, BookOpen, LayoutGrid, Edit3, Check, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';

export default function ProjectView() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const { id } = useParams();

    const [project, setProject] = useState(null);

    const [scenes, setScenes] = useState([]);

    const [loading, setLoading] = useState(true);

    const [generatingImages, setGeneratingImages] = useState(false);

    const [showScript, setShowScript] = useState(false);

    const [editingSceneId, setEditingSceneId] = useState(null);

    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const token = localStorage.getItem('token');

            const res = await axios.get(`${API_URL}/api/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProject(res.data.project);
            setScenes(res.data.scenes);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateImages = async () => {
        setGeneratingImages(true);

        try {
            const token = localStorage.getItem('token');

            const res = await axios.post(
                `${API_URL}/api/projects/${id}/generate-images`,
                {}, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setScenes(res.data.scenes || res.data);

            toast.success('Images generated!');

        } catch (err) {
            console.error("Error generating images:", err);
            toast.error("Failed to generate images.");
        } finally {
            setGeneratingImages(false);
        }
    };

    const startEditing = (scene) => {
        setEditingSceneId(scene.id);

        setEditForm({ ...scene });
    };

    const cancelEditing = () => {
        setEditingSceneId(null);
        setEditForm({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const saveEdit = async () => {
        try {
            const token = localStorage.getItem('token');

            const res = await axios.put(
                `${API_URL}/api/projects/scenes/${editingSceneId}`,
                editForm, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setScenes(scenes.map(s => s.id === editingSceneId ? res.data : s));

            setEditingSceneId(null);
            toast.success('Scene updated');

        } catch (err) {
            console.error(err);
            toast.error("Failed to save changes");
        }
    };

  
    if (loading) {
        return <div className="text-center p-10 dark:text-gray-200">Loading Project...</div>;
    }

    if (!project) {
        return <div className="text-center p-10 dark:text-gray-200">Project not found</div>;
    }

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-100 dark:bg-gray-900 transition-colors">

            <header className="bg-white dark:bg-gray-800 shadow px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between z-10 transition-colors shrink-0 print:hidden">
                {/* Left side: Back button and title */}
                <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                    {/* Back to dashboard button */}
                    <Link to="/" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shrink-0 flex items-center gap-2">
                        <ArrowLeft size={24} />
                        <img src="/logo.png" alt="FrameAI Logo" className="w-8 h-8 rounded shadow-sm sm:block" />
                    </Link>

                    {/* Project title */}
                    <div className="min-w-0">
                        <h1 className="text-lg lg:text-xl font-bold truncate text-gray-900 dark:text-white transition-colors">
                            {project.title}
                        </h1>
                    </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex items-center gap-2 lg:gap-3 shrink-0 ml-2">
                    {/* Mobile: Toggle between script and storyboard view */}
                    <button
                        onClick={() => setShowScript(!showScript)}
                        className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={showScript ? "Show Storyboard" : "Show Script"}
                    >
                        {showScript ? <LayoutGrid size={20} /> : <BookOpen size={20} />}
                    </button>

                    <button
                        onClick={handleGenerateImages}
                        disabled={generatingImages}
                        className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm"
                    >
                        {/* Show spinning icon when generating */}
                        {generatingImages ? <RefreshCw className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                        <span className="hidden sm:inline">Generate Art</span>
                    </button>

                    {/* Theme toggle */}
                    <ThemeToggle />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative print:block print:overflow-visible">

                <div className={`
                    absolute inset-0 z-20 lg:relative lg:z-0 w-full lg:w-1/3 bg-white dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto p-6 transition-transform duration-300 ease-in-out print:hidden
                    ${showScript ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="flex justify-between items-center mb-4 lg:hidden">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Script</h2>
                        <button onClick={() => setShowScript(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
                    </div>
                    <div className="hidden lg:block text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>Script</div>

                    {/* List of scenes in screenplay format */}
                    <div className="space-y-8 pb-10">
                        {scenes.map((scene) => (
                            <div key={scene.id} className="group relative text-sm leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                {/* If this scene is being edited, show edit form */}
                                {editingSceneId === scene.id ? (
                                    <div className="space-y-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        {/* Location input */}
                                        <input
                                            name="location"
                                            value={editForm.location}
                                            onChange={handleEditChange}
                                            className="w-full bg-white dark:bg-gray-700 border dark:border-gray-600 p-1 rounded font-bold uppercase"
                                        />
                                        {/* Action textarea */}
                                        <textarea
                                            name="action"
                                            value={editForm.action}
                                            onChange={handleEditChange}
                                            className="w-full bg-white dark:bg-gray-700 border dark:border-gray-600 p-1 rounded min-h-[100px]"
                                        />
                                        {/* Save and Cancel buttons */}
                                        <div className="flex gap-2">
                                            <button onClick={saveEdit} className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded text-xs"><Check size={14} /> Save</button>
                                            <button onClick={cancelEditing} className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded text-xs"><X size={14} /> Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    // Otherwise, show the scene in screenplay format
                                    <>
                                        {/* Scene header (location and time) */}
                                        <div className="font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-widest text-xs border-b border-gray-200 dark:border-gray-700 pb-2 flex justify-between items-center">
                                            <span>{scene.scene_number}. {scene.location.toUpperCase()} - {scene.time ? scene.time.toUpperCase() : 'DAY'}</span>
                                            {/* Edit button (appears on hover) */}
                                            <button
                                                onClick={() => startEditing(scene)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        </div>
                                        {/* Mood */}
                                        <div className="text-gray-500 dark:text-gray-400 mb-4 text-xs italic tracking-wide">Mood: {scene.mood}</div>
                                        {/* Action description */}
                                        <div className="text-gray-800 dark:text-gray-300 mb-4 px-4 lg:px-0">
                                            {scene.action}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 transition-colors print:bg-white print:p-0 print:overflow-visible" id="storyboard-grid">
                    {/* Grid of scene cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-10 print:grid-cols-2 print:gap-8">
                        {scenes.map((scene) => (
                            <div key={scene.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700 print:shadow-none print:border-gray-200">
                                {/* Image area */}
                                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center group overflow-hidden">
                                    {/* If scene has an image, show it */}
                                    {scene.image_url ? (
                                        <img
                                            src={scene.image_url}
                                            alt={`Scene ${scene.scene_number}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        // Otherwise, show placeholder
                                        <div className="text-gray-300 dark:text-gray-600 flex flex-col items-center p-4 text-center">
                                            <ImageIcon size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs font-medium">No Image</span>
                                        </div>
                                    )}
                                    {/* Scene number badge */}
                                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Scene {scene.scene_number}
                                    </span>
                                </div>

                                {/* Content area */}
                                <div className="p-4 flex-1 flex flex-col">
                                    {/* Scene title */}
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 text-sm">{scene.title || `Scene ${scene.scene_number}`}</h3>
                                    {/* Location */}
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2 uppercase tracking-wide">{scene.location}</p>
                                    {/* Action description (truncated to 3 lines) */}
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed print:line-clamp-none">{scene.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
