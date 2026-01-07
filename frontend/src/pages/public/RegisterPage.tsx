import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  CheckCircle, 
  FileText,
  Users,
  Calendar,
  Award,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Download,
  ClipboardList,
  UserCheck,
  BookOpen
} from 'lucide-react';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  FahrenCenter
                </h1>
                <p className="text-xs text-gray-600">International School</p>
              </div>
            </Link>
            <Link to="/login">
              <button className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all">
                Student Portal
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-purple-700 opacity-90"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
              <Award className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">Admission Open for 2026/2027</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Join FahrenCenter
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                International School
              </span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl mx-auto">
              Start your child's journey to excellence. Applications are now open for the upcoming academic year.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="#apply"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-primary-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all inline-flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-5 h-5" />
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </motion.a>
              
              <motion.a
                href="#process"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Admission Process
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Choose <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">FahrenCenter</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              World-class education with proven track record
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Award className="w-8 h-8" />,
                title: "Accredited Excellence",
                description: "Cambridge International & IB World School accreditation",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Expert Faculty",
                description: "International teachers with advanced degrees and 15+ years experience",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <GraduationCap className="w-8 h-8" />,
                title: "University Success",
                description: "98% acceptance rate to top universities worldwide",
                color: "from-purple-500 to-pink-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 h-full border-2 border-gray-100 hover:border-primary-300 hover:shadow-2xl transition-all">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg text-white`}>
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission Process */}
      <section id="process" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Admission <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Process</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple and transparent application process
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Submit Application",
                description: "Complete the online application form and submit required documents including birth certificate, previous report cards, and passport photo.",
                icon: <FileText className="w-6 h-6" />
              },
              {
                step: "02",
                title: "Entrance Assessment",
                description: "Students will take an entrance test covering English, Mathematics, and General Knowledge. Interview with parents and student.",
                icon: <ClipboardList className="w-6 h-6" />
              },
              {
                step: "03",
                title: "Admission Decision",
                description: "Receive admission decision within 5-7 business days. Accepted students will receive enrollment package and welcome kit.",
                icon: <UserCheck className="w-6 h-6" />
              },
              {
                step: "04",
                title: "Enrollment & Account Setup",
                description: "Complete enrollment, pay fees, and receive your student ID and portal access credentials. Ready to start your journey!",
                icon: <GraduationCap className="w-6 h-6" />
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative mb-12 last:mb-0"
              >
                <div className="flex gap-6">
                  {/* Step Number */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                      {step.step}
                    </div>
                    {index !== 3 && (
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-primary-600 to-primary-300"></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-primary-600">
                        {step.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Required Documents */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Required <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">Documents</span>
            </h2>
            <p className="text-xl text-gray-600">
              Prepare these documents before applying
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              "Birth Certificate (Original & Copy)",
              "Previous Report Cards (Last 2 years)",
              "Passport-sized Photos (4x6 cm, 6 copies)",
              "Family Card (KK) Copy",
              "Parent ID Cards (KTP) Copy",
              "Medical Records & Immunization Certificate",
              "Transfer Certificate (if applicable)",
              "Student's Passport Copy (if any)"
            ].map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4 border-2 border-gray-100 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <span className="text-gray-800 font-medium">{doc}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <a
              href="#"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-5 h-5" />
              Download Application Form
            </a>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="apply" className="py-20 bg-gradient-to-br from-primary-900 via-purple-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-gray-200 mb-12 leading-relaxed">
              Join 2,000+ students from 50+ countries learning at FahrenCenter International School
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: <Phone className="w-6 h-6" />, label: "Call Us", value: "+62 21 1234 5678" },
                { icon: <Mail className="w-6 h-6" />, label: "Email", value: "admissions@fahrencenter.sch.id" },
                { icon: <MapPin className="w-6 h-6" />, label: "Visit", value: "Jl. Pendidikan No. 123, Jakarta" }
              ].map((contact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    {contact.icon}
                  </div>
                  <div className="text-sm text-gray-300 mb-1">{contact.label}</div>
                  <div className="font-bold">{contact.value}</div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="mailto:admissions@fahrencenter.sch.id"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-white text-primary-600 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all inline-flex items-center justify-center gap-3"
              >
                <Mail className="w-6 h-6" />
                Contact Admissions Office
              </motion.a>
              
              <Link to="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-5 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-bold text-lg rounded-2xl hover:bg-white/20 transition-all inline-flex items-center justify-center gap-3"
                >
                  <GraduationCap className="w-6 h-6" />
                  Student Portal Login
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">FahrenCenter International School</h3>
                <p className="text-xs text-gray-400">Excellence in Education</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">Â© 2026 FahrenCenter. All rights reserved.</p>
              <div className="flex gap-4 mt-2 justify-center md:justify-end text-sm text-gray-400">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <Link to="/login" className="hover:text-white transition-colors">Portal</Link>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RegisterPage;