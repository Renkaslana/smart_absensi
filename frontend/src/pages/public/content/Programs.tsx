import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, Globe, Zap, Users, Trophy } from 'lucide-react';

const Programs: React.FC = () => {
  const programs = [
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: 'Cambridge International',
      description: 'IGCSE and A-Level programs recognized by universities worldwide',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-200 hover:border-blue-400'
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: 'IB Diploma Programme',
      description: 'International Baccalaureate curriculum for critical thinkers',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200 hover:border-purple-400'
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'National Plus',
      description: 'Enhanced national curriculum with international standards',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200 hover:border-green-400'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'STEM Excellence',
      description: 'Advanced science, technology, engineering, and mathematics',
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      borderColor: 'border-orange-200 hover:border-orange-400'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Language Programs',
      description: 'Multilingual education: English, Mandarin, Arabic, French',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-50 to-blue-50',
      borderColor: 'border-indigo-200 hover:border-indigo-400'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Arts & Sports',
      description: 'Comprehensive programs in music, arts, and athletics',
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200 hover:border-pink-400'
    }
  ];

  return (
    <section id="programs" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
            <BookOpen className="w-4 h-4" />
            Academic Programs
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            World-Class <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Curriculum</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">International standards meet local excellence in our comprehensive educational programs</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {programs.map((program, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="group">
              <div className={`bg-gradient-to-br ${program.bgColor} rounded-2xl p-8 h-full border-2 ${program.borderColor} hover:shadow-2xl transition-all duration-300`}>
                <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg text-white`}>
                  {program.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                <p className="text-gray-700">{program.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Programs;
