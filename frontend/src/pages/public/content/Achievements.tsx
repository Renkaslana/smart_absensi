import React from 'react';
import { motion } from 'framer-motion';
import { Award, Trophy, Users, Globe, GraduationCap } from 'lucide-react';

const Achievements: React.FC = () => {
  const stats = [
    { number: '15+', label: 'Years of Excellence', icon: <Trophy className="w-8 h-8" /> },
    { number: '2,000+', label: 'Happy Students', icon: <Users className="w-8 h-8" /> },
    { number: '50+', label: 'Countries', icon: <Globe className="w-8 h-8" /> },
    { number: '98%', label: 'University Acceptance', icon: <GraduationCap className="w-8 h-8" /> }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
            <Award className="w-4 h-4" />
            Our Achievements
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Recognized <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Excellence</span></h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div key={index} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">{stat.icon}</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">{stat.number}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Achievements;
