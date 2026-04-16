import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useUser } from '@/hooks/useUser';
import { usePendingChallenges } from '@/hooks/usePendingChallenges';

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };

const TABS: { name: string; icon: IconName; label: string; color: string }[] = [
  { name: 'index', icon: 'home', label: 'Accueil', color: '#39FF14' },
  { name: 'learn', icon: 'book', label: 'Apprendre', color: '#39FF14' },
  { name: 'leaderboard', icon: 'trophy', label: 'Classement', color: '#FFD700' },
  { name: 'profile', icon: 'user', label: 'Profil', color: '#39FF14' },
];

/** Small red badge showing a number (e.g. pending challenges count) */
function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={badgeStyles.container}>
      <Text style={badgeStyles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F85149',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#0D1117',
  },
  text: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 12,
  },
});

function AnimatedTabIcon({
  icon,
  label,
  focused,
  color,
  badgeCount,
}: {
  icon: IconName;
  label: string;
  focused: boolean;
  color: string;
  badgeCount?: number;
}) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(focused ? 1 : 0);
  const iconTranslateY = useSharedValue(focused ? -2 : 0);

  if (focused) {
    scale.value = withSpring(1.1, SPRING);
    dotOpacity.value = withTiming(1, { duration: 200 });
    iconTranslateY.value = withSpring(-2, SPRING);
  } else {
    scale.value = withSpring(1, SPRING);
    dotOpacity.value = withTiming(0, { duration: 150 });
    iconTranslateY.value = withSpring(0, SPRING);
  }

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: iconTranslateY.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scaleX: dotOpacity.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(focused ? 0.15 : 0, { duration: 250 }),
  }));

  return (
    <View style={styles.tabItem}>
      {/* Glow background */}
      <Animated.View
        style={[
          styles.tabGlow,
          { backgroundColor: color },
          glowStyle,
        ]}
      />

      <Animated.View style={[containerStyle, { position: 'relative' }]}>
        <Icon
          name={icon}
          size={22}
          color={focused ? color : '#6E7681'}
        />
        {/* Notification badge (e.g. pending challenges) */}
        {badgeCount !== undefined && <NotificationBadge count={badgeCount} />}
      </Animated.View>

      <Text
        style={[
          styles.tabLabel,
          { color: focused ? color : '#6E7681' },
          focused && styles.tabLabelFocused,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Active dot */}
      <Animated.View style={[styles.activeDot, { backgroundColor: color }, dotStyle]} />
    </View>
  );
}

export default function TabLayout() {
  const { userId } = useUser();
  const { pendingCount } = usePendingChallenges(userId);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              icon="home"
              label="Accueil"
              focused={focused}
              color="#39FF14"
              badgeCount={pendingCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Apprendre',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon="book" label="Apprendre" focused={focused} color="#39FF14" />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Classement',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon="trophy" label="Classement" focused={focused} color="#FFD700" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon icon="user" label="Profil" focused={focused} color="#39FF14" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D1117',
    borderTopColor: '#21262D',
    borderTopWidth: 1,
    height: 82,
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    height: 54,
    gap: 3,
    position: 'relative',
  },
  tabGlow: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    bottom: 0,
    borderRadius: 16,
  },
  tabLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
