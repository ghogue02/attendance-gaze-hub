
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IndexLayoutProps {
  children: ReactNode;
}

const IndexLayout = ({ children }: IndexLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50">
      <Header />
      
      <main className="pt-12 pb-16 px-4 container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Pursuit AI-Native Attendance System
          </h1>
        </motion.div>
        
        {children}
      </main>
    </div>
  );
};

export default IndexLayout;
