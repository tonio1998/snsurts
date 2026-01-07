export const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 13) return "Happy Lunch";
    if (hour >= 13 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 19) return "Good Evening";
    if (hour >= 19 && hour < 22) return "Good Night";
    return "Mabuhay";
};