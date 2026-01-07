import React from 'react';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const Facilities: React.FC = () => {
  const facilities = [
    {
      image: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80',
      title: 'Smart Classrooms',
      description: 'Interactive digital boards, AC, comfortable seating, and modern learning tools'
    },
    {
      image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
      title: 'Science Laboratories',
      description: 'Fully equipped physics, chemistry, and biology labs with latest equipment'
    },
    {
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
      title: 'Digital Library',
      description: 'Over 50,000 books, e-books, research databases, and study spaces'
    },
    {
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      title: 'Sports Complex',
      description: 'Olympic-size pool, basketball courts, football field, and fitness center'
    }
  ];

  return (
    <section id="facilities" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
            <Building2 className="w-4 h-4" />
            World-Class Facilities
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            State-of-the-Art <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Campus</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Modern infrastructure designed for optimal learning and development</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {facilities.map((facility, index) => (
            <motion.div key={index} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="relative h-80 overflow-hidden">
                <img src={facility.image} alt={facility.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{facility.title}</h3>
                  <p className="text-gray-200">{facility.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Facilities;
