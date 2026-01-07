import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Star, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
            <Target className="w-4 h-4" />
            About FahrenCenter
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Excellence in <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">International Education</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering students to become confident, creative, and compassionate global citizens
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="group">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 h-full border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To be the leading international school that nurtures innovative thinkers, responsible leaders, and lifelong learners who make positive contributions to society.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="group">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 h-full border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                Provide world-class education that integrates academic excellence with character development, fostering creativity, critical thinking, and global awareness.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="group">
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 h-full border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Core Values</h3>
              <ul className="text-gray-700 space-y-2">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" /><span>Integrity & Respect</span></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" /><span>Innovation & Excellence</span></li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" /><span>Collaboration & Diversity</span></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
