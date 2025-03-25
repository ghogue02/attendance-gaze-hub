
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface IndexLayoutProps {
  children: ReactNode;
}

const IndexLayout = ({ children }: IndexLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Header />
      
      <main className="pt-24 pb-16 px-4 container max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera size={28} className="text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Attendance System
            </h1>
          </div>
        </motion.div>
        
        {children}
      </main>
    </div>
  );
};

export default IndexLayout;
