/**
 * Theme initialization script that runs before React hydrates
 * Prevents flash of unstyled content by applying theme immediately
 */
export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        const savedTheme = localStorage.getItem('theme') || 'system';
        const isDark = savedTheme === 'dark' || 
          (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        // Fallback to system preference if localStorage isn't available
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
