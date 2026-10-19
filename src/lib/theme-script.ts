// Runs in <head> before first paint so the page never flashes the wrong theme.
// Preference lives in localStorage per device: "dark" (default), "light", or "auto" (match the phone).
export const THEME_KEY = "north-theme";
export const THEME_COLORS = { dark: "#0a1230", light: "#fdf3d4" } as const;

export const themeInitScript = `(function(){try{
var p=localStorage.getItem('${THEME_KEY}');
var t=p==='light'?'light':(p==='auto'&&matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';
document.documentElement.dataset.theme=t;
}catch(e){}})();`;
