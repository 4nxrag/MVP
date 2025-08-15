import crypto from 'crypto';

const FAKE_REGIONS = [
  'Northern District', 'Eastern Zone', 'Western Area', 'Central Region',
  'Southern Territory', 'Mountain Valley', 'Coastal Plains', 'Urban Core',
  'Riverside District', 'Highland Area', 'Metro Junction', 'Green Valley'
];

export const hashUserIP = (ip: string): string => {
  const salt = process.env.IP_SALT || 'default-salt-change-this';
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex')
    .substring(0, 8);
};

export const generateFakeRegion = (): string => {
  return FAKE_REGIONS[Math.floor(Math.random() * FAKE_REGIONS.length)];
};
