import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaChartLine, FaRoad, FaGraduationCap, FaLeaf, FaUsers, FaBalanceScale, FaArrowRight } from 'react-icons/fa'

const Political = () => {
  const focusAreas = [
    {
      icon: FaChartLine,
      title: 'Economic Development',
      points: [
        'Promoting industrial growth in Telangana',
        'Creating employment opportunities for youth',
        'Supporting small and medium enterprises',
        'Attracting investments to the state',
        'Entrepreneurship development programs',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaRoad,
      title: 'Infrastructure Development',
      points: [
        'Improving road and transportation networks',
        'Enhancing urban infrastructure',
        'Rural development initiatives',
        'Water resource management',
        'Smart city development',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaGraduationCap,
      title: 'Social Welfare',
      points: [
        'Education and skill development programs',
        'Healthcare accessibility and quality',
        'Support for farmers and agricultural workers',
        'Women\'s empowerment initiatives',
        'Youth development programs',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaBalanceScale,
      title: 'Good Governance',
      points: [
        'Transparency in administration',
        'Accountability of public officials',
        'Citizen-centric services',
        'Anti-corruption measures',
        'Efficient government operations',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaLeaf,
      title: 'Telugu Cultural Pride',
      points: [
        'Preservation of Telugu language and culture',
        'Support for arts and literature',
        'Cultural festivals and celebrations',
        'Heritage conservation',
        'Promotion of Telugu identity',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
    {
      icon: FaUsers,
      title: 'Community Engagement',
      points: [
        'Regular constituent meetings',
        'Public forums and town halls',
        'Grassroots organization building',
        'Volunteer mobilization',
        'Youth and women leadership programs',
      ],
      color: 'from-tdp-yellow to-tdp-dark-yellow',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Political Leadership - Hari Krishna Talikota | iTDP Telangana State President</title>
        <meta name="description" content="Learn about Hari Krishna Talikota's political vision, focus areas, and leadership as iTDP Telangana State President." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-tdp-yellow text-gray-900 pt-20">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Political Leadership</h1>
            <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto font-semibold">
              iTDP Telangana State President - Leading with Vision, Serving with Dedication
            </p>
          </motion.div>
        </div>
      </section>

      {/* Introduction */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-6"
          >
            <h2 className="text-4xl font-bold text-gray-900">Leading Telangana's Development</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto"></div>
            <p className="text-xl text-gray-700 leading-relaxed">
              As the iTDP Telangana State President, Hari Krishna Talikota leads the Telugu Desam Party's efforts in Telangana, working to advance the party's vision of development, good governance, and Telugu pride. His political work focuses on representing the interests of Telangana's citizens and building a stronger, more prosperous state.
            </p>
          </motion.div>
        </div>
      </section>

      {/* TDP Heritage */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">About Telugu Desam Party</h2>
              <div className="w-24 h-1 bg-tdp-yellow mx-auto"></div>
            </div>
            
            <div className="space-y-6 bg-white rounded-2xl shadow-xl p-8 border-t-4 border-tdp-yellow">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Party Heritage</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  The Telugu Desam Party was founded in 1982 by legendary actor and statesman N.T. Rama Rao (NTR) with the vision of promoting Telugu self-respect and regional development. Under the current leadership of N. Chandrababu Naidu, the party continues to champion development-oriented governance and technological innovation.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Key Facts</h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start space-x-3">
                    <span className="text-tdp-yellow font-bold text-xl">•</span>
                    <span><strong>Founded:</strong> March 29, 1982</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-tdp-yellow font-bold text-xl">•</span>
                    <span><strong>Founder:</strong> N.T. Rama Rao (NTR)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-tdp-yellow font-bold text-xl">•</span>
                    <span><strong>National President:</strong> N. Chandrababu Naidu</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-tdp-yellow font-bold text-xl">•</span>
                    <span><strong>Working President:</strong> Nara Lokesh (2026)</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <span className="text-tdp-yellow font-bold text-xl">•</span>
                    <span><strong>Party Colors:</strong> Yellow and Green</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Political Focus Areas */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Political Focus Areas</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Comprehensive initiatives for the development and prosperity of Telangana
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {focusAreas.map((area, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-tdp-yellow"
              >
                <div className={`w-16 h-16 bg-tdp-yellow rounded-xl flex items-center justify-center text-gray-900 text-3xl mb-4`}>
                  <area.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{area.title}</h3>
                <ul className="space-y-2">
                  {area.points.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-gray-600 text-sm">
                      <span className="text-tdp-yellow font-bold mt-1">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Involved CTA */}
      <section className="section-padding bg-tdp-yellow text-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold">Get Involved</h2>
            <p className="text-xl font-semibold text-gray-800">
              Join the Telugu Desam Party and contribute to building a better Telangana. Be part of a movement dedicated to Telugu pride and regional development.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 text-left shadow-lg">
                <h3 className="text-xl font-bold mb-3">Party Membership</h3>
                <p className="mb-4 text-gray-700">
                  Join TDP and be part of the change you want to see in Telangana.
                </p>
                <Link to="/contact" className="bg-gray-900 text-white font-bold py-3 px-6 rounded-full hover:bg-gray-800 transition-all duration-300 inline-flex items-center gap-2">
                  Join Now <FaArrowRight />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 text-left shadow-lg">
                <h3 className="text-xl font-bold mb-3">Volunteer</h3>
                <p className="mb-4 text-gray-700">
                  Support party activities and make a difference in your community.
                </p>
                <Link to="/contact" className="border-2 border-gray-900 text-gray-900 font-bold py-3 px-6 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-300 inline-flex items-center gap-2">
                  Volunteer <FaArrowRight />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Political
