import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaHandsHelping, FaHeart, FaUsers, FaCalendarAlt, FaBook, FaLandmark } from 'react-icons/fa'

const Community = () => {
  const responsibilities = [
    {
      icon: FaLandmark,
      title: 'Temple Administration',
      points: [
        'Overseeing day-to-day temple operations',
        'Ensuring quality of devotee services',
        'Managing temple staff and resources',
        'Maintaining temple facilities and infrastructure',
      ],
    },
    {
      icon: FaHandsHelping,
      title: 'Financial Stewardship',
      points: [
        'Transparent management of temple funds',
        'Proper utilization of donations',
        'Financial planning and budgeting',
        'Audit and accountability',
      ],
    },
    {
      icon: FaUsers,
      title: 'Devotee Services',
      points: [
        'Improving darshan facilities',
        'Accommodation for pilgrims',
        'Food services (Annadanam)',
        'Special services for elderly and differently-abled',
      ],
    },
    {
      icon: FaBook,
      title: 'Cultural Preservation',
      points: [
        'Maintaining traditional rituals and ceremonies',
        'Supporting temple festivals and celebrations',
        'Preserving temple heritage and architecture',
        'Promoting religious education',
      ],
    },
  ]

  const festivals = [
    {
      name: 'Vasantha Navaratri',
      description: 'Spring festival celebrating the goddess with nine days of special rituals and celebrations',
      icon: '🌸',
    },
    {
      name: 'Sharad Navaratri',
      description: 'Autumn festival with grand celebrations attracting millions of devotees',
      icon: '🪔',
    },
    {
      name: 'Ugadi',
      description: 'Telugu New Year celebrations with traditional customs and festivities',
      icon: '🎊',
    },
    {
      name: 'Special Poojas',
      description: 'Various religious ceremonies and rituals conducted throughout the year',
      icon: '🙏',
    },
  ]

  return (
    <>
      <Helmet>
        <title>Community Service - Hari Krishna Talikota | Sri Kanaka Durga Devasthanam Board Member</title>
        <meta name="description" content="Learn about Hari Krishna Talikota's community service as Board Member of Sri Kanaka Durga Devasthanam, Vijayawada." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-tdp-yellow text-gray-900 pt-20">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Community Service</h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto font-semibold text-gray-800">
              Board Member - Sri Kanaka Durga Devasthanam, Vijayawada
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
            <h2 className="text-4xl font-bold text-gray-900">Preserving Heritage, Serving Devotees</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto"></div>
            <p className="text-xl text-gray-700 leading-relaxed">
              Hari Krishna Talikota serves as a Board Member of the Sri Kanaka Durga Devasthanam (Sri Durga Malleswara Swamy Varla Devasthanam) in Vijayawada, one of the most revered Hindu temples in South India. This role reflects his commitment to preserving religious and cultural traditions while ensuring excellent service to devotees.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Temple Information */}
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">About Sri Kanaka Durga Temple</h2>
              <div className="w-24 h-1 bg-tdp-yellow mx-auto"></div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8 border-t-4 border-tdp-yellow space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Temple Significance</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Located on the Indrakeeladri Hill on the banks of the Krishna River in Vijayawada, Andhra Pradesh, the Kanaka Durga Temple is dedicated to Goddess Kanaka Durga. The temple attracts millions of devotees annually and is particularly renowned for its Navaratri celebrations.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Historical Importance</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  The temple has a rich history spanning centuries and is considered one of the most powerful Shakti Peethas in India. It plays a central role in the spiritual and cultural life of the Telugu people.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Temple Details</h3>
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Official Name:</strong> Sri Durga Malleswara Swamy Varla Devasthanam</li>
                  <li><strong>Deity:</strong> Goddess Kanaka Durga</li>
                  <li><strong>Location:</strong> Indrakeeladri Hill, Vijayawada</li>
                  <li><strong>River:</strong> Krishna River</li>
                  <li><strong>State:</strong> Andhra Pradesh</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Board Responsibilities */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Board Responsibilities</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Ensuring excellence in temple administration and devotee services
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {responsibilities.map((resp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-tdp-yellow"
              >
                <div className="w-16 h-16 bg-tdp-yellow rounded-xl flex items-center justify-center text-gray-900 text-3xl mb-4">
                  <resp.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{resp.title}</h3>
                <ul className="space-y-2">
                  {resp.points.map((point, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-gray-600">
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

      {/* Major Festivals */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Major Temple Festivals</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              Celebrating divine traditions with millions of devotees
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {festivals.map((festival, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-tdp-yellow"
              >
                <div className="text-6xl mb-4">{festival.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{festival.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{festival.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="section-padding bg-tdp-yellow text-gray-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <FaHeart className="text-6xl mx-auto text-gray-900" />
            <h2 className="text-4xl md:text-5xl font-bold">Serving with Devotion</h2>
            <p className="text-xl leading-relaxed font-semibold text-gray-800">
              Through dedicated service on the temple board, we work to preserve our sacred traditions, enhance devotee experiences, and maintain the spiritual heritage that connects millions of Telugu people to their cultural roots.
            </p>
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-gray-900 mb-2">5M+</div>
                <div className="font-semibold">Annual Devotees</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-gray-900 mb-2">365</div>
                <div className="font-semibold">Days of Service</div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl font-bold text-gray-900 mb-2">100%</div>
                <div className="font-semibold">Commitment</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default Community
