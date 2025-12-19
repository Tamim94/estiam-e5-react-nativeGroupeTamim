import { useTheme as useNavTheme } from '@react-navigation/native';
import { useTheme } from '@/contexts/theme-context';

export function useAppTheme() {
    const navTheme = useNavTheme();
    const { isDarkMode } = useTheme();

    return {
        isDarkMode,
        colors: navTheme.colors
    };
}
