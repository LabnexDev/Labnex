import { motion } from 'framer-motion';

interface AnimatedGearIconProps {
  size?: number;
  className?: string;
  gradientId?: string;
}

const AnimatedGearIcon: React.FC<AnimatedGearIconProps> = ({
  size = 24,
  className = '',
  gradientId = 'gearGradient',
}) => {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={`url(#${gradientId})`}
      className={className}
      animate={{ rotate: 360 }}
      transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" /> {/* Light Blue */}
          <stop offset="100%" stopColor="#8B5CF6" /> {/* Purple */}
        </linearGradient>
      </defs>
      <path d="M19.435 12.001c0 .369-.034.733-.1 1.091l1.56 1.206c.252.195.307.543.114.797l-1.5 2.599a.539.539 0 01-.672.228l-1.888-.742a7.223 7.223 0 01-1.093.713l-.284 1.988a.54.54 0 01-.526.428h-3a.54.54 0 01-.526-.428l-.284-1.988a7.223 7.223 0 01-1.093-.713l-1.888.742a.539.539 0 01-.672-.228l-1.5-2.599a.546.546 0 01.114-.797l1.56-1.206a7.51 7.51 0 01-.1-1.091c0-.369.034-.733.1-1.091l-1.56-1.206a.546.546 0 01-.114-.797l1.5-2.599a.539.539 0 01.672-.228l1.888.742c.34-.206.704-.382 1.093-.515l.284-1.988A.54.54 0 019.977 4h3a.54.54 0 01.526.428l.284 1.988c.389.133.753.309 1.093.515l1.888-.742a.539.539 0 01.672.228l1.5 2.599a.546.546 0 01-.114.797l-1.56 1.206c.066.358.1.722.1 1.091zm-1.432 0a6.003 6.003 0 00-1.018-3.44l.38-.294-.75-1.3-1.105.434a6.04 6.04 0 00-1.48-.342V6h-1.5v1.063a6.04 6.04 0 00-1.48.342L9.38 7.27l-.75 1.3.38.294A6.003 6.003 0 007.997 12a6.003 6.003 0 001.018 3.44l-.38.294.75 1.3 1.105-.434a6.04 6.04 0 001.48.342V18h1.5v-1.063a6.04 6.04 0 001.48-.342l1.105.434.75-1.3-.38-.294A6.003 6.003 0 0018.003 12zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-1a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    </motion.svg>
  );
};

export default AnimatedGearIcon; 