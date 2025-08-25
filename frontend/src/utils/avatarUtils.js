// Avatar utility functions

export const avatarOptions = [
  { id: 'avt1', src: '/images/avt1.jpg', alt: 'Avatar 1' },
  { id: 'avt2', src: '/images/avt2.jpg', alt: 'Avatar 2' },
  { id: 'avt3', src: '/images/avt3.jpg', alt: 'Avatar 3' },
  { id: 'avt4', src: '/images/avt4.jpg', alt: 'Avatar 4' },
  { id: 'avt5', src: '/images/avt5.jpg', alt: 'Avatar 5' },
  { id: 'avt6', src: '/images/avt6.jpg', alt: 'Avatar 6' },
  { id: 'avt7', src: '/images/avt7.jpg', alt: 'Avatar 7' },
  { id: 'avt8', src: '/images/avt8.jpg', alt: 'Avatar 8' }
];

/**
 * Get avatar image path from avatar ID
 * @param {string} avatarId - The avatar ID (e.g., 'avt1', 'avt2', etc.)
 * @returns {string} - The path to the avatar image
 */
export const getAvatarImage = (avatarId) => {
  if (!avatarId || typeof avatarId !== 'string') {
    return '/images/avt1.jpg'; // Default avatar
  }
  
  // If it's already a path, return it
  if (avatarId.includes('/images/')) {
    return avatarId;
  }
  
  // If it's an avatar ID like 'avt1', convert to path
  if (avatarId.startsWith('avt')) {
    return `/images/${avatarId}.jpg`;
  }
  
  // If it's an emoji or other format, return default
  return '/images/avt1.jpg';
};

/**
 * Get avatar info by ID
 * @param {string} avatarId - The avatar ID
 * @returns {object} - Avatar object with id, src, and alt
 */
export const getAvatarInfo = (avatarId) => {
  const avatar = avatarOptions.find(av => av.id === avatarId);
  return avatar || avatarOptions[0]; // Return first avatar as default
};