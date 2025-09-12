// Generate random usernames like TikTok
const adjectives = [
  'Cool', 'Smart', 'Bright', 'Happy', 'Lucky', 'Quick', 'Bold', 'Calm', 
  'Wild', 'Swift', 'Epic', 'Cute', 'Funny', 'Silly', 'Witty', 'Clever',
  'Super', 'Ultra', 'Mega', 'Prime', 'Elite', 'Pro', 'Star', 'Golden',
  'Silver', 'Diamond', 'Crystal', 'Mystic', 'Secret', 'Hidden', 'Magic',
  'Cosmic', 'Neon', 'Electric', 'Sonic', 'Turbo', 'Flash', 'Speed'
]

const nouns = [
  'Tiger', 'Eagle', 'Wolf', 'Lion', 'Bear', 'Fox', 'Hawk', 'Owl',
  'Dragon', 'Phoenix', 'Falcon', 'Shark', 'Dolphin', 'Panther', 'Jaguar',
  'Rabbit', 'Panda', 'Koala', 'Penguin', 'Turtle', 'Whale', 'Octopus',
  'Star', 'Moon', 'Sun', 'Cloud', 'Storm', 'Thunder', 'Lightning', 'Rain',
  'Fire', 'Ice', 'Wind', 'Earth', 'Ocean', 'River', 'Mountain', 'Forest',
  'Ninja', 'Warrior', 'Knight', 'Wizard', 'Mage', 'Hunter', 'Scout', 'Hero'
]

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)]
}

const generateRandomNumber = (min = 10, max = 999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const generateRandomUsername = () => {
  const adjective = getRandomElement(adjectives)
  const noun = getRandomElement(nouns)
  const number = generateRandomNumber()
  
  return `${adjective}${noun}${number}`
}

// Check if username is valid (alphanumeric, 3-20 characters)
export const isValidUsername = (username) => {
  if (!username) return false
  
  // Check length
  if (username.length < 3 || username.length > 20) return false
  
  // Check if only alphanumeric characters and underscores
  const validPattern = /^[a-zA-Z0-9_]+$/
  if (!validPattern.test(username)) return false
  
  // Cannot start with a number
  if (/^[0-9]/.test(username)) return false
  
  return true
}

// Format username suggestions
export const formatUsernameFromName = (name) => {
  if (!name) return generateRandomUsername()
  
  // Clean the name: remove spaces, special chars, keep only alphanumeric
  const cleaned = name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15)
  
  if (cleaned.length < 3) {
    return generateRandomUsername()
  }
  
  // Add random number to make it unique
  const number = generateRandomNumber(10, 99)
  return `${cleaned}${number}`
}
