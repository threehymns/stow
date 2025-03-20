
import { NoteLayout } from '@/components/NoteLayout';
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const Index = () => {
  // Change document title
  useEffect(() => {
    document.title = 'Notes App';
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <NoteLayout />
    </motion.div>
  );
};

export default Index;
