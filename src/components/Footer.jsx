import { Link } from 'react-router-dom'
import { FaInstagram, FaFacebook, FaTwitter, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHeart } from 'react-icons/fa'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Political Leadership', path: '/political' },
    { name: 'Community Service', path: '/community' },
  ]

  const resources = [
    { name: 'Media & Updates', path: '/media' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Use', path: '/terms' },
  ]

  const socialLinks = [
    { icon: FaInstagram, url: 'https://www.instagram.com/hari_krishna_talikota/', label: 'Instagram', color: 'hover:text-pink-500' },
    { icon: FaFacebook, url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/', label: 'Facebook', color: 'hover:text-blue-600' },
    { icon: FaTwitter, url: 'https://x.com/THK_iTDP', label: 'Twitter', color: 'hover:text-blue-400' },
  ]

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-tdp rounded-full flex items-center justify-center font-bold text-white text-xl">
                HK
              </div>
              <div>
                <h3 className="text-lg font-bold">Hari Krishna Talikota</h3>
                <p className="text-sm text-gray-400">iTDP Telangana President</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Dedicated to serving the people of Telangana through principled political leadership and community service. Working for Telugu pride and regional development.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className={`text-gray-400 ${social.color} transition-colors text-xl`}
                >
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-tdp-yellow">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-tdp-yellow transition-colors text-sm inline-block hover:translate-x-1 duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-tdp-yellow">Resources</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-tdp-yellow transition-colors text-sm inline-block hover:translate-x-1 duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-tdp-yellow">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm">
                <FaMapMarkerAlt className="text-tdp-yellow mt-1 flex-shrink-0" />
                <span className="text-gray-400">
                  Hyderabad, Telangana, India
                </span>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <FaEnvelope className="text-tdp-yellow flex-shrink-0" />
                <a href="mailto:contact@harikrishnatalikota.com" className="text-gray-400 hover:text-tdp-yellow transition-colors">
                  contact@harikrishnatalikota.com
                </a>
              </li>
              <li className="flex items-center space-x-3 text-sm">
                <FaPhone className="text-tdp-yellow flex-shrink-0" />
                <a href="tel:+919876543210" className="text-gray-400 hover:text-tdp-yellow transition-colors">
                  +91 98765 43210
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Hari Krishna Talikota. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm flex items-center">
              Made with <FaHeart className="text-red-500 mx-1" /> for the people of Telangana
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
