import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '@/components/ui/Icon';

/**
 * Tab icon component
 */
function TabIcon({ icon, label, focused }: { icon: IconName; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Icon
        name={icon}
        size={24}
        color={focused ? '#39FF14' : '#6E7681'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Tab-based layout for main app navigation
 */
export default function TabLayout() {
  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
      screenListeners={{
        tabPress: handleTabPress,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="book" label="Learn" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="user" label="Profile" focused={focused} />
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
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    gap: 4,
  },
  tabLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#6E7681',
  },
  tabLabelFocused: {
    color: '#39FF14',
  },
});
