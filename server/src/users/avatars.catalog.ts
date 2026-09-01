/**
 * Catalogue de la boutique d'avatars — achetables avec l'XP gagnée.
 * Emoji only : aucun asset à héberger, rendu identique iOS/Android.
 * `free: true` = possédé par tout le monde dès l'inscription.
 */

export interface AvatarItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  free?: boolean;
}

export const DEFAULT_AVATAR_ID = 'brain';

export const AVATAR_CATALOG: AvatarItem[] = [
  // Gratuits
  { id: 'brain', emoji: '🧠', name: 'Cerveau', price: 0, rarity: 'COMMON', free: true },
  { id: 'rocket', emoji: '🚀', name: 'Fusée', price: 0, rarity: 'COMMON', free: true },

  // Common — premiers achats accessibles
  { id: 'fox', emoji: '🦊', name: 'Renard', price: 100, rarity: 'COMMON' },
  { id: 'owl', emoji: '🦉', name: 'Hibou', price: 100, rarity: 'COMMON' },
  { id: 'frog', emoji: '🐸', name: 'Grenouille', price: 150, rarity: 'COMMON' },

  // Rare
  { id: 'lion', emoji: '🦁', name: 'Lion', price: 300, rarity: 'RARE' },
  { id: 'whale', emoji: '🐳', name: 'Baleine', price: 300, rarity: 'RARE' },
  { id: 'ninja', emoji: '🥷', name: 'Ninja', price: 400, rarity: 'RARE' },

  // Epic
  { id: 'robot', emoji: '🤖', name: 'Robot', price: 750, rarity: 'EPIC' },
  { id: 'wizard', emoji: '🧙', name: 'Sorcier', price: 750, rarity: 'EPIC' },
  { id: 'alien', emoji: '👽', name: 'Alien', price: 900, rarity: 'EPIC' },

  // Legendary
  { id: 'dragon', emoji: '🐉', name: 'Dragon', price: 1500, rarity: 'LEGENDARY' },
  { id: 'crown', emoji: '👑', name: 'Couronne', price: 2000, rarity: 'LEGENDARY' },
];

export function findAvatar(id: string): AvatarItem | undefined {
  return AVATAR_CATALOG.find((a) => a.id === id);
}
