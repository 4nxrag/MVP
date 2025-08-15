import User from '../models/User';

const ANONYMOUS_NAMES = [
  'ShadowWalker', 'MidnightVoice', 'EchoWhisper', 'DarkMuse', 'VoidSpeaker',
  'NightThinker', 'SilentStorm', 'PhantomMind', 'DuskPoet', 'TwilightSage',
  'MysticVoice', 'CrypticSoul', 'EnigmaSpeak', 'GhostWriter', 'NebulaMind',
  'CosmicWhisper', 'StardustVoice', 'LunarPoet', 'SolarMuse', 'NovaSpeak',
  'ShadowScribe', 'DarkOracle', 'NightWhisper', 'VoidEcho', 'MysticPen'
];

export const generateAnonymousName = async (): Promise<string> => {
  try {
    // Step 1: Get all currently used anonymous names from database
    const existingUsers = await User.find(
      { anonymousName: { $exists: true, $ne: null } }, 
      { anonymousName: 1, _id: 0 }
    ).lean();
    
    const usedNames = new Set(existingUsers.map(user => user.anonymousName));

    // Step 2: Try to assign from predefined themed names first
    const availableThemedNames = ANONYMOUS_NAMES.filter(name => !usedNames.has(name));
    
    if (availableThemedNames.length > 0) {
      // Randomly select from available themed names
      const randomIndex = Math.floor(Math.random() * availableThemedNames.length);
      return availableThemedNames[randomIndex];
    }

    // Step 3: All themed names are taken - generate Anonymous<n>
    // Find the highest Anonymous number currently in use
    const anonymousUsers = Array.from(usedNames)
      .map(name => {
        const match = name.match(/^Anonymous(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const maxAnonymousNumber = anonymousUsers.length > 0 ? Math.max(...anonymousUsers) : 0;
    const nextNumber = maxAnonymousNumber + 1;

    return `Anonymous${nextNumber}`;

  } catch (error) {
    console.error('Error generating anonymous name:', error);
    // Fallback: generate with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    return `Anonymous${timestamp}`;
  }
};

export const releaseAnonymousName = async (name: string): Promise<void> => {
  try {
    // Optional: Mark name as available when user account is deleted
    await User.updateOne(
      { anonymousName: name }, 
      { $unset: { anonymousName: "" } }
    );
  } catch (error) {
    console.error('Error releasing anonymous name:', error);
  }
};

// Helper function to check if a name is available
export const isAnonymousNameAvailable = async (name: string): Promise<boolean> => {
  try {
    const existingUser = await User.findOne({ anonymousName: name });
    return !existingUser;
  } catch (error) {
    console.error('Error checking name availability:', error);
    return false;
  }
};
