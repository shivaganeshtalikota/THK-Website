import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaInstagram, FaFacebook, FaTwitter, FaPaperPlane } from 'react-icons/fa'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    location: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        location: '',
        message: '',
      })
      
      setTimeout(() => setSubmitStatus(null), 5000)
    }, 2000)
  }

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: 'Office Location',
      details: ['Hyderabad, Telangana', 'India'],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaEnvelope,
      title: 'Email Address',
      details: ['contact@harikrishnatalikota.com', 'press@harikrishnatalikota.com'],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaPhone,
      title: 'Phone Number',
      details: ['+91 98765 43210', 'Mon-Sat: 9:00 AM - 6:00 PM'],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
  ]

  const socialLinks = [
    {
      icon: FaInstagram,
      name: 'Instagram',
      url: 'https://www.instagram.com/hari_krishna_talikota/',
      color: 'hover:text-tdp-yellow',
    },
    {
      icon: FaFacebook,
      name: 'Facebook',
      url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/',
      color: 'hover:text-tdp-yellow',
    },
    {
      icon: FaTwitter,
      name: 'Twitter',
      url: 'https://x.com/THK_iTDP',
      color: 'hover:text-tdp-yellow',
    },
  ]

  const subjectOptions = [
    'Political Inquiry',
    'Media Request',
    'Constituent Service',
    'Join TDP',
    'Volunteer',
    'Event Invitation',
    'General Inquiry',
  ]

  return (
    <>
      <Helmet>
        <title>Contact - Hari Krishna Talikota | Get in Touch</title>
        <meta name="description" content="Contact Hari Krishna Talikota for political inquiries, media requests, constituent services, or to get involved with TDP Telangana." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-tdp-yellow text-gray-900 pt-20">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Get in Touch</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto font-semibold text-gray-800">
              I am here to serve the people of Telangana. Reach out for inquiries, support, or to get involved.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 text-center hover-lift border-t-4 border-tdp-yellow"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-full flex items-center justify-center text-gray-900 text-2xl mx-auto mb-4`}>
                  <info.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{info.title}</h3>
                {info.details.map((detail, idx) => (
                  <p key={idx} className="text-gray-600">
                    {detail}
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="section-title">Send a Message</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Fill out the form below and we'll get back to you as soon as possible
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all"
                  >
                    <option value="">Select a subject</option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location/Constituency
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all"
                  placeholder="Your city or constituency"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-tdp-yellow focus:ring-2 focus:ring-tdp-yellow/20 outline-none transition-all resize-none"
                  placeholder="Write your message here..."
                ></textarea>
              </div>

              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg"
                >
                  Thank you for your message! We'll get back to you soon.
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="loader"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message <FaPaperPlane />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Social Media */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Connect on Social Media</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="text-gray-600 mb-8">Follow for daily updates and real-time announcements</p>
            
            <div className="flex justify-center space-x-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className={`w-16 h-16 bg-tdp-yellow rounded-full flex items-center justify-center text-gray-900 ${social.color} transition-all text-2xl hover:scale-110 active:scale-95`}
                  aria-label={social.name}
                >
                  <social.icon />
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-96 bg-gray-200">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d243647.3160407253!2d78.24323209999999!3d17.412608!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b78392bafbc2!2sHyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Office Location Map"
        ></iframe>
      </section>
    </>
  )
}

export default Contact
