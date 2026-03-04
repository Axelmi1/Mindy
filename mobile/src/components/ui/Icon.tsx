import React from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

// Icon names mapping for consistent usage across the app
export type IconName =
  // Navigation
  | 'home'
  | 'book'
  | 'user'
  | 'settings'
  // Actions
  | 'arrow-left'
  | 'arrow-right'
  | 'x'
  | 'check'
  | 'plus'
  | 'minus'
  | 'refresh'
  | 'search'
  // Status
  | 'lock'
  | 'unlock'
  | 'star'
  | 'heart'
  | 'flame'
  | 'zap'
  | 'trophy'
  | 'target'
  // Media
  | 'play'
  | 'pause'
  | 'volume'
  | 'volume-off'
  // Domain specific
  | 'bitcoin'
  | 'ethereum'
  | 'dollar'
  | 'trending-up'
  | 'trending-down'
  | 'chart'
  | 'wallet'
  | 'bank'
  | 'credit-card'
  | 'pie-chart'
  // Misc
  | 'clock'
  | 'calendar'
  | 'bell'
  | 'info'
  | 'help'
  | 'alert'
  | 'shield'
  | 'gift'
  | 'brain'
  | 'rocket'
  | 'sparkles'
  | 'graduation'
  | 'lightbulb'
  | 'thumbs-up'
  | 'thumbs-down'
  | 'eye'
  | 'eye-off'
  | 'share'
  | 'copy'
  | 'trash'
  | 'edit'
  | 'save'
  | 'download'
  | 'upload'
  | 'link'
  | 'external-link'
  | 'menu'
  | 'more-horizontal'
  | 'more-vertical'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'google'
  | 'apple'
  | 'logout'
  | 'login'
  | 'users'
  | 'award'
  | 'medal'
  | 'calculator';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Map our icon names to actual icon components and names
const iconMap: Record<IconName, { set: 'feather' | 'material' | 'ionicons'; name: string }> = {
  // Navigation
  home: { set: 'feather', name: 'home' },
  book: { set: 'feather', name: 'book-open' },
  user: { set: 'feather', name: 'user' },
  settings: { set: 'feather', name: 'settings' },
  // Actions
  'arrow-left': { set: 'feather', name: 'arrow-left' },
  'arrow-right': { set: 'feather', name: 'arrow-right' },
  x: { set: 'feather', name: 'x' },
  check: { set: 'feather', name: 'check' },
  plus: { set: 'feather', name: 'plus' },
  minus: { set: 'feather', name: 'minus' },
  refresh: { set: 'feather', name: 'refresh-cw' },
  search: { set: 'feather', name: 'search' },
  // Status
  lock: { set: 'feather', name: 'lock' },
  unlock: { set: 'feather', name: 'unlock' },
  star: { set: 'feather', name: 'star' },
  heart: { set: 'feather', name: 'heart' },
  flame: { set: 'material', name: 'fire' },
  zap: { set: 'feather', name: 'zap' },
  trophy: { set: 'material', name: 'trophy' },
  target: { set: 'feather', name: 'target' },
  // Media
  play: { set: 'feather', name: 'play' },
  pause: { set: 'feather', name: 'pause' },
  volume: { set: 'feather', name: 'volume-2' },
  'volume-off': { set: 'feather', name: 'volume-x' },
  // Domain specific
  bitcoin: { set: 'material', name: 'bitcoin' },
  ethereum: { set: 'material', name: 'ethereum' },
  dollar: { set: 'material', name: 'currency-usd' },
  'trending-up': { set: 'feather', name: 'trending-up' },
  'trending-down': { set: 'feather', name: 'trending-down' },
  chart: { set: 'material', name: 'chart-line' },
  wallet: { set: 'material', name: 'wallet' },
  bank: { set: 'material', name: 'bank' },
  'credit-card': { set: 'feather', name: 'credit-card' },
  'pie-chart': { set: 'feather', name: 'pie-chart' },
  // Misc
  clock: { set: 'feather', name: 'clock' },
  calendar: { set: 'feather', name: 'calendar' },
  bell: { set: 'feather', name: 'bell' },
  info: { set: 'feather', name: 'info' },
  help: { set: 'feather', name: 'help-circle' },
  alert: { set: 'feather', name: 'alert-triangle' },
  shield: { set: 'feather', name: 'shield' },
  gift: { set: 'feather', name: 'gift' },
  brain: { set: 'material', name: 'brain' },
  rocket: { set: 'material', name: 'rocket-launch' },
  sparkles: { set: 'material', name: 'creation' },
  graduation: { set: 'material', name: 'school' },
  lightbulb: { set: 'material', name: 'lightbulb-outline' },
  'thumbs-up': { set: 'feather', name: 'thumbs-up' },
  'thumbs-down': { set: 'feather', name: 'thumbs-down' },
  eye: { set: 'feather', name: 'eye' },
  'eye-off': { set: 'feather', name: 'eye-off' },
  share: { set: 'feather', name: 'share-2' },
  copy: { set: 'feather', name: 'copy' },
  trash: { set: 'feather', name: 'trash-2' },
  edit: { set: 'feather', name: 'edit-2' },
  save: { set: 'feather', name: 'save' },
  download: { set: 'feather', name: 'download' },
  upload: { set: 'feather', name: 'upload' },
  link: { set: 'feather', name: 'link' },
  'external-link': { set: 'feather', name: 'external-link' },
  menu: { set: 'feather', name: 'menu' },
  'more-horizontal': { set: 'feather', name: 'more-horizontal' },
  'more-vertical': { set: 'feather', name: 'more-vertical' },
  'chevron-up': { set: 'feather', name: 'chevron-up' },
  'chevron-down': { set: 'feather', name: 'chevron-down' },
  'chevron-left': { set: 'feather', name: 'chevron-left' },
  'chevron-right': { set: 'feather', name: 'chevron-right' },
  google: { set: 'ionicons', name: 'logo-google' },
  apple: { set: 'ionicons', name: 'logo-apple' },
  logout: { set: 'feather', name: 'log-out' },
  login: { set: 'feather', name: 'log-in' },
  users: { set: 'feather', name: 'users' },
  award: { set: 'feather', name: 'award' },
  medal: { set: 'material', name: 'medal' },
  calculator: { set: 'material', name: 'calculator' },
};

/**
 * Icon component - Unified icon interface for the app
 * Uses Feather (clean UI), MaterialCommunityIcons (domain), and Ionicons (brands)
 */
export function Icon({ name, size = 24, color = '#E6EDF3' }: IconProps) {
  const iconConfig = iconMap[name];

  if (!iconConfig) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  switch (iconConfig.set) {
    case 'feather':
      return <Feather name={iconConfig.name as any} size={size} color={color} />;
    case 'material':
      return <MaterialCommunityIcons name={iconConfig.name as any} size={size} color={color} />;
    case 'ionicons':
      return <Ionicons name={iconConfig.name as any} size={size} color={color} />;
    default:
      return null;
  }
}

export default Icon;
