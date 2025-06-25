import { useRef } from 'react';
const motion = lazy(() => import('framer-motion').then(module => ({ default: module.motion })));
import { useScroll, useTransform } from 'framer-motion';
import './LandingStyles.css'; // Import shared landing styles

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'zoomIn';
  staggerChildren?: number;
  staticRender?: boolean;
}

const ScrollAnimatedSection: React.FC<ScrollAnimatedSectionProps> = ({
  children,
  className = '',
  animationType = 'fadeInUp',
  staggerChildren = 0.1,
  staticRender = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'], 
  });

  let animationProps = {};

  if (!staticRender) {
    switch (animationType) {
      case 'fadeInUp':
        animationProps = {
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          y: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]),
        };
        break;
      case 'fadeInLeft':
        animationProps = {
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          x: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-100, 0, 0, 100]),
        };
        break;
      case 'fadeInRight':
        animationProps = {
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          x: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]),
        };
        break;
      case 'zoomIn':
        animationProps = {
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          scale: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.8, 1, 1, 0.8]),
        };
        break;
      default:
        animationProps = {
          opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]),
          y: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [100, 0, 0, -100]),
        };
    }
  } else {
    // Ensure section is visible when static rendering
    animationProps = { opacity: 1, y: 0, x: 0, scale: 1 };
  }

  const Tag = staticRender ? 'section' : motion.section;
  const transitionProps = staticRender ? {} : { transition: { staggerChildren } };

  return (
    <Tag
      ref={ref}
      className={`py-16 md:py-24 relative ${className}`}
      style={{ ...animationProps }}
      {...transitionProps}
    >
      {children}
    </Tag>
  );
};

export default ScrollAnimatedSection; 