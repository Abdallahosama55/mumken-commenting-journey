import { AccessibilityInfo } from 'react-native';

// Announcements are asserted in tests; the native module is not available under Jest.
jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

// Icons are decorative (every control has a text label); skip loading the icon font under Jest.
jest.mock('@expo/vector-icons/Ionicons', () => () => null);
