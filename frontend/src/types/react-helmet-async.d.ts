declare module 'react-helmet-async' {
  import { ComponentType, ReactNode } from 'react';

  export interface HelmetProps {
    children?: ReactNode;
  }

  export const Helmet: ComponentType<HelmetProps>;

  export interface HelmetProviderProps {
    children?: ReactNode;
  }
  export const HelmetProvider: ComponentType<HelmetProviderProps>;

  export default {};
} 