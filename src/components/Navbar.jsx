import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBars, FaTimes, FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [location])

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Political Leadership', path: '/political' },
    { name: 'Community Service', path: '/community' },
    { name: 'Media', path: '/media' },
    { name: 'Contact', path: '/contact' },
  ]

  const socialLinks = [
    { icon: FaInstagram, url: 'https://www.instagram.com/hari_krishna_talikota/', label: 'Instagram' },
    { icon: FaFacebook, url: 'https://www.facebook.com/p/Talikota-Harikrishna-100066746782661/', label: 'Facebook' },
    { icon: FaTwitter, url: 'https://x.com/THK_iTDP', label: 'Twitter' },
  ]

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-lg py-2' : 'bg-white py-4'
      }`}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-tdp-yellow rounded-full flex items-center justify-center font-bold text-gray-900 text-xl group-hover:scale-110 transition-transform">
              HK
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900 group-hover:text-tdp-yellow transition-colors">
                Hari Krishna Talikota
              </h1>
              <p className="text-xs text-gray-600">iTDP Telangana State President</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${
                  location.pathname === link.path ? 'text-tdp-yellow after:w-full' : ''
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Social Links & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Social Links - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-gray-600 hover:text-tdp-yellow transition-colors text-xl"
                >
                  <social.icon />
                </a>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden text-gray-800 hover:text-tdp-yellow transition-colors p-2"
              aria-label="Toggle menu"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block py-2 px-4 rounded-lg transition-colors ${
                      location.pathname === link.path
                        ? 'bg-tdp-yellow text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                
                {/* Mobile Social Links */}
                <div className="flex items-center justify-center space-x-6 pt-4 border-t">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-gray-600 hover:text-tdp-yellow transition-colors text-2xl"
                    >
                      <social.icon />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

export default Navbar
