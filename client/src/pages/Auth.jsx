import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Auth() {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);

    const [email, setEmail] = useState('');

    const [password, setPassword] = useState('');

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await axios.post(`${API_URL}${endpoint}`, {
                email,
                password
            });

            if (res.data.token || (!isLogin && res.data.id)) {
                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }
            
                if (isLogin) {
                    navigate('/');
                    toast.success('Signed in successfully!');
                }
                
                else {
                    setIsLogin(true);
                    setEmail('');
                    setPassword('');
                    toast.success('Registration successful! Please login.');
                }
            }

        } catch (err) {
            setError(err.response?.data || 'An error occurred');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
            <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700 transition-colors">
                <div className="flex justify-center mb-6">
                    <img
                        src="/icon.png"
                        alt="Sketcha Logo"
                        className="w-16 h-16 rounded-xl shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/30"
                    />
                </div>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white transition-colors">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                {error && (
                    <div className="mb-4 text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="block w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            className="block w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required  
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsLogin(!isLogin)} 
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
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
