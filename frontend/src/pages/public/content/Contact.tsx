import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const Contact: React.FC = () => {
  const contacts = [
    { icon: <MapPin className="w-8 h-8" />, title: 'Visit Us', content: 'Jl. Pendidikan No. 123\nJakarta Selatan 12345\nIndonesia', color: 'from-blue-500 to-cyan-500' },
    { icon: <Phone className="w-8 h-8" />, title: 'Call Us', content: '+62 21 1234 5678\n+62 812 3456 7890\nMon-Fri: 8AM - 5PM', color: 'from-purple-500 to-pink-500' },
    { icon: <Mail className="w-8 h-8" />, title: 'Email Us', content: 'info@fahrencenter.sch.id\nadmissions@fahrencenter.sch.id\nSupport 24/7', color: 'from-orange-500 to-red-500' }
  ];

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
            <MapPin className="w-4 h-4" />
            Get in Touch
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Visit Our <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Campus</span></h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Schedule a tour and discover why FahrenCenter is the best choice for your child's education</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {contacts.map((contact, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all text-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${contact.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg`}>{contact.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{contact.title}</h3>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">{contact.content}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mt-12">
          <Link to="/register">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-10 py-5 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-primary-500/50 transition-all inline-flex items-center gap-3">
              <GraduationCapIcon />
              Apply for Admission
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// small wrapper to lazy-import graduation cap icon to avoid name collision with other files
const GraduationCapIcon: React.FC = () => <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7"/><path d="M12 3L1 9l11 6 9-4.91V17"/></svg>;

export default Contact;
