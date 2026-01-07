import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanFace,
  ChartBar,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Award,
  BookOpen,
  Globe,
  GraduationCap,
  Heart,
  Star,
  Target,
  Trophy,
  Building2,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import Hero from './content/Hero';
import About from './content/About';
import Programs from './content/Programs';
import Facilities from './content/Facilities';
import AttendanceSection from './content/AttendanceSection';
import Achievements from './content/Achievements';
import Contact from './content/Contact';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  FahrenCenter
                </h1>
                <p className="text-xs text-gray-600">International School</p>
              </div>
            </motion.div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">About</a>
              <a href="#programs" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Programs</a>
              <a href="#facilities" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Facilities</a>
              <a href="#attendance" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Smart Attendance</a>
              <a href="#contact" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Contact</a>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <Link to="/login">
                <button className="px-5 py-2.5 text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Portal Login
                </button>
              </Link>
              <Link to="/register">
                <button className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:scale-105">
                  Enroll Now
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      <Hero />
      <About />
      <Programs />
      <Facilities />
      <AttendanceSection />
      <Achievements />
      <Contact />

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">FahrenCenter</h1>
                  <p className="text-xs text-gray-400">International School</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                Empowering students to become confident, creative, and compassionate global citizens since 2010.
              </p>
              <div className="flex gap-3">
                {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                  <a 
                    key={social}
                    href="#" 
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#programs" className="hover:text-white transition-colors">Programs</a></li>
                <li><a href="#facilities" className="hover:text-white transition-colors">Facilities</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Admissions */}
            <div>
              <h3 className="text-lg font-bold mb-4">Admissions</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link to="/register" className="hover:text-white transition-colors">Apply Now</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Tuition Fees</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Scholarships</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Student Portal</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-bold mb-4">Resources</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Academic Calendar</a></li>
                <li><Link to="/public/absen" className="hover:text-white transition-colors">Smart Attendance</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Parent Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Career</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 FahrenCenter International School. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
