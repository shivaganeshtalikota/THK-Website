import {
  FaGavel, FaUsers, FaHandshake, FaHeart, FaChartLine, FaAward,
  FaRoad, FaGraduationCap, FaBalanceScale, FaLeaf,
  FaLandmark, FaCoins, FaHandsHelping, FaOm,
} from 'react-icons/fa'

/** Name -> icon, so content files (src/data/*) stay free of JSX imports. */
const icons = {
  gavel: FaGavel,
  users: FaUsers,
  handshake: FaHandshake,
  heart: FaHeart,
  chart: FaChartLine,
  award: FaAward,
  road: FaRoad,
  graduation: FaGraduationCap,
  balance: FaBalanceScale,
  leaf: FaLeaf,
  landmark: FaLandmark,
  coins: FaCoins,
  helping: FaHandsHelping,
  om: FaOm,
}

const Icon = ({ name, className }) => {
  const Glyph = icons[name] ?? FaAward
  return <Glyph className={className} aria-hidden="true" focusable="false" />
}

export default Icon
