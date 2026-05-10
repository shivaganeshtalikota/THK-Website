import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaAward, FaHandshake, FaHeart, FaUsers, FaGavel, FaChartLine } from 'react-icons/fa'

const About = () => {
  const values = [
    {
      icon: FaGavel,
      title: 'Integrity in Public Service',
      description: 'Maintaining the highest standards of honesty and ethical conduct in all political activities.',
    },
    {
      icon: FaUsers,
      title: 'Service to Community',
      description: 'Putting the needs of constituents first and working tirelessly for their welfare.',
    },
    {
      icon: FaHandshake,
      title: 'Transparency & Accountability',
      description: 'Open communication and taking responsibility for all actions and decisions.',
    },
    {
      icon: FaHeart,
      title: 'Cultural Preservation',
      description: 'Protecting and promoting Telugu language, culture, and heritage.',
    },
    {
      icon: FaChartLine,
      title: 'Development & Progress',
      description: 'Driving economic growth and infrastructure development for a better future.',
    },
    {
      icon: FaAward,
      title: 'Good Governance',
      description: 'Ensuring efficient, transparent, and citizen-centric administration.',
    },
  ]

  return (
    <>
      <Helmet>
        <title>About - Hari Krishna Talikota | iTDP Telangana State President</title>
        <meta name="description" content="Learn about Hari Krishna Talikota's journey, values, and commitment to serving the people of Telangana as iTDP State President." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-tdp-yellow pt-20">
        <div className="container-custom relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">About Hari Krishna Talikota</h1>
            <p className="text-xl md:text-2xl text-gray-800 max-w-3xl mx-auto font-semibold">
              A dedicated leader committed to serving the people of Telangana with integrity, passion, and vision
            </p>
          </motion.div>
        </div>
      </section>

      {/* Biography Section */}
      <section className="section-padding bg-white">
        <div className="container-custom max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">Political Biography</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-8"></div>
            
            <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
              <p>
                Hari Krishna Talikota is a dedicated political leader and community servant who has committed his life to advancing the interests of the Telugu people. As the iTDP Telangana State President, he leads the Telugu Desam Party's efforts in Telangana, working to promote development, good governance, and Telugu cultural pride.
              </p>
              
              <p>
                His commitment to public service extends beyond politics to his role as a Board Member of the prestigious Sri Kanaka Durga Devasthanam in Vijayawada, one of South India's most revered temples. This role reflects his deep commitment to preserving cultural and religious traditions while ensuring excellent service to millions of devotees.
              </p>
              
              <p>
                As the iTDP Telangana State President, Hari Krishna represents the Telugu Desam Party's vision in Telangana. He is committed to the party's founding principles established by the legendary N.T. Rama Rao - Telugu pride, regional development, and good governance.
              </p>
              
              <p>
                His political work focuses on creating economic opportunities, improving infrastructure, and ensuring that the voices of Telangana's citizens are heard at all levels of government.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">Vision for Telangana</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-8"></div>
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-t-4 border-tdp-yellow">
              <p className="text-xl text-gray-700 leading-relaxed text-center">
                Hari Krishna envisions a Telangana that honors its rich Telugu heritage while embracing modern development. His focus is on creating economic opportunities for youth, improving infrastructure, ensuring good governance, and preserving the cultural identity that makes Telangana unique.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Core Values</h2>
            <div className="w-24 h-1 bg-tdp-yellow mx-auto mb-6"></div>
            <p className="section-subtitle">
              The principles that guide every decision and action in service to the people
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-t-4 border-tdp-yellow"
              >
                <div className="w-16 h-16 bg-tdp-yellow rounded-full flex items-center justify-center text-gray-900 text-3xl mx-auto mb-4">
                  <value.icon />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed text-center">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TDP Legacy */}
      <section className="section-padding bg-tdp-yellow text-gray-900">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold mb-6">Carrying Forward NTR's Legacy</h2>
              <div className="w-24 h-1 bg-gray-900 mx-auto mb-8"></div>
              <p className="text-xl leading-relaxed mb-6 font-semibold text-gray-800">
                The Telugu Desam Party was founded in 1982 by legendary actor and statesman N.T. Rama Rao (NTR) with the vision of promoting Telugu self-respect and regional development.
              </p>
              <p className="text-lg leading-relaxed text-gray-800">
                Under the current leadership of N. Chandrababu Naidu, the party continues to champion development-oriented governance and technological innovation. As iTDP Telangana State President, Hari Krishna upholds these founding principles while adapting to the modern needs of Telangana's citizens.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Party Principles</h3>
              <ul className="grid md:grid-cols-2 gap-4">
                {[
                  'Telugu cultural identity and pride',
                  'Economic development and industrialization',
                  'Good governance and transparency',
                  'Social welfare and inclusive growth',
                  'Technology-driven administration',
                  'Infrastructure development',
                ].map((principle, index) => (
                  <li key={index} className="flex items-start space-x-3 text-gray-700">
                    <span className="w-2 h-2 bg-gray-900 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
