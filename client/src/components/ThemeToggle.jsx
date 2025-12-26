// ============================================================================
// THEMETOGGLE.JSX - Dark/Light Mode Toggle Button Component
// ============================================================================
// This is a simple button component that allows users to switch between
// light mode and dark mode. It displays a moon icon in light mode and a
// sun icon in dark mode.

// ----------------------------------------------------------------------------
// STEP 1: Import Icons
// ----------------------------------------------------------------------------
// Lucide React: Icon library
// Moon: Icon shown in light mode (click to switch to dark)
// Sun: Icon shown in dark mode (click to switch to light)
import { Moon, Sun } from 'lucide-react';

// ----------------------------------------------------------------------------
// STEP 2: Import Theme Context
// ----------------------------------------------------------------------------
// useTheme: Custom hook that gives us access to the current theme and
// a function to toggle it. This comes from our ThemeContext provider.
import { useTheme } from '../context/ThemeContext';

// ============================================================================
// MAIN COMPONENT: ThemeToggle
// ============================================================================
export default function ThemeToggle() {
    // ------------------------------------------------------------------------
    // STEP 3: Get Theme State and Toggle Function
    // ------------------------------------------------------------------------
    // useTheme() returns an object with:
    // - theme: The current theme ('light' or 'dark')
    // - toggleTheme: A function to switch between themes
    const { theme, toggleTheme } = useTheme();

    // ========================================================================
    // RENDER: The JSX that defines what the component looks like
    // ========================================================================
    return (
        // Button element
        <button
            // When clicked, toggle between light and dark mode
            onClick={toggleTheme}

            // Styling:
            // - p-2: Padding on all sides
            // - rounded-full: Makes it circular
            // - hover:bg-gray-200: Light gray background on hover (light mode)
            // - dark:hover:bg-gray-700: Dark gray background on hover (dark mode)
            // - transition-colors: Smooth color transitions
            // - text-gray-800: Dark text (light mode)
            // - dark:text-gray-200: Light text (dark mode)
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"

            // Accessibility: Screen readers will announce this as "Toggle Theme"
            aria-label="Toggle Theme"
        >
            {/* 
                Conditional Icon Rendering:
                - If theme is 'light', show Moon icon (click to go dark)
                - If theme is 'dark', show Sun icon (click to go light)
                
                This is intuitive because:
                - Moon = nighttime = dark mode
                - Sun = daytime = light mode
            */}
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
}
