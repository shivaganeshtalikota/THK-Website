import {
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaYoutube,
  FaWhatsapp,
  FaTelegram,
  FaThreads,
  FaLinkedinIn,
  FaLink,
} from 'react-icons/fa6'

/**
 * The icon for a social account, by its name.
 *
 * One map for the whole site, with a fallback. The office can add accounts
 * from the admin panel under any name; four copies of a four-entry map meant
 * an account called "Threads" would have rendered `undefined` as a component
 * and taken the navigation down with it.
 */
const GLYPHS = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  x: FaXTwitter,
  twitter: FaXTwitter,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  telegram: FaTelegram,
  threads: FaThreads,
  linkedin: FaLinkedinIn,
}

export const socialGlyph = (name) => GLYPHS[String(name || '').trim().toLowerCase()] || FaLink
