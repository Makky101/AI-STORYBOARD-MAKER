import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, Image as ImageIcon, BookOpen, LayoutGrid } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ProjectView() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [scenes, setScenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generatingImages, setGeneratingImages] = useState(false);
    const [showScript, setShowScript] = useState(false); // Mobile toggle

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const fetchProjectData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/projects/${id}`, {
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
            const res = await axios.post(`http://localhost:5000/api/projects/${id}/generate-images`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScenes(res.data.scenes || res.data);
        } catch (err) {
            console.error("Error generating images:", err);
            alert("Failed to generate images.");
        } finally {
            setGeneratingImages(false);
        }
    };

    if (loading) return <div className="text-center p-10 dark:text-gray-200">Loading Project...</div>;
    if (!project) return <div className="text-center p-10 dark:text-gray-200">Project not found</div>;

    return (
        <div className="flex flex-col h-[100dvh] bg-gray-100 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between z-10 transition-colors shrink-0">
                <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
                    <Link to="/" className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shrink-0">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-lg lg:text-xl font-bold truncate text-gray-900 dark:text-white transition-colors">
                            {project.title}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 lg:gap-3 shrink-0 ml-2">
                    {/* Mobile/Tablet Script Toggle */}
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
                        {generatingImages ? <RefreshCw className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                        <span className="hidden sm:inline">{generatingImages ? 'Generating...' : 'Generate Art'}</span>
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content - Split View */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Left: Script View (Responsive Toggle) */}
                <div className={`
                    absolute inset-0 z-20 lg:relative lg:z-0 w-full lg:w-1/3 bg-white dark:bg-gray-800 border-r dark:border-gray-700 overflow-y-auto p-6 transition-transform duration-300 ease-in-out
                    ${showScript ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="flex justify-between items-center mb-4 lg:hidden">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Script</h2>
                        <button onClick={() => setShowScript(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Close</button>
                    </div>

                    <div className="hidden lg:block text-lg font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide mb-6">Script</div>

                    <div className="space-y-8 pb-10">
                        {scenes.map((scene) => (
                            <div key={scene.id} className="text-sm leading-relaxed" style={{ fontFamily: '"Courier Prime", "Courier New", Courier, monospace' }}>
                                <div className="font-bold text-gray-900 dark:text-gray-100 mb-2 uppercase tracking-widest text-xs border-b border-gray-200 dark:border-gray-700 pb-2">
                                    {scene.scene_number}. {scene.location.toUpperCase()} - {scene.time ? scene.time.toUpperCase() : 'DAY'}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 mb-4 text-xs italic tracking-wide">Mood: {scene.mood}</div>

                                <div className="text-gray-800 dark:text-gray-300 mb-4 px-4 lg:px-0">
                                    {scene.action}
                                </div>

                                {scene.description && (
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border-l-4 border-purple-400 dark:border-purple-600 text-gray-700 dark:text-gray-300 shadow-sm mx-2 lg:mx-0">
                                        <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-1 uppercase tracking-wider">Note</span>
                                        {scene.description}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Storyboard Grid */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 pb-10">
                        {scenes.map((scene) => (
                            <div key={scene.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full border border-gray-100 dark:border-gray-700">
                                {/* Image Area */}
                                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center group overflow-hidden">
                                    {scene.image_url ? (
                                        <img
                                            src={scene.image_url}
                                            alt={`Scene ${scene.scene_number}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="text-gray-300 dark:text-gray-600 flex flex-col items-center p-4 text-center">
                                            <ImageIcon size={32} className="mb-2 opacity-50" />
                                            <span className="text-xs font-medium">No Image</span>
                                        </div>
                                    )}
                                    <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Scene {scene.scene_number}
                                    </span>
                                </div>

                                {/* Content Area */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 text-sm">{scene.title || `Scene ${scene.scene_number}`}</h3>
                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2 uppercase tracking-wide">{scene.location}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{scene.action}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
