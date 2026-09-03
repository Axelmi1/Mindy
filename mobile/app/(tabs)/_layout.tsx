import { useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent, Keyboard, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
  ZoomIn,
} from 'react-native-reanimated';
import { Icon, IconName } from '@/components/ui/Icon';
import { useUser } from '@/hooks/useUser';
import { usePendingChallenges } from '@/hooks/usePendingChallenges';

const SPRING = { damping: 18, stiffness: 200, mass: 0.8 };
const DOT_SPRING = { damping: 20, stiffness: 220, mass: 0.9 };
const DOT_SIZE = 5;

const TABS: { name: string; icon: IconName; label: string; color: string }[] = [
  { name: 'index', icon: 'home', label: 'Accueil', color: '#39FF14' },
  { name: 'learn', icon: 'book', label: 'Apprendre', color: '#39FF14' },
  { name: 'leaderboard', icon: 'trophy', label: 'Classement', color: '#FFD700' },
  { name: 'profile', icon: 'user', label: 'Profil', color: '#39FF14' },
];

/** Small red badge showing a number (e.g. pending challenges count). Pop-animates on count changes. */
function NotificationBadge({ count }: { count: number }) {
  const scale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > 0 && count !== prevCount.current) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 8, stiffness: 260 }),
        withSpring(1, SPRING),
      );
    }
    prevCount.current = count;
  }, [count]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (count <= 0) return null;

  return (
    <Animated.View
      entering={ZoomIn.springify().damping(12)}
      style={[badgeStyles.container, popStyle]}
    >
      <Text style={badgeStyles.text}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
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
  const iconTranslateY = useSharedValue(0);
  const colorProgress = useSharedValue(focused ? 1 : 0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.1, SPRING);
      iconTranslateY.value = withSpring(-2, SPRING);
      colorProgress.value = withTiming(1, { duration: 220 });
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.32, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.14, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    } else {
      scale.value = withSpring(1, SPRING);
      iconTranslateY.value = withSpring(0, SPRING);
      colorProgress.value = withTiming(0, { duration: 180 });
      cancelAnimation(glowOpacity);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [focused]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: iconTranslateY.value }],
  }));

  const colorIconStyle = useAnimatedStyle(() => ({ opacity: colorProgress.value }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={styles.tabItem}>
      {/* Halo néon pulsé */}
      <Animated.View style={[styles.tabGlow, { backgroundColor: color }, glowStyle]} />

      <Animated.View style={[containerStyle, styles.iconStack]}>
        <Icon name={icon} size={22} color="#6E7681" />
        <Animated.View style={[StyleSheet.absoluteFill, colorIconStyle]}>
          <Icon name={icon} size={22} color={color} />
        </Animated.View>
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
    </View>
  );
}

interface TabBarState {
  index: number;
  routes: { key: string; name: string }[];
}
interface TabBarNavigation {
  emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  navigate: (name: string) => void;
}

/** Barre d'onglets custom : rend les 4 icônes + un dot de sélection qui glisse d'un onglet à l'autre. */
function CustomTabBar({
  state,
  navigation,
  pendingCount,
}: {
  state: TabBarState;
  navigation: TabBarNavigation;
  pendingCount: number;
}) {
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = rowWidth / state.routes.length;
  const dotX = useSharedValue(0);
  const activeColor = TABS[state.index]?.color ?? '#39FF14';

  useEffect(() => {
    if (rowWidth > 0) {
      dotX.value = withSpring(state.index * tabWidth + tabWidth / 2 - DOT_SIZE / 2, DOT_SPRING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, rowWidth]);

  const dotStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dotX.value }] }));

  const onLayoutRow = (e: LayoutChangeEvent) => setRowWidth(e.nativeEvent.layout.width);

  // Masque la barre pendant l'édition (ex. recherche dans Apprendre), comme le faisait
  // tabBarHideOnKeyboard avant le passage à un tabBar custom.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const hideProgress = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      hideProgress.value = withTiming(1, { duration: 200 });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      hideProgress.value = withTiming(0, { duration: 200 });
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideStyle = useAnimatedStyle(() => ({
    opacity: 1 - hideProgress.value,
    transform: [{ translateY: hideProgress.value * 40 }],
  }));

  return (
    <Animated.View style={[styles.tabBar, hideStyle]} pointerEvents={keyboardVisible ? 'none' : 'auto'}>
      <View style={styles.tabRow} onLayout={onLayoutRow}>
        {rowWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.slidingDot, dotStyle, { backgroundColor: activeColor }]}
          />
        )}
        {state.routes.map((route, index) => {
          const meta = TABS.find((t) => t.name === route.name) ?? TABS[0];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!event.defaultPrevented) {
              if (!focused) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItemTouchable}
              activeOpacity={0.85}
            >
              <AnimatedTabIcon
                icon={meta.icon}
                label={meta.label}
                focused={focused}
                color={meta.color}
                badgeCount={route.name === 'index' ? pendingCount : undefined}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { userId } = useUser();
  const { pendingCount } = usePendingChallenges(userId);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar state={props.state} navigation={props.navigation} pendingCount={pendingCount} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="learn" options={{ title: 'Apprendre' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Classement' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
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
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  tabItemTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconStack: {
    width: 22,
    height: 22,
  },
  tabGlow: {
    position: 'absolute',
    top: -12,
    left: -14,
    right: -14,
    bottom: -12,
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
  slidingDot: {
    position: 'absolute',
    bottom: 2,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
