// ============================================================================
// THEMECONTEXT.JSX - Dark/Light Mode Theme Management
// ============================================================================
// This file creates a React Context that manages the app's theme (dark/light mode).
// It provides the current theme and a function to toggle it to any component
// that needs it, without having to pass props through multiple levels.

// ----------------------------------------------------------------------------
// STEP 1: Import React Hooks and Functions
// ----------------------------------------------------------------------------
// createContext: Creates a new Context object for sharing data
// useContext: Hook to access the Context value in components
// useEffect: Hook to run side effects (like updating the DOM)
// useState: Hook to manage component state
import { createContext, useContext, useEffect, useState } from 'react';

// ----------------------------------------------------------------------------
// STEP 2: Create the Theme Context
// ----------------------------------------------------------------------------
// This creates a Context object that will hold our theme data.
// Components can subscribe to this Context to get the current theme.
const ThemeContext = createContext();

// ============================================================================
// COMPONENT: ThemeProvider
// ============================================================================
// This component wraps your entire app and provides theme data to all children.
// Any component inside this provider can access the theme using useTheme().
//
// Usage in main.jsx or App.jsx:
//   <ThemeProvider>
//     <App />
//   </ThemeProvider>

export function ThemeProvider({ children }) {
    // ------------------------------------------------------------------------
    // STEP 3: Initialize Theme State
    // ------------------------------------------------------------------------
    // Get the theme from localStorage if it exists, otherwise default to 'light'
    // This way, the user's theme preference persists across page reloads
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'light'
    );

    // ------------------------------------------------------------------------
    // STEP 4: Apply Theme to DOM When It Changes
    // ------------------------------------------------------------------------
    // useEffect runs whenever 'theme' changes
    // This effect:
    // 1. Adds/removes the 'dark' class on the <html> element
    // 2. Saves the theme to localStorage for persistence
    useEffect(() => {
        // Get the root HTML element
        const root = window.document.documentElement;

        // If theme is 'dark', add the 'dark' class to <html>
        // Tailwind CSS uses this class to apply dark mode styles
        if (theme === 'dark') {
            root.classList.add('dark');
        }
        // If theme is 'light', remove the 'dark' class
        else {
            root.classList.remove('dark');
        }

        // Save the current theme to localStorage
        // This persists the user's preference across page reloads
        localStorage.setItem('theme', theme);

    }, [theme]); // This effect runs whenever 'theme' changes

    // ------------------------------------------------------------------------
    // STEP 5: Create Toggle Function
    // ------------------------------------------------------------------------
    // This function switches between 'light' and 'dark' themes
    const toggleTheme = () => {
        // setTheme with a function argument gets the previous value
        // If previous is 'light', switch to 'dark'
        // If previous is 'dark', switch to 'light'
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    // ------------------------------------------------------------------------
    // STEP 6: Provide Theme Data to Children
    // ------------------------------------------------------------------------
    // The Provider component makes the theme data available to all children
    // Any component inside this provider can use useTheme() to access:
    // - theme: The current theme ('light' or 'dark')
    // - toggleTheme: Function to switch themes
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// ============================================================================
// HOOK: useTheme
// ============================================================================
// This is a custom hook that makes it easy to access the theme in any component.
//
// Usage in any component:
//   const { theme, toggleTheme } = useTheme();
//
// Returns:
//   - theme: The current theme ('light' or 'dark')
//   - toggleTheme: Function to switch between themes

export function useTheme() {
    // useContext accesses the value from ThemeContext
    // This returns the { theme, toggleTheme } object we provided above
    return useContext(ThemeContext);
}
