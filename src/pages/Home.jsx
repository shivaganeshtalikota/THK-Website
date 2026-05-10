import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaArrowRight, FaUsers, FaHandshake, FaHeart, FaBullhorn } from 'react-icons/fa'

const Home = () => {
  const stats = [
    { number: '10+', label: 'Years of Service', icon: FaUsers },
    { number: '1000+', label: 'Community Events', icon: FaHandshake },
    { number: '50K+', label: 'Lives Impacted', icon: FaHeart },
    { number: '100%', label: 'Dedication', icon: FaBullhorn },
  ]

  const focusAreas = [
    {
      title: 'Economic Development',
      description: 'Promoting industrial growth and creating employment opportunities for the youth of Telangana.',
    },
    {
      title: 'Good Governance',
      description: 'Ensuring transparency, accountability, and citizen-centric services in administration.',
    },
    {
      title: 'Social Welfare',
      description: 'Supporting education, healthcare, and empowerment programs for all communities.',
    },
    {
      title: 'Telugu Cultural Pride',
      description: 'Preserving Telugu language, culture, and heritage while embracing progress.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Home - Hari Krishna Talikota | iTDP Telangana State President</title>
        <meta name="description" content="Official website of Hari Krishna Talikota, iTDP Telangana State President. Dedicated to Telugu pride, regional development, and good governance." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-white pt-20">
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <div className="relative w-full max-w-lg mx-auto">
                <div className="absolute inset-0 bg-tdp-yellow rounded-3xl blur-3xl opacity-20"></div>
                <img
                  src="https://scontent.fhyd11-1.fna.fbcdn.net/v/t39.30808-6/365503769_645869240981296_7055762961202094926_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=TymTDWravgkQ7kNvwGA1Z6e&_nc_oc=Adq0w-johTaXMRf8bdpdT_kbmE3oyyP9F4A8FaBhb6LMlJxvRFFUlzl3Z2tyLqL-wcaqefpvKBE7ar7ZOQ_pVCM2&_nc_zt=23&_nc_ht=scontent.fhyd11-1.fna&_nc_gid=DUb53rCeUCW5sctkghSLRA&_nc_ss=7b289&oh=00_Af7n6mtvqR4QQIPdZyzIH-7X3IAj3YODOgXjlu3kYvz0JA&oe=6A05FBC0"
                  alt="Hari Krishna Talikota"
                  className="relative rounded-3xl w-full shadow-2xl border-8 border-tdp-yellow"
                />
              </div>
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-1 lg:order-2 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-block mb-6"
              >
                <span className="bg-tdp-yellow text-gray-900 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide">
                  iTDP Telangana State President
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-gray-900 mb-6"
              >
                Hari Krishna
                <span className="block text-tdp-yellow">Talikota</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8"
              >
                Serving Telangana with Dedication. Committed to Telugu Pride, Regional Development, and Good Governance.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-wrap gap-4 justify-center lg:justify-start"
              >
                <Link to="/political" className="bg-tdp-yellow text-gray-900 font-bold py-4 px-8 rounded-full hover:bg-tdp-dark-yellow transition-all duration-300 hover:shadow-xl inline-flex items-center gap-2">
                  Political Vision <FaArrowRight />
                </Link>
                <Link to="/contact" className="border-2 border-tdp-yellow text-gray-900 font-bold py-4 px-8 rounded-full hover:bg-tdp-yellow transition-all duration-300 inline-flex items-center gap-2">
                  Get Involved <FaArrowRight />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-tdp-yellow">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full text-tdp-yellow text-2xl mb-4">
                  <stat.icon />
                </div>
                <h3 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{stat.number}</h3>
                <p className="text-gray-800 font-semibold">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-8"></div>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Dedicated to advancing the interests of the Telugu people through principled political leadership and community service. Working tirelessly for the development, prosperity, and cultural preservation of Telangana and Andhra Pradesh.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Focus Areas */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Political Focus Areas</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Working towards comprehensive development and prosperity for all citizens of Telangana
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {focusAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-tdp-yellow"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{area.title}</h3>
                <p className="text-gray-600 leading-relaxed">{area.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-tdp-yellow">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Join Our Movement</h2>
            <p className="text-xl text-gray-800 mb-8">
              Be part of the change. Together, we can build a prosperous and inclusive Telangana that honors our heritage while embracing progress.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact" className="bg-white text-gray-900 font-bold py-4 px-8 rounded-full hover:bg-gray-100 transition-all duration-300 hover:shadow-xl inline-flex items-center gap-2">
                Get Involved <FaArrowRight />
              </Link>
              <Link to="/about" className="border-2 border-white text-gray-900 font-bold py-4 px-8 rounded-full hover:bg-white transition-all duration-300 inline-flex items-center gap-2">
                Learn More <FaArrowRight />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Home
