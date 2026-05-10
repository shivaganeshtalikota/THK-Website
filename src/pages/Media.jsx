import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaNewspaper, FaImage, FaVideo, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'

const Media = () => {
  const mediaCategories = [
    {
      icon: FaNewspaper,
      title: 'Political News',
      description: 'Latest updates on TDP activities, policy announcements, and political initiatives',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaImage,
      title: 'Photo Gallery',
      description: 'Visual documentation of events, public meetings, and community service activities',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaVideo,
      title: 'Video Content',
      description: 'Speeches, interviews, event coverage, and public announcements',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
  ]

  const recentUpdates = [
    {
      date: 'May 8, 2026',
      title: 'Public Meeting in Hyderabad',
      description: 'Addressed key issues facing Telangana citizens and outlined development plans for the region.',
    },
    {
      date: 'May 5, 2026',
      title: 'TDP State Committee Meeting',
      description: 'Participated in strategic planning session with party leadership to discuss upcoming initiatives.',
    },
    {
      date: 'May 1, 2026',
      title: 'Community Outreach Program',
      description: 'Visited local communities to understand their concerns and provide support for various issues.',
    },
    {
      date: 'April 28, 2026',
      title: 'Temple Board Meeting',
      description: 'Reviewed temple operations and discussed improvements for devotee services at Kanaka Durga Temple.',
    },
  ]

  const socialLinks = [
    {
      icon: FaInstagram,
      name: 'Instagram',
      handle: '@hari_krishna_talikota',
      url: 'https://www.instagram.com/hari_krishna_talikota',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
      followers: '10K+',
    },
    {
      icon: FaFacebook,
      name: 'Facebook',
      handle: 'Talikota Harikrishna',
      url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
      followers: '25K+',
    },
    {
      icon: FaTwitter,
      name: 'Twitter',
      handle: '@THK_iTDP',
      url: 'https://x.com/THK_iTDP',
      color: 'from-tdp-yellow to-tdp-dark-yellow',
      followers: '15K+',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Media & Updates - Hari Krishna Talikota | Latest News and Announcements</title>
        <meta name="description" content="Stay updated with the latest news, photos, videos, and announcements from Hari Krishna Talikota's political and community service activities." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-tdp-yellow text-gray-900 pt-20">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Media & Updates</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto font-semibold text-gray-800">
              Stay Connected with Latest News, Events, and Announcements
            </p>
          </motion.div>
        </div>
      </section>

      {/* Media Categories */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Content Categories</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Explore different types of media content and stay informed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {mediaCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover-lift text-center border-t-4 border-tdp-yellow"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center text-gray-900 text-4xl mx-auto mb-6`}>
                  <category.icon />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{category.title}</h3>
                <p className="text-gray-600 leading-relaxed">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Updates */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Recent Updates</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Latest activities and announcements from our political and community work
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {recentUpdates.map((update, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover-lift border-t-4 border-tdp-yellow"
              >
                <div className="bg-tdp-yellow text-gray-900 px-4 py-2 rounded-full text-sm font-semibold inline-block mb-4">
                  {update.date}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{update.title}</h3>
                <p className="text-gray-600 leading-relaxed">{update.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Follow on Social Media</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Stay connected and get real-time updates on all platforms
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {socialLinks.map((social, index) => (
              <motion.a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover-lift text-center group border-t-4 border-tdp-yellow"
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${social.color} rounded-full flex items-center justify-center text-gray-900 text-5xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <social.icon />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{social.name}</h3>
                <p className="text-gray-600 mb-3">{social.handle}</p>
                <div className="inline-block bg-tdp-yellow px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-gray-900">{social.followers} Followers</span>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section-padding bg-tdp-yellow text-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl mx-auto text-center space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold">Stay Informed</h2>
            <p className="text-xl text-gray-800 font-semibold">
              Subscribe to receive updates about political activities, community events, and important announcements directly to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 border-2 border-gray-900"
                required
              />
              <button type="submit" className="bg-gray-900 text-white font-semibold py-3 px-8 rounded-full hover:bg-gray-800 transition-all whitespace-nowrap">
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Media
