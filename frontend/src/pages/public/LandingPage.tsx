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

      {/* Hero Section with Background Image */}
      <div className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-slate-900/90" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-white"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-6"
                >
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Ranked #1 International School in Indonesia</span>
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Shaping Future
                  <span className="block bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                    Global Leaders
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Excellence in education meets cutting-edge technology. Join FahrenCenter International School 
                  for a world-class learning experience that prepares students for global success.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-2xl hover:shadow-yellow-500/50 transition-all flex items-center justify-center gap-2 group"
                    >
                      <GraduationCap className="w-6 h-6" />
                      Apply for Admission
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </Link>
                  
                  <Link to="/public/absen">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ScanFace className="w-5 h-5" />
                      Smart Attendance
                    </motion.button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-yellow-400">15+</div>
                    <div className="text-sm text-gray-400 mt-1">Years Excellence</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-green-400">2,000+</div>
                    <div className="text-sm text-gray-400 mt-1">Students</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="text-3xl font-bold text-blue-400">50+</div>
                    <div className="text-sm text-gray-400 mt-1">Countries</div>
                  </div>
                </div>
              </motion.div>

              {/* Right Content - School Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="relative hidden md:block"
              >
                <div className="relative z-10">
                  <img 
                    src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80" 
                    alt="FahrenCenter School"
                    className="rounded-3xl shadow-2xl border-4 border-white/20"
                  />
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl opacity-30 blur-2xl"></div>
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl opacity-30 blur-2xl"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section - Vision, Mission, Values */}
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
            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 h-full border-2 border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700 leading-relaxed">
                  To be the leading international school that nurtures innovative thinkers, 
                  responsible leaders, and lifelong learners who make positive contributions to society.
                </p>
              </div>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 h-full border-2 border-purple-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed">
                  Provide world-class education that integrates academic excellence with character development, 
                  fostering creativity, critical thinking, and global awareness.
                </p>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 h-full border-2 border-orange-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Core Values</h3>
                <ul className="text-gray-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span>Integrity & Respect</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span>Innovation & Excellence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <span>Collaboration & Diversity</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              <BookOpen className="w-4 h-4" />
              Academic Programs
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              World-Class <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Curriculum</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              International standards meet local excellence in our comprehensive educational programs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                icon: <GraduationCap className="w-8 h-8" />,
                title: "Cambridge International",
                description: "IGCSE and A-Level programs recognized by universities worldwide",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50",
                borderColor: "border-blue-200 hover:border-blue-400"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "IB Diploma Programme",
                description: "International Baccalaureate curriculum for critical thinkers",
                color: "from-purple-500 to-pink-500",
                bgColor: "from-purple-50 to-pink-50",
                borderColor: "border-purple-200 hover:border-purple-400"
              },
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "National Plus",
                description: "Enhanced national curriculum with international standards",
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50",
                borderColor: "border-green-200 hover:border-green-400"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "STEM Excellence",
                description: "Advanced science, technology, engineering, and mathematics",
                color: "from-orange-500 to-red-500",
                bgColor: "from-orange-50 to-red-50",
                borderColor: "border-orange-200 hover:border-orange-400"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Language Programs",
                description: "Multilingual education: English, Mandarin, Arabic, French",
                color: "from-indigo-500 to-blue-500",
                bgColor: "from-indigo-50 to-blue-50",
                borderColor: "border-indigo-200 hover:border-indigo-400"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Arts & Sports",
                description: "Comprehensive programs in music, arts, and athletics",
                color: "from-pink-500 to-rose-500",
                bgColor: "from-pink-50 to-rose-50",
                borderColor: "border-pink-200 hover:border-pink-400"
              }
            ].map((program, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
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

      {/* Facilities Section */}
      <section id="facilities" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              <Building2 className="w-4 h-4" />
              World-Class Facilities
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              State-of-the-Art <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Campus</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern infrastructure designed for optimal learning and development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[
              {
                image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80",
                title: "Smart Classrooms",
                description: "Interactive digital boards, AC, comfortable seating, and modern learning tools"
              },
              {
                image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
                title: "Science Laboratories",
                description: "Fully equipped physics, chemistry, and biology labs with latest equipment"
              },
              {
                image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
                title: "Digital Library",
                description: "Over 50,000 books, e-books, research databases, and study spaces"
              },
              {
                image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
                title: "Sports Complex",
                description: "Olympic-size pool, basketball courts, football field, and fitness center"
              }
            ].map((facility, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative h-80 overflow-hidden">
                  <img 
                    src={facility.image} 
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
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

      {/* Smart Attendance Section */}
      <section id="attendance" className="py-20 bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Smart Technology
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI-Powered <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Attendance System</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              ClassAttend: Cutting-edge face recognition technology for seamless attendance tracking
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                {
                  icon: <ScanFace className="w-6 h-6" />,
                  title: "Face Recognition",
                  description: "HOG detection with 128D encoding for 80%+ accuracy"
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Instant Check-in",
                  description: "Less than 2 seconds recognition time"
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "Secure & Private",
                  description: "Bank-level encryption for facial data"
                },
                {
                  icon: <ChartBar className="w-6 h-6" />,
                  title: "Real-time Reports",
                  description: "Live attendance tracking and analytics"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-square bg-gradient-to-br from-primary-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <ScanFace className="w-32 h-32 text-white opacity-50" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Recognition Speed</span>
                    <span className="text-green-400 font-bold">&lt;2s</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "99%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                    ></motion.div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Accuracy Rate</span>
                    <span className="text-yellow-400 font-bold">99.9%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "99.9%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.7 }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                    ></motion.div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 blur-3xl"></div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link to="/public/absen">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transition-all inline-flex items-center gap-3"
              >
                <ScanFace className="w-6 h-6" />
                Try Smart Attendance Now
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              <Award className="w-4 h-4" />
              Our Achievements
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Recognized <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Excellence</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { number: "15+", label: "Years of Excellence", icon: <Trophy className="w-8 h-8" /> },
              { number: "2,000+", label: "Happy Students", icon: <Users className="w-8 h-8" /> },
              { number: "50+", label: "Countries", icon: <Globe className="w-8 h-8" /> },
              { number: "98%", label: "University Acceptance", icon: <GraduationCap className="w-8 h-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-4">
              <MapPin className="w-4 h-4" />
              Get in Touch
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Visit Our <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Campus</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Schedule a tour and discover why FahrenCenter is the best choice for your child's education
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: <MapPin className="w-8 h-8" />,
                title: "Visit Us",
                content: "Jl. Pendidikan No. 123\nJakarta Selatan 12345\nIndonesia",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Phone className="w-8 h-8" />,
                title: "Call Us",
                content: "+62 21 1234 5678\n+62 812 3456 7890\nMon-Fri: 8AM - 5PM",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <Mail className="w-8 h-8" />,
                title: "Email Us",
                content: "info@fahrencenter.sch.id\nadmissions@fahrencenter.sch.id\nSupport 24/7",
                color: "from-orange-500 to-red-500"
              }
            ].map((contact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${contact.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg`}>
                  {contact.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{contact.title}</h3>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">{contact.content}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-gradient-to-r from-primary-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-primary-500/50 transition-all inline-flex items-center gap-3"
              >
                <GraduationCap className="w-6 h-6" />
                Apply for Admission
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

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
